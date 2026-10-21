import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL?.trim() ?? ''
const anonKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  ''
)

export const supabaseConfigured = url.startsWith('https://') && url.includes('.supabase.co') && anonKey.length > 20

export const supabase: SupabaseClient | null = supabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'alimanrouh-public-auth',
      },
    })
  : null

export function requireDb() {
  if (!supabase) throw new Error('supabase is not configured')
  return supabase
}

export function mediaUrl(path: string | null | undefined) {
  if (!path || path.includes('://') || path.startsWith('/') || path.includes('..')) return null
  if (!supabase) return null
  const { data } = supabase.storage.from('public-media').getPublicUrl(path)
  return data.publicUrl
}
