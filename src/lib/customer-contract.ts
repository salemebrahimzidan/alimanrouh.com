export const PUBLIC_SITE_ORIGIN = 'https://alimanrouh.com'

export type BookingStatus = 'pending' | 'under_review' | 'confirmed' | 'completed' | 'cancelled'
export type VisaStatus =
  | 'submitted'
  | 'under_review'
  | 'documents_requested'
  | 'processing'
  | 'ready_for_collection'
  | 'closed'
  | 'cancelled'
export type InquiryStatus = 'new' | 'contacted' | 'in_progress' | 'closed'
export type AccountStatus = 'pending_verification' | 'active' | 'suspended'
export type AppLanguage = 'ar' | 'en'

type Copy = Record<AppLanguage, string>

const bookingStatusLabels: Record<BookingStatus, Copy> = {
  pending: { ar: 'قيد الانتظار', en: 'Pending' },
  under_review: { ar: 'قيد المراجعة', en: 'Under review' },
  confirmed: { ar: 'مؤكد', en: 'Confirmed' },
  completed: { ar: 'مكتمل', en: 'Completed' },
  cancelled: { ar: 'ملغى', en: 'Cancelled' },
}

const visaStatusLabels: Record<VisaStatus, Copy> = {
  submitted: { ar: 'تم الاستلام', en: 'Received' },
  under_review: { ar: 'قيد المراجعة الداخلية', en: 'Internal review' },
  documents_requested: { ar: 'مطلوب استكمال مستندات', en: 'Documents requested' },
  processing: { ar: 'قيد المعالجة الداخلية', en: 'Internal processing' },
  ready_for_collection: { ar: 'جاهز للمتابعة', en: 'Ready for follow-up' },
  closed: { ar: 'مغلق', en: 'Closed' },
  cancelled: { ar: 'ملغى', en: 'Cancelled' },
}

const inquiryStatusLabels: Record<InquiryStatus, Copy> = {
  new: { ar: 'جديد', en: 'New' },
  contacted: { ar: 'تم التواصل', en: 'Contacted' },
  in_progress: { ar: 'قيد المتابعة', en: 'In progress' },
  closed: { ar: 'مغلق', en: 'Closed' },
}

const accountStatusLabels: Record<AccountStatus, Copy> = {
  pending_verification: { ar: 'بانتظار تأكيد البريد', en: 'Awaiting email confirmation' },
  active: { ar: 'نشط', en: 'Active' },
  suspended: { ar: 'موقوف', en: 'Suspended' },
}

export function isLocalOrigin(origin: string) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)
}

export function authRedirectUrl(path: '/account' | '/reset-password', origin: string) {
  const base = isLocalOrigin(origin) ? origin.replace(/\/$/, '') : PUBLIC_SITE_ORIGIN
  return `${base}${path}`
}

export function safeNextPath(value: string | null | undefined) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return '/account'
  if (value.includes('://') || value.includes('\\')) return '/account'
  return value
}

export function registrationMetadata(fullName: string, mobile: string) {
  return {
    full_name: fullName.trim().slice(0, 120),
    mobile: mobile.trim().slice(0, 20),
  }
}

export function customerSignUpPayload(
  input: { fullName: string; mobile: string; email: string; password: string },
  origin: string,
) {
  return {
    email: input.email.trim(),
    password: input.password,
    options: {
      data: registrationMetadata(input.fullName, input.mobile),
      emailRedirectTo: authRedirectUrl('/account', origin),
    },
  }
}

export function travelersCount(adults: number, children: number) {
  const total = Math.trunc(adults) + Math.trunc(children)
  if (!Number.isInteger(total) || total < 1 || total > 100) {
    throw new Error('travelers')
  }
  return total
}

export function customerNote(note: string, children: number) {
  const trimmed = note.trim()
  const prefix = children > 0 ? `عدد الأطفال: ${Math.trunc(children)}` : ''
  return [prefix, trimmed].filter(Boolean).join('\n').slice(0, 1000)
}

export function bookingInsertRow(input: {
  userId: string
  packageId: string
  travelDate: string
  adults: number
  children: number
  note: string
}) {
  return {
    customer_id: input.userId,
    package_id: input.packageId,
    travel_date: input.travelDate,
    travelers_count: travelersCount(input.adults, input.children),
    customer_note: customerNote(input.note, input.children),
    status: 'pending' as const,
    total_amount: 0,
    package_title_snapshot: '',
  }
}

