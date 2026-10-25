import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { BadgeCheck, Banknote, CalendarDays, Check, ChevronDown, ChevronRight, ClipboardList, Clock, CreditCard, Landmark, MessageSquareText, Search, Send, Users, Wallet, X, type LucideIcon } from 'lucide-react'
import { Link, Navigate, Outlet, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../auth/auth-context'
import { ConfigNotice, Loading } from '../../auth/auth-pages'
import { LtrText } from '../../shared/ui/LtrText'
import {
  bookingStatusLabel,
  errorText,
  formatDate,
  formatDateTime,
  formatMoney,
  isMobile,
  safeNextPath,
  visaStatusLabel,
  type AppLanguage,
} from '../../../../lib/customer-contract'
import {
  createOwnSupportConversation,
  createVisa,
  getOwnBooking,
  getOwnProfile,
  getOwnVisa,
  listBookingHistory,
  listOwnBookings,
  listOwnDocuments,
  listOwnSupportConversations,
  listOwnSupportMessages,
  listOwnPayments,
  listOwnVisas,
  openOwnDocument,
  markOwnSupportRead,
  removeOwnDocument,
  sendOwnSupportReply,
  uploadCustomerDocument,
  type OwnBooking,
  type OwnDocument,
  type OwnSupportConversation,
  type OwnSupportMessage,
  type OwnPayment,
  type OwnProfile,
  type OwnVisa,
  type StatusEvent,
} from '../../../../lib/customer-data'
import { requireDb } from '../../../../lib/supabase'
const fieldClass =
  'w-full rounded-xl border border-(--ra-border) bg-white px-4 py-3 text-sm text-(--ra-black) outline-none transition focus:border-(--ra-green)/35 focus:ring-2 focus:ring-(--ra-ring)'
const selectFieldClass = `${fieldClass} cursor-pointer appearance-none pe-10`

function langOf(language: string): AppLanguage {
  return language === 'ar' ? 'ar' : 'en'
}

export function RequireCustomer() {
  const { configured, loading, session } = useAuth()
  const location = useLocation()
  const { t } = useTranslation('account')
  if (!configured) return <ConfigNotice />
  if (loading) return <Loading label={t('loading')} />
  if (!session) {
    const next = safeNextPath(`${location.pathname}${location.search}`)
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />
  }
  return <Outlet />
}

export function AccountLayout() {
  return (
    <div className="mx-auto w-full max-w-6xl py-4 sm:py-6 lg:py-8">
      <div className="min-w-0">
        <Outlet />
      </div>
    </div>
  )
}

function useProfile() {
  const { session } = useAuth()
  const { i18n } = useTranslation('account')
  const userId = session?.user.id ?? ''
  const [profile, setProfile] = useState<OwnProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!userId) return
    let active = true
    getOwnProfile(userId)
      .then((row) => {
        if (active) setProfile(row)
      })
      .catch((err) => {
        if (active) setError(errorText(err, langOf(i18n.language)))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [userId, i18n.language])

  return { userId, profile, setProfile, loading, error }
}

export function AccountOverviewPage() {
  const { t, i18n } = useTranslation('account')
  const language = langOf(i18n.language)
  const { session } = useAuth()
  const userId = session?.user.id ?? ''
  const [bookings, setBookings] = useState<OwnBooking[]>([])
  const [bookingsError, setBookingsError] = useState('')

  useEffect(() => {
    if (!userId) return
    let active = true
    listOwnBookings(userId)
      .then((rows) => {
        if (active) setBookings(rows.slice(0, 5))
      })
      .catch((err) => {
        if (active) setBookingsError(errorText(err, language))
      })
    return () => {
      active = false
    }
  }, [userId, language])

  return (
    <section className="space-y-4">
      <PageTitle title={t('overview.title')} subtitle={t('overview.subtitle')} />
      <div className="rounded-2xl border border-(--ra-border) bg-white p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-(--ra-green)">{t('overview.recent')}</h2>
          <Link to="/account/bookings" className="text-xs font-semibold text-(--ra-gold) hover:text-(--ra-green)">{t('overview.viewAll')}</Link>
        </div>
        {bookingsError ? <Alert message={bookingsError} /> : null}
        <BookingList bookings={bookings} empty={t('bookings.empty')} language={language} />
      </div>
    </section>
  )
}

export function ProfilePage() {
  return <Navigate to="/account" replace />
}

export function BookingsPage() {
  const { t, i18n } = useTranslation('account')
  const language = langOf(i18n.language)
  const { userId } = useProfile()
  const [rows, setRows] = useState<OwnBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!userId) return
    let active = true
    listOwnBookings(userId)
      .then((data) => {
        if (active) setRows(data)
      })
      .catch((err) => {
        if (active) setError(errorText(err, language))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [userId, language])

  return (
    <section className="space-y-4">
      <PageTitle title={t('bookings.title')} subtitle={t('bookings.subtitle')} />
      {loading ? <Loading label={t('loading')} /> : null}
      {error ? <Alert message={error} /> : null}
      {!loading && !error ? <BookingList bookings={rows} empty={t('bookings.empty')} language={language} /> : null}
    </section>
  )
}

export function BookingDetailPage() {
  const { id = '' } = useParams()
  const { t, i18n } = useTranslation('account')
  const language = langOf(i18n.language)
  const { userId } = useProfile()
  const [booking, setBooking] = useState<OwnBooking | null>(null)
  const [history, setHistory] = useState<StatusEvent[]>([])
  const [payments, setPayments] = useState<OwnPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!userId || !id) return
    let active = true
    Promise.all([getOwnBooking(userId, id), listBookingHistory(id), listOwnPayments(userId, id)])
      .then(([row, events, paid]) => {
        if (!active) return
        setBooking(row)
        setHistory(events)
        setPayments(paid)
      })
      .catch((err) => {
        if (active) setError(errorText(err, language))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [userId, id, language])

  if (loading) return <Loading label={t('loading')} />
  if (error) return <Alert message={error} />
  if (!booking) return <p className="text-sm text-(--ra-muted)">{t('bookings.missing')}</p>

  return (
    <section className="space-y-4">
      <BackLink to="/account/bookings" label={t('back')} />
      <div className="grid items-start gap-4 md:grid-cols-[minmax(0,1fr)_minmax(240px,300px)]">
      <article className="rounded-2xl border border-(--ra-border) bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold tracking-wide text-(--ra-muted) uppercase">{t('bookings.reference')}</p>
            <h1 className="mt-0.5 truncate text-base font-semibold text-(--ra-green)">
              <LtrText>{booking.reference}</LtrText>
            </h1>
            <p className="mt-1 truncate text-sm text-(--ra-black)">{booking.package_title_snapshot || '—'}</p>
          </div>
          <StatusText>{bookingStatusLabel(booking.status, language)}</StatusText>
        </div>
        <dl className="mt-3 grid grid-cols-3 gap-2">
          <DetailTile icon={CalendarDays} label={t('bookings.date')} value={formatDate(booking.travel_date, language)} />
          <DetailTile icon={Users} label={t('bookings.travelers')} value={String(booking.travelers_count)} />
          <DetailTile icon={Banknote} label={t('bookings.total')} value={formatMoney(booking.total_amount, language)} emphasize />
        </dl>
        {booking.customer_note ? (
          <p className="mt-3 rounded-xl bg-(--ra-bg) px-3 py-2 text-sm leading-relaxed text-(--ra-muted)">{booking.customer_note}</p>
        ) : null}
      </article>
      <div className="md:col-start-2 md:row-span-2 md:sticky md:top-4">
        <StatusTimeline events={history} language={language} />
      </div>
      <section className="rounded-2xl border border-(--ra-border) bg-white p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-[#D97706]">{t('bookings.payments')}</h2>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFF6E8] text-[#D97706]">
            <Wallet className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
        {payments.length === 0 ? <p className="text-sm text-(--ra-muted)">{t('bookings.noPayments')}</p> : (
          <ul className="space-y-3">
            {payments.map((payment) => {
              const MethodIcon = paymentMethodIcon(payment.method)
              const voided = payment.status === 'void'
              return (
                <li key={payment.id} className="rounded-2xl bg-[#FFF6EE] px-3.5 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-(--ra-green)">{formatMoney(payment.amount, language)}</span>
                    <span className={['inline-flex rounded-full px-2.5 py-1 text-xs font-semibold', voided ? 'bg-red-50 text-red-700' : 'bg-[#DDF6EF] text-[#0F8F72]'].join(' ')}>
                      {t(`payments.${payment.status}`, { defaultValue: payment.status })}
                    </span>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 rounded-xl bg-white px-2.5 py-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FFF6E8] text-[#D97706]">
                        <MethodIcon className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <dt className="text-[10px] font-semibold text-(--ra-muted)">{t('payments.method')}</dt>
                        <dd className="truncate text-xs font-medium text-(--ra-black)">{t(`payments.${payment.method}`, { defaultValue: payment.method })}</dd>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl bg-white px-2.5 py-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FFF6E8] text-[#D97706]">
                        <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <dt className="text-[10px] font-semibold text-(--ra-muted)">{t('payments.paidOn')}</dt>
                        <dd className="truncate text-xs font-medium text-(--ra-black)">{formatDate(payment.paid_on, language)}</dd>
                      </div>
                    </div>
                  </dl>
                </li>
              )
            })}
          </ul>
        )}
      </section>
      </div>
    </section>
  )
}

export function VisasPage() {
  const { t, i18n } = useTranslation('account')
  const language = langOf(i18n.language)
  const { userId, profile } = useProfile()
  const [rows, setRows] = useState<OwnVisa[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (!userId) return
    let active = true
    listOwnVisas(userId)
      .then((data) => {
        if (active) setRows(data)
      })
      .catch((err) => {
        if (active) setError(errorText(err, language))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [userId, language])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!userId || profile?.account_status !== 'active') {
      setError(errorText(new Error('account cannot submit visa applications'), language))
      return
    }
    const form = new FormData(event.currentTarget)
    const fullName = String(form.get('full_name') ?? '').trim()
    const mobile = String(form.get('mobile') ?? '').trim()
    const passport = String(form.get('passport') ?? '').trim()
    const nationality = String(form.get('nationality') ?? '').trim()
    const travelDate = String(form.get('travel_date') ?? '')
    const note = String(form.get('note') ?? '').trim()
    if (fullName.length < 2 || !isMobile(mobile) || passport.length < 4 || passport.length > 20 || nationality.length < 2) {
      setError(t('visas.invalid'))
      return
    }
    setPending(true)
    setError('')
    try {
      await createVisa({ userId, fullName, mobile, passportNumber: passport, nationality, travelDate, note })
      setRows(await listOwnVisas(userId))
      setNotice(t('sent'))
      event.currentTarget.reset()
    } catch (err) {
      setError(errorText(err, language))
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="space-y-4">
      <PageTitle title={t('visas.title')} subtitle={t('visas.subtitle')} />
      <form key={profile?.id ?? 'visa'} onSubmit={submit} className="grid gap-4 rounded-2xl border border-(--ra-border) bg-white p-5 sm:grid-cols-2">
        <h2 className="sm:col-span-2 text-base font-bold text-(--ra-green)">{t('visas.new')}</h2>
        <TextField label={t('fields.fullName')} name="full_name" defaultValue={profile?.full_name} />
        <TextField label={t('fields.mobile')} name="mobile" defaultValue={profile?.mobile} />
        <TextField label={t('fields.passport')} name="passport" />
        <TextField label={t('fields.nationality')} name="nationality" />
        <TextField label={t('fields.travelDate')} name="travel_date" type="date" />
        <label className="grid gap-1.5 sm:col-span-2">
          <span className="text-xs font-semibold text-(--ra-muted)">{t('fields.note')}</span>
          <textarea name="note" rows={3} className={fieldClass} />
        </label>
        {error ? <div className="sm:col-span-2"><Alert message={error} /></div> : null}
        {notice ? <div className="sm:col-span-2"><Success message={notice} /></div> : null}
        <button type="submit" disabled={pending} className="rounded-xl bg-(--ra-green) px-5 py-3 text-sm font-semibold text-white disabled:opacity-60 sm:col-span-2 sm:w-fit">
          {pending ? t('pending') : t('send')}
        </button>
      </form>
      {loading ? <Loading label={t('loading')} /> : rows.length === 0 ? <p className="text-sm text-(--ra-muted)">{t('visas.empty')}</p> : (
        <ul className="grid gap-3">
          {rows.map((visa) => (
            <li key={visa.id}>
              <Link to={`/account/visas/${visa.id}`} className="block rounded-2xl border border-(--ra-border) bg-white p-4 transition hover:border-(--ra-gold)/50">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-(--ra-green)"><LtrText>{visa.reference}</LtrText></span>
                  <StatusText>{visaStatusLabel(visa.status, language)}</StatusText>
                </div>
                <p className="mt-1 text-sm text-(--ra-muted)">{visa.full_name} · {formatDate(visa.created_at, language)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function VisaDetailPage() {
  const { id = '' } = useParams()
  const { t, i18n } = useTranslation('account')
  const language = langOf(i18n.language)
  const { userId } = useProfile()
  const [visa, setVisa] = useState<OwnVisa | null>(null)
  const [documents, setDocuments] = useState<OwnDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!userId || !id) return
    let active = true
    Promise.all([getOwnVisa(userId, id), listOwnDocuments(userId)])
      .then(([row, files]) => {
        if (!active) return
        setVisa(row)
        setDocuments(files.filter((file) => file.visa_application_id === id))
      })
      .catch((err) => {
        if (active) setError(errorText(err, language))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [userId, id, language])

  if (loading) return <Loading label={t('loading')} />
  if (error) return <Alert message={error} />
  if (!visa) return <p className="text-sm text-(--ra-muted)">{t('visas.missing')}</p>

  return (
    <section className="space-y-4">
      <BackLink to="/account/visas" label={t('back')} />
      <div className="rounded-2xl border border-(--ra-border) bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-(--ra-green)"><LtrText>{visa.reference}</LtrText></h1>
          <StatusText>{visaStatusLabel(visa.status, language)}</StatusText>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-(--ra-muted)">{t('visas.subtitle')}</p>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <Info label={t('fields.fullName')} value={visa.full_name} />
          <Info label={t('fields.mobile')} value={visa.mobile} />
          <Info label={t('fields.passport')} value={visa.passport_number} />
          <Info label={t('fields.nationality')} value={visa.nationality} />
          <Info label={t('fields.travelDate')} value={formatDate(visa.requested_travel_date, language)} />
        </dl>
      </div>
      <DocumentManager userId={userId} visaId={visa.id} documents={documents} onChange={setDocuments} />
    </section>
  )
}

export function DocumentsPage() {
  const { t, i18n } = useTranslation('account')
  const language = langOf(i18n.language)
  const { userId } = useProfile()
  const [documents, setDocuments] = useState<OwnDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!userId) return
    let active = true
    listOwnDocuments(userId)
      .then((rows) => {
        if (active) setDocuments(rows)
      })
      .catch((err) => {
        if (active) setError(errorText(err, language))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [userId, language])

  return (
    <section className="space-y-4">
      <PageTitle title={t('documents.title')} subtitle={t('documents.subtitle')} />
      {loading ? <Loading label={t('loading')} /> : null}
      {error ? <Alert message={error} /> : null}
      {!loading ? <DocumentManager userId={userId} visaId={null} documents={documents} onChange={setDocuments} /> : null}
    </section>
  )
}

export function InquiriesPage() {
  const { t, i18n } = useTranslation('account')
  const language = langOf(i18n.language)
  const { userId, profile } = useProfile()
  const [params] = useSearchParams()
  const programId = params.get('program') ?? ''
  const [rows, setRows] = useState<OwnSupportConversation[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(params.get('conversation'))
  const [messages, setMessages] = useState<OwnSupportMessage[]>([])
  const [messagesConversationId, setMessagesConversationId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches)
  const selected = rows.find((row) => row.id === selectedId) ?? null

  useEffect(() => {
    if (typeof window === 'undefined') return
    const media = window.matchMedia('(max-width: 1023px)')
    const update = () => setIsMobile(media.matches)
    update()
    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', update)
      return () => media.removeEventListener('change', update)
    }
    media.addListener(update)
    return () => media.removeListener(update)
  }, [])

  useEffect(() => {
    if (!userId) return
    let active = true
    const refresh = () => listOwnSupportConversations()
      .then((inquiries) => {
        if (!active) return
        setRows(inquiries)
      })
      .catch((err) => {
        if (active) setError(errorText(err, language))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    void refresh()
    const channel = requireDb().channel(`customer-support-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_conversations', filter: `customer_id=eq.${userId}` }, () => {
        void refresh()
        if (selectedId) void listOwnSupportMessages(selectedId).then((items) => {
          setMessages(items)
          setMessagesConversationId(selectedId)
        }).catch((err) => setError(errorText(err, language)))
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages' }, () => {
        void refresh()
        if (selectedId) void listOwnSupportMessages(selectedId).then((items) => {
          setMessages(items)
          setMessagesConversationId(selectedId)
        }).catch((err) => setError(errorText(err, language)))
      })
      .subscribe()
    return () => {
      active = false
      void requireDb().removeChannel(channel)
    }
  }, [userId, language, selectedId])

  useEffect(() => {
    if (!selectedId) return
    let active = true
    markOwnSupportRead(selectedId)
      .then(() => listOwnSupportMessages(selectedId))
      .then((items) => {
        if (active) {
          setMessages(items)
          setMessagesConversationId(selectedId)
        }
      })
      .catch((err) => {
        if (active) setError(errorText(err, language))
      })
    return () => {
      active = false
    }
  }, [selectedId, language])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
    if (!userId || profile?.account_status !== 'active') {
      setError(errorText(new Error('account cannot submit inquiries'), language))
      return
    }
    const form = new FormData(formElement)
    const message = String(form.get('message') ?? '').trim()
    const topic = (String(form.get('topic') ?? 'general') || 'general') as 'general' | 'hajj' | 'umrah' | 'booking' | 'complaint'
    if (message.length < 5 || message.length > 5000) {
      setError(t('inquiries.invalid'))
      return
    }
    setPending(true)
    setError('')
    try {
      const subjectLabels = {
        general: language === 'ar' ? 'استفسار عام' : 'General inquiry',
        hajj: language === 'ar' ? 'استفسار الحج' : 'Hajj inquiry',
        umrah: language === 'ar' ? 'استفسار العمرة' : 'Umrah inquiry',
        booking: language === 'ar' ? 'استفسار حجز' : 'Booking question',
        complaint: language === 'ar' ? 'شكوى' : 'Complaint',
      }
      const id = await createOwnSupportConversation({
        subject: subjectLabels[topic],
        body: message,
        topic,
        context: programId ? `hajj_program_id=${programId}` : null,
      })
      formElement.reset()
      setSelectedId(id)
      setRows(await listOwnSupportConversations())
    } catch (err) {
      setError(errorText(err, language))
      setPending(false)
      return
    }
    setPending(false)
  }

  async function reply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected || !draft.trim() || !userId || pending) return
    setPending(true)
    setError('')
    try {
      await sendOwnSupportReply(selected.id, draft)
      setDraft('')
      setMessages(await listOwnSupportMessages(selected.id))
      setMessagesConversationId(selected.id)
      setRows(await listOwnSupportConversations())
    } catch (err) {
      setError(errorText(err, language))
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="space-y-6">
      <PageTitle title={t('inquiries.title')} subtitle={t('inquiries.subtitle')} />
      <form onSubmit={submit} className="overflow-hidden rounded-2xl border border-(--ra-border) bg-white shadow-sm">
        <div className="flex items-start gap-3 border-b border-(--ra-border) bg-(--ra-bg) px-5 py-5 sm:px-6">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-(--ra-green) shadow-sm ring-1 ring-(--ra-border)">
            <MessageSquareText className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-bold text-(--ra-green)">{t('inquiries.formTitle')}</h2>
            <p className="mt-1 text-sm leading-relaxed text-(--ra-muted)">{t('inquiries.formHint')}</p>
          </div>
        </div>
        <div className="grid gap-5 p-5 sm:p-6">
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-(--ra-black)">{language === 'ar' ? 'نوع الاستفسار' : 'Inquiry type'}</span>
            <span className="relative block">
              <select name="topic" defaultValue={programId ? 'hajj' : 'general'} className={selectFieldClass}>
                <option value="general">{language === 'ar' ? 'استفسار عام عن الموقع' : 'General website inquiry'}</option>
                <option value="hajj">{language === 'ar' ? 'الحج' : 'Hajj'}</option>
                <option value="umrah">{language === 'ar' ? 'العمرة' : 'Umrah'}</option>
                <option value="booking">{language === 'ar' ? 'حجز قائم أو استفسار حجز' : 'Existing booking or booking question'}</option>
                <option value="complaint">{language === 'ar' ? 'شكوى' : 'Complaint'}</option>
              </select>
              <ChevronDown className="pointer-events-none absolute inset-y-0 end-3.5 my-auto h-4 w-4 text-(--ra-muted)" aria-hidden="true" />
            </span>
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-(--ra-black)">{t('fields.message')}</span>
            <textarea
              name="message"
              rows={6}
              maxLength={5000}
              placeholder={t('inquiries.messagePlaceholder')}
              className={`${fieldClass} min-h-36 resize-y leading-relaxed`}
              required
            />
            <span className="text-xs text-(--ra-muted)">{language === 'ar' ? 'اكتب رسالتك بوضوح (حتى 5000 حرف).' : 'Please provide a clear message (up to 5,000 characters).'}</span>
          </label>
          {error ? <Alert message={error} /> : null}
          <div className="flex justify-start border-t border-(--ra-border) pt-5">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-(--ra-green) px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-(--ra-green)/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--ra-green) disabled:cursor-wait disabled:opacity-60"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              {pending ? t('pending') : t('inquiries.submit')}
            </button>
          </div>
        </div>
      </form>
      {loading ? <Loading label={t('loading')} /> : rows.length === 0 ? <p className="text-sm text-(--ra-muted)">{t('inquiries.empty')}</p> : (
        <div className="grid gap-4 lg:grid-cols-[minmax(17rem,0.8fr)_minmax(0,1.2fr)]">
          <aside className={`${isMobile && selected ? 'hidden' : 'block'} overflow-hidden rounded-[28px] border border-[#e9edf3] bg-[#f7f8fb] shadow-[0_12px_32px_rgba(15,23,42,0.06)] lg:block`}>
            <div className="flex items-center justify-between border-b border-[#edf1f5] bg-white/80 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#25D366] text-sm font-bold text-white shadow-sm">WA</span>
                <h3 className="text-sm font-bold tracking-[0.12em] text-(--ra-muted) uppercase">Inbox</h3>
              </div>
              <span className="rounded-full bg-[#eaf7ee] px-2 py-0.5 text-[10px] font-bold text-(--ra-green)">{rows.length}</span>
            </div>
            <ul className="grid content-start gap-2 p-2">
              {rows.map((row, index) => {
                const isSelected = selectedId === row.id
                const statusLabel = row.status === 'resolved'
                  ? (language === 'ar' ? 'تم الحل' : 'Resolved')
                  : row.status === 'in_progress'
                    ? (language === 'ar' ? 'قيد المتابعة' : 'In progress')
                    : (language === 'ar' ? 'جديد' : 'New')
                const chatNumber = String(index + 1).padStart(2, '0')

                return (
                  <li key={row.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(row.id)}
                      className={[
                        'w-full rounded-[22px] border p-3 text-start transition-all duration-200',
                        isSelected
                          ? 'border-[#d3e9dc] bg-[#effaf3] shadow-[0_8px_24px_rgba(31,95,68,0.08)] ring-1 ring-[#d7f1df]'
                          : 'border-transparent bg-white/70 hover:border-[#d9e7dd] hover:bg-white',
                      ].join(' ')}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="mt-0.5 inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-(--ra-green) px-2 text-[10px] font-bold text-white shadow-sm">
                          #{chatNumber}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="truncate text-sm font-bold text-(--ra-green)">{row.subject}</p>
                            {row.customer_unread_count > 0 ? (
                              <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-(--ra-gold) px-1.5 py-0.5 text-[10px] font-bold text-white">
                                {row.customer_unread_count}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 truncate text-sm text-(--ra-muted)">{row.last_message || 'No message yet'}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <span className="rounded-full bg-[#f5f7fa] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-(--ra-muted) ring-1 ring-[#edf1f5]">{statusLabel}</span>
                        <time className="text-[11px] text-(--ra-muted)" dir="ltr">{formatDateTime(row.last_message_at, language)}</time>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          </aside>

          {isMobile ? (
            selected ? (
              <div className="fixed inset-0 z-50 bg-[#0b0f14]/35 p-3 sm:p-5">
                <div className="mx-auto flex h-full max-w-md flex-col overflow-hidden rounded-[28px] border border-[#e9edf3] bg-white shadow-[0_20px_50px_rgba(15,23,42,0.18)]">
                  <div className="flex items-center justify-between gap-3 border-b border-[#edf1f5] bg-[linear-gradient(180deg,#f5faf7_0%,#ffffff_100%)] px-4 py-3.5">
                    <button
                      type="button"
                      onClick={() => setSelectedId(null)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-(--ra-green) shadow-sm ring-1 ring-[#e5ece7] transition hover:bg-[#f1f7f3]"
                      aria-label={language === 'ar' ? 'عودة' : 'Back'}
                    >
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-(--ra-green) text-sm font-bold text-white shadow-sm">S</span>
                      <div className="min-w-0 flex-1">
                        <h2 className="truncate text-sm font-bold text-(--ra-green)">{selected.subject}</h2>
                        <p className="mt-0.5 flex items-center gap-2 text-[10px] text-(--ra-muted)">
                          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
                          {selected.status === 'resolved'
                            ? language === 'ar' ? 'تم الحل' : 'Resolved'
                            : selected.status === 'in_progress'
                              ? language === 'ar' ? 'قيد المتابعة' : 'In progress'
                              : language === 'ar' ? 'جديد' : 'New'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedId(null)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-(--ra-black) shadow-sm ring-1 ring-[#edf1f5] transition hover:bg-[#f7f8fb]"
                      aria-label={language === 'ar' ? 'إغلاق المحادثة' : 'Close conversation'}
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="flex-1 space-y-3 overflow-y-auto bg-[radial-gradient(circle_at_top,#f9f7f3_0%,#f4f6fb_100%)] p-4">
                    {(messagesConversationId === selected.id ? messages : []).map((item) => (
                      <article key={item.id} className={`max-w-[87%] rounded-2xl p-3 ${item.sender === 'admin' ? 'ms-auto bg-[#1f2d2d] text-white shadow-sm' : 'me-auto border border-[#edf1f5] bg-white text-(--ra-black)'}`}>
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] opacity-80">
                          {item.sender === 'admin' ? (language === 'ar' ? 'الدعم' : 'Support') : (language === 'ar' ? 'أنت' : 'You')}
                        </p>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">{item.body}</p>
                        <time className="mt-2 block text-[10px] opacity-70" dir="ltr">{formatDateTime(item.created_at, language)}</time>
                      </article>
                    ))}
                  </div>
                  <form onSubmit={reply} className="border-t border-[#edf1f5] bg-white p-3">
                    <div className="flex items-end gap-2">
                      <textarea
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        maxLength={5000}
                        rows={2}
                        placeholder={language === 'ar' ? 'اكتب ردك...' : 'Write a reply...'}
                        className={`${fieldClass} min-w-0 resize-y rounded-2xl border border-[#edf1f5] bg-[#f9fafb] px-4 py-3 text-sm text-(--ra-black) shadow-inner outline-none transition focus:border-(--ra-green)/35 focus:ring-2 focus:ring-(--ra-ring)`}
                      />
                      <button
                        type="submit"
                        disabled={pending || !draft.trim()}
                        className="inline-flex h-11 shrink-0 items-center justify-center rounded-2xl bg-(--ra-green) px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-(--ra-green)/90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {language === 'ar' ? 'إرسال' : 'Send'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : null
          ) : selected ? (
            <div className="overflow-hidden rounded-[28px] border border-[#e9edf3] bg-white shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
              <div className="flex items-center justify-between gap-3 border-b border-[#edf1f5] bg-[linear-gradient(180deg,#f5faf7_0%,#ffffff_100%)] px-4 py-3.5 sm:px-5">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-(--ra-green) text-sm font-bold text-white shadow-sm">S</span>
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-bold text-(--ra-green)">{selected.subject}</h2>
                    <p className="mt-0.5 flex items-center gap-2 text-[11px] text-(--ra-muted)">
                      <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
                      {selected.status === 'resolved'
                        ? language === 'ar' ? 'تم الحل' : 'Resolved'
                        : selected.status === 'in_progress'
                          ? language === 'ar' ? 'قيد المتابعة' : 'In progress'
                          : language === 'ar' ? 'جديد' : 'New'}
                      {selected.context ? ` · ${selected.context}` : ''}
                    </p>
                  </div>
                </div>
                <span className="rounded-full border border-[#d7f1df] bg-[#effaf3] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-(--ra-green)">
                  {selected.status === 'resolved' ? (language === 'ar' ? 'حل' : 'Solved') : (language === 'ar' ? 'مفتوح' : 'Open')}
                </span>
              </div>
              <div className="max-h-[28rem] space-y-3 overflow-y-auto bg-[radial-gradient(circle_at_top,#f9f7f3_0%,#f4f6fb_100%)] p-4">
                {(messagesConversationId === selected.id ? messages : []).map((item) => (
                  <article key={item.id} className={`max-w-[87%] rounded-2xl p-3 ${item.sender === 'admin' ? 'ms-auto bg-[#1f2d2d] text-white shadow-sm' : 'me-auto border border-[#edf1f5] bg-white text-(--ra-black)'}`}>
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] opacity-80">
                      {item.sender === 'admin' ? (language === 'ar' ? 'الدعم' : 'Support') : (language === 'ar' ? 'أنت' : 'You')}
                    </p>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{item.body}</p>
                    <time className="mt-2 block text-[10px] opacity-70" dir="ltr">{formatDateTime(item.created_at, language)}</time>
                  </article>
                ))}
              </div>
              <form onSubmit={reply} className="border-t border-[#edf1f5] bg-white p-3">
                <div className="flex items-end gap-2">
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    maxLength={5000}
                    rows={2}
                    placeholder={language === 'ar' ? 'اكتب ردك...' : 'Write a reply...'}
                    className={`${fieldClass} min-w-0 resize-y rounded-2xl border border-[#edf1f5] bg-[#f9fafb] px-4 py-3 text-sm text-(--ra-black) shadow-inner outline-none transition focus:border-(--ra-green)/35 focus:ring-2 focus:ring-(--ra-ring)`}
                  />
                  <button
                    type="submit"
                    disabled={pending || !draft.trim()}
                    className="inline-flex h-11 shrink-0 items-center justify-center rounded-2xl bg-(--ra-green) px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-(--ra-green)/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {language === 'ar' ? 'إرسال' : 'Send'}
                  </button>
                </div>
              </form>
            </div>
          ) : <p className="rounded-[28px] border border-[#e9edf3] bg-white p-5 text-sm text-(--ra-muted) shadow-[0_12px_32px_rgba(15,23,42,0.06)] lg:col-start-2">{language === 'ar' ? 'اختر محادثة لعرض الرسائل والرد.' : 'Select a conversation to view and reply.'}</p>}
        </div>
      )}
    </section>
  )
}

function DocumentManager({
  userId,
  visaId,
  documents,
  onChange,
}: {
  userId: string
  visaId: string | null
  documents: OwnDocument[]
  onChange: (rows: OwnDocument[]) => void
}) {
  const { t, i18n } = useTranslation('account')
  const language = langOf(i18n.language)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [pending, setPending] = useState(false)

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const file = (event.currentTarget.elements.namedItem('file') as HTMLInputElement).files?.[0]
    if (!file || !userId) return
    setPending(true)
    setError('')
    setNotice('')
    try {
      await uploadCustomerDocument({ userId, file, visaApplicationId: visaId })
      const rows = await listOwnDocuments(userId)
      onChange(visaId ? rows.filter((row) => row.visa_application_id === visaId) : rows)
      setNotice(t('documents.uploaded'))
      event.currentTarget.reset()
    } catch (err) {
      setError(errorText(err, language))
    } finally {
      setPending(false)
    }
  }

  async function remove(document: OwnDocument) {
    setError('')
    try {
      await removeOwnDocument(document.storage_path, document.id)
      onChange(documents.filter((row) => row.id !== document.id))
      setNotice(t('documents.removed'))
    } catch (err) {
      setError(errorText(err, language))
    }
  }

  async function open(path: string) {
    setError('')
    try {
      const url = await openOwnDocument(path)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      setError(errorText(err, language))
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-(--ra-border) bg-white p-5">
      <form onSubmit={upload} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="grid flex-1 gap-1.5">
          <span className="text-xs font-semibold text-(--ra-muted)">{t('fields.file')}</span>
          <input name="file" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="text-sm" required />
        </label>
        <button type="submit" disabled={pending} className="rounded-xl bg-(--ra-green) px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
          {pending ? t('pending') : t('send')}
        </button>
      </form>
      {error ? <Alert message={error} /> : null}
      {notice ? <Success message={notice} /> : null}
      {documents.length === 0 ? <p className="text-sm text-(--ra-muted)">{t('documents.empty')}</p> : (
        <ul className="space-y-2">
          {documents.map((document) => (
            <li key={document.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-(--ra-bg) px-4 py-3 text-sm">
              <span className="font-medium text-(--ra-black)">{document.file_name}</span>
              <span className="flex gap-3">
                <button type="button" onClick={() => void open(document.storage_path)} className="font-semibold text-(--ra-green)">{t('open')}</button>
                <button type="button" onClick={() => void remove(document)} className="font-semibold text-red-700">{t('remove')}</button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function BookingList({ bookings, empty, language }: { bookings: OwnBooking[]; empty: string; language: AppLanguage }) {
  if (bookings.length === 0) return <p className="mt-4 text-sm text-(--ra-muted)">{empty}</p>
  return (
    <ul className="mt-4 grid gap-3">
      {bookings.map((booking) => (
        <li key={booking.id}>
          <Link to={`/account/bookings/${booking.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-(--ra-border) bg-(--ra-bg)/50 px-3 py-2.5 transition hover:border-(--ra-gold)/50 hover:bg-white">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-(--ra-green)"><LtrText>{booking.reference}</LtrText></p>
              <p className="mt-0.5 truncate text-xs text-(--ra-black)/80">{booking.package_title_snapshot || '—'}</p>
              <p className="mt-0.5 text-xs text-(--ra-muted)">
                <LtrText>
                  {formatDate(booking.travel_date, language)}
                  <span aria-hidden="true"> · </span>
                  {formatMoney(booking.total_amount, language)}
                </LtrText>
              </p>
            </div>
            <StatusText>{bookingStatusLabel(booking.status, language)}</StatusText>
          </Link>
        </li>
      ))}
    </ul>
  )
}

function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h1 className="text-xl font-semibold text-(--ra-green)">{title}</h1>
      {subtitle ? <p className="mt-1 text-sm leading-relaxed text-(--ra-muted)">{subtitle}</p> : null}
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-(--ra-muted)">{label}</dt>
      <dd className="mt-1 font-medium text-(--ra-black)">{value}</dd>
    </div>
  )
}

function TextField({ label, name, type = 'text', defaultValue }: { label: string; name: string; type?: string; defaultValue?: string }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-semibold text-(--ra-muted)">{label}</span>
      <input name={name} type={type} defaultValue={defaultValue} className={fieldClass} />
    </label>
  )
}

const BOOKING_STATUS_TONE: Record<string, { icon: typeof Clock; chip: string; node: string; currentNode: string }> = {
  pending: {
    icon: ClipboardList,
    chip: 'bg-[#FFF4DE] text-[#A16207]',
    node: 'bg-[#FFF8EC] text-[#C4A15A] ring-1 ring-[#F3E4C4]',
    currentNode: 'bg-[#C4A15A] text-white',
  },
  under_review: {
    icon: Search,
    chip: 'bg-[#E7F3FC] text-[#1D6FA5]',
    node: 'bg-[#F3F9FD] text-[#7EB6E0] ring-1 ring-[#D7EAF6]',
    currentNode: 'bg-[#3B82C4] text-white',
  },
  confirmed: {
    icon: BadgeCheck,
    chip: 'bg-[#E5F6EE] text-[#157A4B]',
    node: 'bg-[#F2FBF7] text-[#7DCAA8] ring-1 ring-[#D4F0E3]',
    currentNode: 'bg-[#15956A] text-white',
  },
  completed: {
    icon: Check,
    chip: 'bg-[#DDF6EF] text-[#0F8F72]',
    node: 'bg-white text-[#8FB5AA] ring-1 ring-[#E3EEEA]',
    currentNode: 'bg-[#12A594] text-white',
  },
  cancelled: {
    icon: X,
    chip: 'bg-red-50 text-red-700',
    node: 'bg-red-50 text-red-400 ring-1 ring-red-100',
    currentNode: 'bg-red-500 text-white',
  },
}

function formatStatusTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  const datePart = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
  const timePart = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(date)
  return `${datePart} · ${timePart}`
}

function StatusTimeline({ events, language }: { events: StatusEvent[]; language: AppLanguage }) {
  const { t } = useTranslation('account')
  const ordered = [...events].reverse()

  return (
    <section className="rounded-2xl border border-(--ra-border) bg-white p-4 sm:p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-[#D97706]">{t('bookings.history')}</h2>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFF6E8] text-[#D97706]">
          <Clock className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
      {ordered.length === 0 ? <p className="text-sm text-(--ra-muted)">{t('empty')}</p> : (
        <ol>
          {ordered.map((event, index) => (
            <TimelineStep
              key={event.id}
              event={event}
              language={language}
              current={index === 0}
              last={index === ordered.length - 1}
              currentLabel={t('bookings.current')}
              noteLabel={t('fields.note')}
            />
          ))}
        </ol>
      )}
    </section>
  )
}

function TimelineStep({
  event,
  language,
  current,
  last,
  currentLabel,
  noteLabel,
}: {
  event: StatusEvent
  language: AppLanguage
  current: boolean
  last: boolean
  currentLabel: string
  noteLabel: string
}) {
  const [noteOpen, setNoteOpen] = useState(false)
  const tone = BOOKING_STATUS_TONE[event.new_status] ?? BOOKING_STATUS_TONE.pending
  const Icon = tone.icon
  const noteButton = event.note ? (
    <button
      type="button"
      aria-expanded={noteOpen}
      aria-label={noteLabel}
      onClick={() => setNoteOpen((open) => !open)}
      className={[
        'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition',
        noteOpen ? 'bg-[#D97706] text-white' : 'bg-white text-[#D97706] ring-1 ring-[#F3E0C4] hover:bg-[#FFF6EE]',
      ].join(' ')}
    >
      <MessageSquareText className="h-3.5 w-3.5" aria-hidden="true" />
    </button>
  ) : null
  const notePanel = noteOpen && event.note ? (
    <p className="rounded-xl bg-white px-3 py-2 text-xs leading-relaxed text-(--ra-black) ring-1 ring-[#F3E0C4]">{event.note}</p>
  ) : null

  return (
    <li className="flex items-stretch gap-3">
      <div className="relative flex w-9 shrink-0 justify-center">
        {last ? null : <span aria-hidden="true" className="absolute top-9 bottom-0 left-1/2 w-px -translate-x-1/2 bg-[#E8D3A4]" />}
        <span
          className={[
            'relative z-10 flex items-center justify-center rounded-full ring-4 ring-white',
            current ? 'h-9 w-9' : 'mt-0.5 h-8 w-8',
            current ? tone.currentNode : tone.node,
          ].join(' ')}
        >
          <Icon className={current ? 'h-4 w-4' : 'h-3.5 w-3.5'} strokeWidth={2.25} aria-hidden="true" />
        </span>
      </div>
      <div className={last ? 'min-w-0 flex-1' : 'min-w-0 flex-1 pb-5'}>
        {current ? (
          <div className="rounded-2xl bg-[#FFF6EE] px-3.5 py-3">
            <div className="flex items-center gap-2">
              <span className={['inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold', tone.chip].join(' ')}>
                {bookingStatusLabel(event.new_status, language)}
                <Icon className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden="true" />
              </span>
              <span className="text-xs font-medium text-[#D97706]">{currentLabel}</span>
              {noteButton ? <span className="ms-auto">{noteButton}</span> : null}
            </div>
            <p className="mt-2 text-xs text-[#9AA3AF]"><LtrText>{formatStatusTime(event.created_at)}</LtrText></p>
            {notePanel ? <div className="mt-2">{notePanel}</div> : null}
          </div>
        ) : (
          <div className="flex flex-col items-start gap-1.5 pt-1">
            <div className="flex items-center gap-2">
              <span className={['inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold', tone.chip].join(' ')}>
                {bookingStatusLabel(event.new_status, language)}
                <Icon className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden="true" />
              </span>
              {noteButton}
            </div>
            <p className="text-xs text-[#9AA3AF]"><LtrText>{formatStatusTime(event.created_at)}</LtrText></p>
            {notePanel}
          </div>
        )}
      </div>
    </li>
  )
}

function paymentMethodIcon(method: string): LucideIcon {
  if (method === 'cash') return Banknote
  if (method === 'pos') return CreditCard
  if (method === 'bank_transfer') return Landmark
  return Wallet
}

function DetailTile({ icon: Icon, label, value, emphasize }: { icon: LucideIcon; label: string; value: string; emphasize?: boolean }) {
  return (
    <div className="min-w-0 rounded-xl bg-(--ra-bg) px-2 py-2">
      <dt className="flex items-center gap-1 text-[10px] font-semibold tracking-wide text-(--ra-muted)">
        <Icon className="h-3 w-3 shrink-0 text-[#D97706]" aria-hidden="true" />
        <span className="truncate">{label}</span>
      </dt>
      <dd className={emphasize ? 'mt-0.5 truncate text-xs font-semibold text-(--ra-green)' : 'mt-0.5 truncate text-xs font-medium text-(--ra-black)'}>
        {value}
      </dd>
    </div>
  )
}

function BackLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-(--ra-green) ring-1 ring-(--ra-border) transition hover:ring-(--ra-gold)"
    >
      <ChevronRight className="h-4 w-4 ltr:rotate-180" aria-hidden="true" />
      {label}
    </Link>
  )
}

function StatusText({ children }: { children: ReactNode }) {
  return <span className="inline-flex shrink-0 rounded-full bg-(--ra-gold-soft) px-2.5 py-1 text-xs font-bold text-(--ra-green)">{children}</span>
}

function Alert({ message }: { message: string }) {
  return <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{message}</p>
}

function Success({ message }: { message: string }) {
  return <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p>
}
