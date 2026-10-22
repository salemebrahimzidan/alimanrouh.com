import { requireDb, supabase } from './supabase'

type BundleHost = {
  addResourceBundle: (lng: string, ns: string, resources: object, deep?: boolean, overwrite?: boolean) => unknown
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>
  return {}
}

function setPath(root: Record<string, unknown>, path: string, value: string) {
  const parts = path.split('.')
  let node = root
  for (let index = 0; index < parts.length - 1; index += 1) {
    const part = parts[index]
    const next = node[part]
    if (!next || typeof next !== 'object' || Array.isArray(next)) node[part] = {}
    node = node[part] as Record<string, unknown>
  }
  node[parts[parts.length - 1]] = value
}

export function applySiteCopy(host: BundleHost, rows: unknown[]) {
  const bundles: Record<'ar' | 'en', Record<string, Record<string, unknown>>> = { ar: {}, en: {} }
  for (const row of rows) {
    const content = asRecord(row)
    for (const lang of ['ar', 'en'] as const) {
      for (const [key, value] of Object.entries(asRecord(content[lang]))) {
        if (typeof value !== 'string') continue
        const text = value.trim()
        const dot = key.indexOf('.')
        if (!text || dot <= 0) continue
        const ns = key.slice(0, dot)
        const path = key.slice(dot + 1)
        if (!/^[a-z]+$/.test(ns) || !/^[A-Za-z0-9.]+$/.test(path)) continue
        const tree = bundles[lang][ns] ?? {}
        bundles[lang][ns] = tree
        setPath(tree, path, text)
      }
    }
  }
  for (const lang of ['ar', 'en'] as const) {
    for (const [ns, bundle] of Object.entries(bundles[lang])) {
      host.addResourceBundle(lang, ns, bundle, true, true)
    }
  }
}

export async function loadAndApplySiteCopy(host: BundleHost) {
  if (!supabase) return
  const { data, error } = await requireDb()
    .from('website_content')
    .select('title, body')
    .eq('is_published', true)
    .like('title', 'site:%')
  if (error || !data) return
  const ar: Record<string, string> = {}
  const en: Record<string, string> = {}
  for (const item of data) {
    const row = asRecord(item)
    const title = typeof row.title === 'string' ? row.title : ''
    if (!title.startsWith('site:')) continue
    let parsed: unknown
    try {
      parsed = JSON.parse(typeof row.body === 'string' ? row.body : '')
    } catch {
      continue
    }
    const packed = asRecord(parsed)
    if (typeof packed.ar !== 'string' || typeof packed.en !== 'string') continue
    const fieldId = title.slice('site:'.length)
    ar[fieldId] = packed.ar
    en[fieldId] = packed.en
  }
  applySiteCopy(host, [{ ar, en }])
}