export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export function isMobile(value: string) {
  const trimmed = value.trim()
  return trimmed.length >= 8 && trimmed.length <= 20 && /^[0-9+\s-]+$/.test(trimmed)
}

export function asNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return 0
}

export function formatMoney(value: number, _language?: AppLanguage) {
  const amount = new Intl.NumberFormat('en-GB', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
  return `${amount} SAR`
}

export function formatDate(value: string | null | undefined, _language?: AppLanguage) {
  if (!value) return '—'
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  const date = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}

function label<T extends string>(labels: Record<T, Copy>, value: string, language: AppLanguage) {
  if (value in labels) return labels[value as T][language]
  return value
}

export function bookingStatusLabel(value: string, language: AppLanguage) {
  return label(bookingStatusLabels, value, language)
}

export function visaStatusLabel(value: string, language: AppLanguage) {
  return label(visaStatusLabels, value, language)
}

export function inquiryStatusLabel(value: string, language: AppLanguage) {
  return label(inquiryStatusLabels, value, language)
}

export function accountStatusLabel(value: string, language: AppLanguage) {
  return label(accountStatusLabels, value, language)
}

function rawError(error: unknown) {
  if (error instanceof Error) return error.message
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') return error.message
  return ''
}

const errorCopy = {
  unexpected: { ar: 'حدث خطأ غير متوقع. حاول مرة أخرى.', en: 'Something went wrong. Please try again.' },
  credentials: { ar: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.', en: 'The email or password is incorrect.' },
  confirmEmail: { ar: 'يلزم تأكيد البريد الإلكتروني قبل تسجيل الدخول.', en: 'Confirm your email before signing in.' },
  registered: { ar: 'هذا البريد مسجّل مسبقاً.', en: 'This email is already registered.' },
  inactive: { ar: 'الحساب غير مفعّل أو موقوف، ولا يمكنه إرسال هذا الطلب.', en: 'This account is not active, so this request cannot be sent.' },
  package: { ar: 'البرنامج غير متاح للحجز.', en: 'This package is not available for booking.' },
  forbidden: { ar: 'ليست لديك صلاحية لتنفيذ هذا الإجراء.', en: 'You do not have permission to do that.' },
  weakPassword: { ar: 'كلمة المرور ضعيفة. استخدم 8 أحرف على الأقل.', en: 'The password is too weak. Use at least 8 characters.' },
  rate: { ar: 'محاولات كثيرة. انتظر قليلاً ثم أعد المحاولة.', en: 'Too many attempts. Wait a moment and try again.' },
  config: { ar: 'إعداد الاتصال غير مكتمل.', en: 'The connection is not configured.' },
  fileType: { ar: 'الملف يجب أن يكون PDF أو صورة JPG أو PNG أو WebP.', en: 'The file must be a PDF, JPG, PNG, or WebP image.' },
  fileSize: { ar: 'حجم الملف يجب ألا يتجاوز 10 ميغابايت.', en: 'The file must be 10 MB or smaller.' },
} satisfies Record<string, Copy>

export function errorText(error: unknown, language: AppLanguage = 'ar') {
  const message = rawError(error)
  if (message === 'file type') return errorCopy.fileType[language]
  if (message === 'file size') return errorCopy.fileSize[language]
  if (!message || message === 'travelers') {
    return message === 'travelers'
      ? language === 'ar'
        ? 'عدد المسافرين يجب أن يكون بين 1 و 100.'
        : 'The number of travelers must be between 1 and 100.'
      : errorCopy.unexpected[language]
  }
  if (/invalid login credentials/i.test(message)) return errorCopy.credentials[language]
  if (/email not confirmed/i.test(message)) return errorCopy.confirmEmail[language]
  if (/user already registered|already been registered/i.test(message)) return errorCopy.registered[language]
  if (/account cannot/i.test(message)) return errorCopy.inactive[language]
  if (/package is not available|program is not available/i.test(message)) return errorCopy.package[language]
  if (/not authorized|permission denied|42501/i.test(message)) return errorCopy.forbidden[language]
  if (/password/i.test(message) && /weak|short|at least/i.test(message)) return errorCopy.weakPassword[language]
  if (/rate limit|too many requests|over_request_rate_limit/i.test(message)) return errorCopy.rate[language]
  if (/not configured|supabase is not configured/i.test(message)) return errorCopy.config[language]
  return errorCopy.unexpected[language]
}
