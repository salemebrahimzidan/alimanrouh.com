import { ipAddress } from '@vercel/functions'
import { createClient } from '@supabase/supabase-js'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { isIP } from 'node:net'

const bodyLimitBytes = 10_000
const limits = {
  create: { requests: 10, window: '10 m', rpc: 'support_create_guest_conversation' },
  get: { requests: 120, window: '10 m', rpc: 'support_guest_get_conversation' },
  reply: { requests: 60, window: '10 m', rpc: 'support_guest_reply' },
}
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const tokenPattern = /^[0-9a-f]{64}$/i

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

function logFailure(event) {
  console.error(`[support-guest-api] ${event}`)
}

function validPayload(operation, body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return false
  if (operation === 'create') {
    return ['name', 'email', 'phone', 'subject', 'body', 'topic']
      .every((field) => typeof body[field] === 'string')
  }
  if (!uuidPattern.test(body.conversation_id ?? '') || !tokenPattern.test(body.access_token ?? '')) {
    return false
  }
  return operation === 'get' || typeof body.body === 'string'
}

function rpcParameters(operation, body) {
  if (operation === 'create') {
    return {
      p_name: body.name,
      p_email: body.email,
      p_phone: body.phone,
      p_subject: body.subject,
      p_body: body.body,
      p_topic: body.topic,
      p_context: body.context ?? null,
    }
  }
  if (operation === 'get') {
    return {
      p_conversation_id: body.conversation_id,
      p_access_token: body.access_token,
    }
  }
  return {
    p_conversation_id: body.conversation_id,
    p_access_token: body.access_token,
    p_body: body.body,
  }
}

function createRateLimiters(env, redisFactory = (url, token) => new Redis({ url, token })) {
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error('Upstash rate limiting is not configured')
  }
  const redis = redisFactory(env.UPSTASH_REDIS_REST_URL, env.UPSTASH_REDIS_REST_TOKEN)
  return Object.fromEntries(Object.entries(limits).map(([operation, config]) => [
    operation,
    new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(config.requests, config.window),
      prefix: `alimanrouh:support:guest:${operation}`,
      analytics: false,
    }),
  ]))
}

function allowedOrigin(request, env) {
  const configuredOrigin = env.SUPPORT_PUBLIC_ORIGIN
  const requestOrigin = request.headers.get('Origin')
  if (!configuredOrigin || !requestOrigin) return false
  try {
    return new URL(requestOrigin).origin === new URL(configuredOrigin).origin
  } catch {
    return false
  }
}

async function readJson(request) {
  const reader = request.body?.getReader()
  if (!reader) return { invalid: true }
  const chunks = []
  let totalBytes = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      totalBytes += value.byteLength
      if (totalBytes > bodyLimitBytes) {
        await reader.cancel()
        return { tooLarge: true }
      }
      chunks.push(value)
    }
    const raw = new Uint8Array(totalBytes)
    let offset = 0
    for (const chunk of chunks) {
      raw.set(chunk, offset)
      offset += chunk.byteLength
    }
    return { body: JSON.parse(new TextDecoder().decode(raw)) }
  } catch {
    return { invalid: true }
  }
}

async function handleGuestSupport(request, env, dependencies = {}) {
  if (request.method !== 'POST') return json({ message: 'Method not allowed.' }, 405)
  if (!allowedOrigin(request, env)) return json({ message: 'Origin is not allowed.' }, 403)
  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) {
    return json({ message: 'JSON content is required.' }, 415)
  }
  if (request.headers.get('Sec-Fetch-Site') === 'cross-site') {
    return json({ message: 'Cross-site requests are not allowed.' }, 403)
  }

  const parsed = await readJson(request)
  if (parsed.tooLarge) return json({ message: 'Request is too large.' }, 413)
  if (parsed.invalid) return json({ message: 'Invalid JSON request.' }, 400)
  const body = parsed.body
  const operation = body?.operation
  if (!Object.hasOwn(limits, operation) || !validPayload(operation, body)) {
    return json({ message: 'Invalid guest support request.' }, 400)
  }

  const verifiedVercelIngress = dependencies.isVercelIngress
    ? dependencies.isVercelIngress(request, env)
    : env.VERCEL === '1' && Boolean(request.headers.get('x-vercel-id'))
  if (!verifiedVercelIngress) return json({ message: 'Trusted request IP is unavailable.' }, 503)

  let clientIp
  try {
    clientIp = (dependencies.ipAddress ?? ipAddress)(request)
  } catch {
    return json({ message: 'Trusted request IP is unavailable.' }, 503)
  }
  if (!clientIp || !isIP(clientIp)) return json({ message: 'Trusted request IP is unavailable.' }, 503)

  let limiter
  try {
    const rateLimiters = dependencies.rateLimiters ?? createRateLimiters(env, dependencies.redisFactory)
    limiter = rateLimiters[operation]
    const result = await limiter.limit(clientIp)
    if (!result.success) return json({ message: 'Too many support requests; try again later.' }, 429)
  } catch {
    logFailure('rate limiter failed')
    return json({ message: 'Guest support is temporarily unavailable.' }, 503)
  }

  const supabaseUrl = env.SUPABASE_URL
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ message: 'Guest support is not configured.' }, 503)
  }

  try {
    const client = (dependencies.createSupabaseClient ?? createClient)(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })
    const { data, error } = await client.rpc(limits[operation].rpc, rpcParameters(operation, body))
    if (error) {
      if (error.message?.toLowerCase().includes('too many support requests')) {
        return json({ message: 'Too many support requests; try again later.' }, 429)
      }
      if (error.code === '42501') return json({ message: 'Guest conversation was not found or access is invalid.' }, 404)
      if (error.code === '22023') return json({ message: 'Please check the submitted details and try again.' }, 400)
      logFailure('Supabase guest RPC returned an unexpected error')
      return json({ message: 'Guest support is temporarily unavailable.' }, 502)
    }
    return json(data, 200)
  } catch {
    logFailure('Supabase guest RPC request failed')
    return json({ message: 'Guest support is temporarily unavailable.' }, 502)
  }
}

export { handleGuestSupport, createRateLimiters, rpcParameters, validPayload }

export default {
  fetch(request) {
    return handleGuestSupport(request, process.env)
  },
}
