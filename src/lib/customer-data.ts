import { bookingInsertRow } from './customer-contract'
import { requireDb } from './supabase'

export type OwnProfile = {
  id: string
  full_name: string
  mobile: string
  email: string | null
  account_status: string
  created_at: string
}

export type OwnBooking = {
  id: string
  reference: string
  package_title_snapshot: string
  travel_date: string
  travelers_count: number
  total_amount: number
  status: string
  customer_note: string
  created_at: string
}

export type StatusEvent = {
  id: string
  old_status: string | null
  new_status: string
  note: string | null
  created_at: string
}

export type OwnPayment = {
  id: string
  amount: number
  method: string
  status: string
  paid_on: string
  note: string
}

export type OwnVisa = {
  id: string
  reference: string
  full_name: string
  mobile: string
  passport_number: string
  nationality: string
  requested_travel_date: string | null
  customer_note: string
  status: string
  created_at: string
}

export type OwnDocument = {
  id: string
  visa_application_id: string | null
  storage_path: string
  file_name: string
  mime_type: string
  created_at: string
}

export type OwnInquiry = {
  id: string
  program_id: string | null
  program_title: string | null
  message: string
  travelers_count: number
  internal_status: string
  created_at: string
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>
  return {}
}

function text(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function numberValue(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return 0
}

export async function getOwnProfile(userId: string): Promise<OwnProfile | null> {
  const { data, error } = await requireDb()
    .from('profiles')
    .select('id, full_name, mobile, email, account_status, created_at')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  const row = asRecord(data)
  return {
    id: text(row.id),
    full_name: text(row.full_name),
    mobile: text(row.mobile),
    email: row.email == null ? null : text(row.email),
    account_status: text(row.account_status),
    created_at: text(row.created_at),
  }
}

export async function updateOwnProfile(userId: string, input: { fullName: string; mobile: string }) {
  const fullName = input.fullName.trim()
  const mobile = input.mobile.trim()
  const db = requireDb()
  const { error } = await db.from('profiles').update({ full_name: fullName, mobile }).eq('id', userId)
  if (error) throw error
  const { error: authError } = await db.auth.updateUser({ data: { full_name: fullName, mobile } })
  if (authError) throw authError
}

export async function createUmrahBooking(input: {
  userId: string
  packageId: string
  travelDate: string
  adults: number
  children: number
  note: string
}) {
  const { data, error } = await requireDb()
    .from('bookings')
    .insert(bookingInsertRow(input))
    .select('id, reference, total_amount, status')
    .single()
  if (error) throw error
  const row = asRecord(data)
  return {
    id: text(row.id),
    reference: text(row.reference),
    totalAmount: numberValue(row.total_amount),
    status: text(row.status),
  }
}

export async function listOwnBookings(userId: string) {
  const { data, error } = await requireDb()
    .from('booking_rows')
    .select('id, reference, customer_id, package_title_snapshot, travel_date, travelers_count, total_amount, status, customer_note, created_at')
    .eq('customer_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((item) => {
    const row = asRecord(item)
    return {
      id: text(row.id),
      reference: text(row.reference),
      package_title_snapshot: text(row.package_title_snapshot),
      travel_date: text(row.travel_date),
      travelers_count: numberValue(row.travelers_count),
      total_amount: numberValue(row.total_amount),
      status: text(row.status),
      customer_note: text(row.customer_note),
      created_at: text(row.created_at),
    } satisfies OwnBooking
  })
}

