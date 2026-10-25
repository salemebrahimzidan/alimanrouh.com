import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { handleGuestSupport } from '../api/support/guest.js'

const source = readFileSync(new URL('../api/support/guest.js', import.meta.url), 'utf8')
const validConversationId = '00000000-0000-4000-8000-000000000001'
const validToken = 'a'.repeat(64)

function makeRequest(operation, body = {}, headers = {}) {
  return new Request('https://alimanrouh.com/api/support/guest', {
    method: 'POST',
    headers: {
      Origin: 'https://alimanrouh.com',
      'Content-Type': 'application/json',
      'X-Vercel-Id': 'iad1::request-id',
      'X-Real-Ip': '203.0.113.7',
      'X-Forwarded-For': '198.51.100.99',
      ...headers,
    },
    body: JSON.stringify({ operation, ...body }),
  })
}

function makeDependencies({ success = true, failRateLimiter = false } = {}) {
  const limitedIps = []
  const supabaseCalls = []
  const rateLimiters = Object.fromEntries(['create', 'get', 'reply'].map((operation) => [
    operation,
    {
      async limit(ip) {
        limitedIps.push({ operation, ip })
        if (failRateLimiter) throw new Error('rate store unavailable')
        return { success }
      },
    },
  ]))
  return {
    limitedIps,
    supabaseCalls,
    dependencies: {
      rateLimiters,
      createSupabaseClient(url, key, options) {
        supabaseCalls.push({ url, key, options })
        return {
          async rpc(name, parameters) {
            supabaseCalls.push({ name, parameters })
            return { data: { ok: true }, error: null }
          },
        }
      },
    },
  }
}

const env = {
  VERCEL: '1',
  SUPPORT_PUBLIC_ORIGIN: 'https://alimanrouh.com',
  SUPABASE_URL: 'https://project.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'server-only-secret',
  UPSTASH_REDIS_REST_URL: 'https://redis.example',
  UPSTASH_REDIS_REST_TOKEN: 'redis-server-secret',
}

test('all guest operations call only their fixed service-role RPC after rate limiting', async () => {
  const cases = [
    ['create', {
      name: 'Guest',
      email: 'guest@example.test',
      phone: '',
      subject: 'Question',
      body: 'Message',
      topic: 'general',
    }, 'support_create_guest_conversation'],
    ['get', { conversation_id: validConversationId, access_token: validToken }, 'support_guest_get_conversation'],
    ['reply', {
      conversation_id: validConversationId,
      access_token: validToken,
      body: 'Reply',
    }, 'support_guest_reply'],
  ]

  for (const [operation, payload, rpc] of cases) {
    const { dependencies, limitedIps, supabaseCalls } = makeDependencies()
    const response = await handleGuestSupport(makeRequest(operation, payload), env, dependencies)
    assert.equal(response.status, 200)
    assert.equal(limitedIps.length, 1)
    assert.deepEqual(limitedIps[0], { operation, ip: '203.0.113.7' })
    assert.equal(supabaseCalls[0].url, env.SUPABASE_URL)
    assert.equal(supabaseCalls[0].key, env.SUPABASE_SERVICE_ROLE_KEY)
    assert.equal(supabaseCalls[1].name, rpc)
    assert.equal((await response.text()).includes('server-only-secret'), false)
  }
})

