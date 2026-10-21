import { asNumber } from './customer-contract'
import { mediaUrl, requireDb } from './supabase'

export type PublicPackage = {
  id: string
  title: string
  description: string
  price: number | null
  duration: number | null
  imageUrl: string | null
  hotelInfo: string
  transportation: string
  seasonLabel: string
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>
  return {}
}

function text(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function mapPackage(value: unknown, priceRequired: boolean): PublicPackage {
  const row = asRecord(value)
  const rawPrice = row.price_sar
  const rawDuration = row.duration_days
  return {
    id: text(row.id),
    title: text(row.title),
    description: text(row.description),
    price: rawPrice == null || rawPrice === '' ? (priceRequired ? 0 : null) : asNumber(rawPrice),
    duration: rawDuration == null || rawDuration === '' ? null : asNumber(rawDuration),
    imageUrl: mediaUrl(typeof row.image_path === 'string' ? row.image_path : null),
    hotelInfo: text(row.hotel_info),
    transportation: text(row.transportation),
    seasonLabel: text(row.season_label),
  }
}

export async function listPublishedUmrahPackages() {
  const { data, error } = await requireDb()
    .from('umrah_packages')
    .select('id, title, description, price_sar, duration_days, hotel_info, transportation, image_path')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((row) => mapPackage(row, true)).filter((row) => row.id && row.title)
}

export async function listPublishedHajjPrograms() {
  const { data, error } = await requireDb()
    .from('hajj_programs')
    .select('id, title, description, season_label, price_sar, duration_days, hotel_info, transportation, image_path')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((row) => mapPackage(row, false)).filter((row) => row.id && row.title)
}