export async function getOwnBooking(userId: string, bookingId: string) {
  const { data, error } = await requireDb()
    .from('booking_rows')
    .select('id, reference, customer_id, package_title_snapshot, travel_date, travelers_count, total_amount, status, customer_note, created_at')
    .eq('customer_id', userId)
    .eq('id', bookingId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  const row = asRecord(data)
  return {
    id: text(row.id),
    reference: text(row.reference),
    package_title_snapshot: text(row.package_title_snapshot),
    travel_date: text(row.travel_date),
    travelers_count: numberValue(row.travelers_count),
    total_amount: numberValue(row.total_amount),
    status: text(row.status),
    customer_note: text(row.customer_note),
    created_at: text(row.created_at),
  } satisfies OwnBooking
}

export async function listBookingHistory(bookingId: string) {
  const { data, error } = await requireDb()
    .from('booking_status_history')
    .select('id, booking_id, old_status, new_status, note, created_at')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map((item) => {
    const row = asRecord(item)
    return {
      id: text(row.id),
      old_status: row.old_status == null ? null : text(row.old_status),
      new_status: text(row.new_status),
      note: row.note == null ? null : text(row.note),
      created_at: text(row.created_at),
    } satisfies StatusEvent
  })
}

export async function listOwnPayments(userId: string, bookingId: string) {
  const { data, error } = await requireDb()
    .from('payments')
    .select('id, customer_id, booking_id, amount, method, status, paid_on, note')
    .eq('customer_id', userId)
    .eq('booking_id', bookingId)
    .order('paid_on', { ascending: false })
  if (error) throw error
  return (data ?? []).map((item) => {
    const row = asRecord(item)
    return {
      id: text(row.id),
      amount: numberValue(row.amount),
      method: text(row.method),
      status: text(row.status),
      paid_on: text(row.paid_on),
      note: text(row.note),
    } satisfies OwnPayment
  })
}

export async function createVisa(input: {
  userId: string
  fullName: string
  mobile: string
  passportNumber: string
  nationality: string
  travelDate: string
  note: string
}) {
  const { error } = await requireDb().from('visa_applications').insert({
    customer_id: input.userId,
    full_name: input.fullName.trim(),
    mobile: input.mobile.trim(),
    passport_number: input.passportNumber.trim(),
    nationality: input.nationality.trim(),
    requested_travel_date: input.travelDate || null,
    customer_note: input.note.trim(),
    status: 'submitted',
  })
  if (error) throw error
}

export async function listOwnVisas(userId: string) {
  const { data, error } = await requireDb()
    .from('visa_applications')
    .select('id, reference, customer_id, full_name, mobile, passport_number, nationality, requested_travel_date, customer_note, status, created_at')
    .eq('customer_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(mapVisa)
}

export async function getOwnVisa(userId: string, visaId: string) {
  const { data, error } = await requireDb()
    .from('visa_applications')
    .select('id, reference, customer_id, full_name, mobile, passport_number, nationality, requested_travel_date, customer_note, status, created_at')
    .eq('customer_id', userId)
    .eq('id', visaId)
    .maybeSingle()
  if (error) throw error
  return data ? mapVisa(data) : null
}

function mapVisa(value: unknown): OwnVisa {
  const row = asRecord(value)
  return {
    id: text(row.id),
    reference: text(row.reference),
    full_name: text(row.full_name),
    mobile: text(row.mobile),
    passport_number: text(row.passport_number),
    nationality: text(row.nationality),
    requested_travel_date: row.requested_travel_date == null ? null : text(row.requested_travel_date),
    customer_note: text(row.customer_note),
    status: text(row.status),
    created_at: text(row.created_at),
  }
}

export async function listOwnDocuments(userId: string) {
  const { data, error } = await requireDb()
    .from('customer_documents')
    .select('id, customer_id, visa_application_id, storage_path, file_name, mime_type, created_at')
    .eq('customer_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((item) => {
    const row = asRecord(item)
    return {
      id: text(row.id),
      visa_application_id: row.visa_application_id == null ? null : text(row.visa_application_id),
      storage_path: text(row.storage_path),
      file_name: text(row.file_name),
      mime_type: text(row.mime_type),
      created_at: text(row.created_at),
    } satisfies OwnDocument
  })
}

const documentTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])

export async function uploadCustomerDocument(input: { userId: string; file: File; visaApplicationId: string | null }) {
  if (!documentTypes.has(input.file.type)) throw new Error('file type')
  if (input.file.size > 10 * 1024 * 1024) throw new Error('file size')
  const extension =
    input.file.type === 'application/pdf'
      ? 'pdf'
      : input.file.type === 'image/png'
        ? 'png'
        : input.file.type === 'image/webp'
          ? 'webp'
          : 'jpg'
  const path = `${input.userId}/${crypto.randomUUID()}.${extension}`
  const db = requireDb()
  const uploaded = await db.storage.from('customer-documents').upload(path, input.file, {
    contentType: input.file.type,
    upsert: false,
  })
  if (uploaded.error) throw uploaded.error
  const { error } = await db.from('customer_documents').insert({
    customer_id: input.userId,
    visa_application_id: input.visaApplicationId,
    storage_path: path,
    file_name: input.file.name.slice(0, 180),
    mime_type: input.file.type,
  })
  if (error) {
    await db.storage.from('customer-documents').remove([path])
    throw error
  }
}

export async function removeOwnDocument(path: string, id: string) {
  const db = requireDb()
  const removed = await db.storage.from('customer-documents').remove([path])
  if (removed.error) throw removed.error
  const { error } = await db.from('customer_documents').delete().eq('id', id)
  if (error) throw error
}

export async function openOwnDocument(path: string) {
  const { data, error } = await requireDb().storage.from('customer-documents').createSignedUrl(path, 60)
  if (error) throw error
  return data.signedUrl
}

export async function createHajjInquiry(input: {
  userId: string
  programId: string | null
  travelers: number
  message: string
}) {
  const { error } = await requireDb().from('hajj_inquiries').insert({
    customer_id: input.userId,
    program_id: input.programId,
    travelers_count: input.travelers,
    message: input.message.trim(),
    internal_status: 'new',
  })
  if (error) throw error
}

export async function listOwnInquiries(userId: string) {
  const { data, error } = await requireDb()
    .from('hajj_inquiry_rows')
    .select('id, customer_id, program_id, message, travelers_count, internal_status, created_at, program_title')
    .eq('customer_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((item) => {
    const row = asRecord(item)
    return {
      id: text(row.id),
      program_id: row.program_id == null ? null : text(row.program_id),
      program_title: row.program_title == null ? null : text(row.program_title),
      message: text(row.message),
      travelers_count: numberValue(row.travelers_count),
      internal_status: text(row.internal_status),
      created_at: text(row.created_at),
    } satisfies OwnInquiry
  })
}