test('uses the Vercel IP helper result and never parses forwarding headers directly', async () => {
  const { dependencies, limitedIps } = makeDependencies()
  const response = await handleGuestSupport(makeRequest('get', {
    conversation_id: validConversationId,
    access_token: validToken,
  }, {
    'X-Real-Ip': '198.51.100.99',
    'X-Forwarded-For': '198.51.100.99, 192.0.2.55',
  }), env, {
    ...dependencies,
    ipAddress: () => '203.0.113.31',
  })

  assert.equal(response.status, 200)
  assert.deepEqual(limitedIps[0], { operation: 'get', ip: '203.0.113.31' })
  assert.match(source, /import \{ ipAddress \} from '@vercel\/functions'/)
  assert.match(source, /env\.VERCEL === '1' && Boolean\(request\.headers\.get\('x-vercel-id'\)\)/)
  assert.doesNotMatch(source, /headers\.get\(['"]x-forwarded-for['"]/)
})

test('fails closed if the request is not verified as Vercel ingress', async () => {
  const { dependencies, limitedIps, supabaseCalls } = makeDependencies()
  const response = await handleGuestSupport(makeRequest('create', {
    name: 'Guest',
    email: 'guest@example.test',
    phone: '',
    subject: 'Question',
    body: 'Message',
    topic: 'general',
  }, { 'X-Vercel-Id': '' }), { ...env, VERCEL: undefined }, dependencies)

  assert.equal(response.status, 503)
  assert.equal(limitedIps.length, 0)
  assert.equal(supabaseCalls.length, 0)
})

test('fails closed when Upstash is unconfigured or unavailable', async () => {
  const unconfigured = await handleGuestSupport(makeRequest('reply', {
    conversation_id: validConversationId,
    access_token: validToken,
    body: 'Reply',
  }), { ...env, UPSTASH_REDIS_REST_TOKEN: undefined }, {
    isVercelIngress: () => true,
    ipAddress: () => '203.0.113.7',
    createSupabaseClient: () => assert.fail('Supabase must not be called'),
  })
  assert.equal(unconfigured.status, 503)

  const { dependencies, supabaseCalls } = makeDependencies({ failRateLimiter: true })
  const unavailable = await handleGuestSupport(makeRequest('reply', {
    conversation_id: validConversationId,
    access_token: validToken,
    body: 'Reply',
  }), env, dependencies)
  assert.equal(unavailable.status, 503)
  assert.equal(supabaseCalls.length, 0)
})

test('fails closed when server-only Supabase credentials are missing', async () => {
  const response = await handleGuestSupport(makeRequest('create', {
    name: 'Guest',
    email: 'guest@example.test',
    phone: '',
    subject: 'Question',
    body: 'Message',
    topic: 'general',
  }), { ...env, SUPABASE_SERVICE_ROLE_KEY: undefined }, {
    isVercelIngress: () => true,
    ipAddress: () => '203.0.113.7',
    rateLimiters: Object.fromEntries(['create', 'get', 'reply'].map((operation) => [
      operation,
      { limit: async () => ({ success: true }) },
    ])),
    createSupabaseClient: () => assert.fail('Supabase must not be called without server credentials'),
  })

  assert.equal(response.status, 503)
})

test('rejects rate-limited and cross-origin requests before calling Supabase', async () => {
  const limited = makeDependencies({ success: false })
  const rateResponse = await handleGuestSupport(makeRequest('create', {
    name: 'Guest',
    email: 'guest@example.test',
    phone: '',
    subject: 'Question',
    body: 'Message',
    topic: 'general',
  }), env, limited.dependencies)
  assert.equal(rateResponse.status, 429)
  assert.equal(limited.supabaseCalls.length, 0)

  const denied = makeDependencies()
  const originResponse = await handleGuestSupport(makeRequest('create', {
    name: 'Guest',
    email: 'guest@example.test',
    phone: '',
    subject: 'Question',
    body: 'Message',
    topic: 'general',
  }, { Origin: 'https://attacker.example' }), env, denied.dependencies)
  assert.equal(originResponse.status, 403)
  assert.equal(denied.limitedIps.length, 0)
  assert.equal(denied.supabaseCalls.length, 0)
})

test('shared limiter independently throttles concurrent requests per operation and IP', async () => {
  const counts = new Map()
  const { dependencies, supabaseCalls } = makeDependencies()
  const limiters = Object.fromEntries(['create', 'get', 'reply'].map((operation) => [
    operation,
    {
      async limit(ip) {
        const key = `${operation}:${ip}`
        const count = (counts.get(key) ?? 0) + 1
        counts.set(key, count)
        return { success: count <= 5 }
      },
    },
  ]))
  const responses = await Promise.all(Array.from({ length: 12 }, () => handleGuestSupport(makeRequest('create', {
    name: 'Guest',
    email: 'burst@example.test',
    phone: '',
    subject: 'Question',
    body: 'Message',
    topic: 'general',
  }), env, { ...dependencies, rateLimiters: limiters })))

  assert.equal(responses.filter((response) => response.status === 200).length, 5)
  assert.equal(responses.filter((response) => response.status === 429).length, 7)
  assert.equal(supabaseCalls.filter((call) => call.name === 'support_create_guest_conversation').length, 5)
  assert.match(source, /Ratelimit\.slidingWindow/)
  assert.match(source, /@upstash\/ratelimit/)
  assert.match(source, /@upstash\/redis/)
})
