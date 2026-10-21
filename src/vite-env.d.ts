/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  /** Public anon or publishable key. Never a service-role or secret key. */
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string
  readonly VITE_WEB3FORMS_ACCESS_KEY?: string
  /** Production site origin, e.g. https://alimanrouh.com (optional; form uses window.location in browser) */
  readonly VITE_SITE_URL?: string
  /** Full Google Maps embed iframe src (optional; overrides address-based map on contact page) */
  readonly VITE_GOOGLE_MAPS_EMBED_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
