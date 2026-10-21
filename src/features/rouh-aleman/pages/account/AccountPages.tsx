import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Country } from 'react-phone-number-input'
import { useAuth } from '../../auth/auth-context'
import { ConfigNotice, Loading } from '../../auth/auth-pages'
import { useLanguage } from '../../shared/hooks/useLanguage'
import { InternationalPhoneInput } from '../../shared/ui/InternationalPhoneInput'
import { LtrText } from '../../shared/ui/LtrText'
import { isValidInternationalPhone } from '../../shared/utils/phone'
import {
  accountStatusLabel,
  bookingStatusLabel,
  errorText,
  formatDate,
  formatMoney,
  inquiryStatusLabel,
  isMobile,
  safeNextPath,
  visaStatusLabel,
  type AppLanguage,
} from '../../../../lib/customer-contract'
import {
  createHajjInquiry,
  createVisa,
  getOwnBooking,
  getOwnProfile,
  getOwnVisa,
  listBookingHistory,
  listOwnBookings,
  listOwnDocuments,
  listOwnInquiries,
  listOwnPayments,
  listOwnVisas,
  openOwnDocument,
  removeOwnDocument,
  updateOwnProfile,
  uploadCustomerDocument,
  type OwnBooking,
  type OwnDocument,
  type OwnInquiry,
  type OwnPayment,
  type OwnProfile,
  type OwnVisa,
  type StatusEvent,
} from '../../../../lib/customer-data'
import { listPublishedHajjPrograms, type PublicPackage } from '../../../../lib/catalog'

const fieldClass =
  'w-full rounded-xl border border-(--ra-border) bg-white px-4 py-3 text-sm text-(--ra-black) outline-none transition focus:border-(--ra-green)/35 focus:ring-2 focus:ring-(--ra-ring)'

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

const accountLinks = [
  { to: '/account', key: 'nav.overview', end: true },
  { to: '/account/profile', key: 'nav.profile', end: false },
  { to: '/account/bookings', key: 'nav.bookings', end: false },
  { to: '/account/visas', key: 'nav.visas', end: false },
  { to: '/account/documents', key: 'nav.documents', end: false },
  { to: '/account/inquiries', key: 'nav.inquiries', end: false },
] as const

export function AccountLayout() {
  const { t } = useTranslation('account')
  const { signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 py-8 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="h-fit rounded-2xl border border-(--ra-border) bg-white p-3 shadow-sm">
        <nav className="grid gap-1">
          {accountLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                [
                  'rounded-xl px-3 py-2.5 text-sm font-semibold transition',
                  isActive ? 'bg-(--ra-green) text-white' : 'text-(--ra-green) hover:bg-(--ra-bg)',
                ].join(' ')
              }
            >
              {t(item.key)}
            </NavLink>
          ))}
        </nav>
        <button
          type="button"
          onClick={() => {
            void signOut().then(() => navigate('/'))
          }}
          className="mt-3 w-full rounded-xl border border-(--ra-border) px-3 py-2.5 text-sm font-semibold text-(--ra-muted) hover:text-(--ra-green)"
        >
          {t('signOut')}
        </button>
      </aside>
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
  const { userId, profile, loading, error } = useProfile()
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

  if (loading) return <Loading label={t('loading')} />

  return (
    <section className="space-y-5">
      <PageTitle title={t('overview.title')} subtitle={t('overview.subtitle')} />
      {error ? <Alert message={error} /> : null}
      {profile ? <ProfileCard profile={profile} language={language} statusLabel={t('overview.status')} /> : null}
      <div className="rounded-2xl border border-(--ra-border) bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-(--ra-green)">{t('overview.recent')}</h2>
          <Link to="/account/bookings" className="text-sm font-semibold text-(--ra-gold)">{t('overview.viewAll')}</Link>
        </div>
        {bookingsError ? <Alert message={bookingsError} /> : null}
        <BookingList bookings={bookings} empty={t('bookings.empty')} language={language} />
      </div>
    </section>
  )
}

export function ProfilePage() {
  const { t } = useTranslation('account')
  const { userId, profile, setProfile, loading, error } = useProfile()
  if (loading) return <Loading label={t('loading')} />

  return (
    <section className="space-y-4">
      <PageTitle title={t('profile.title')} subtitle={t('profile.hint')} />
      {error ? <Alert message={error} /> : null}
      {profile ? (
        <ProfileEditor
          key={profile.id}
          userId={userId}
          profile={profile}
          onSaved={setProfile}
        />
      ) : null}
    </section>
  )
}

function ProfileEditor({
  userId,
  profile,
  onSaved,
}: {
  userId: string
  profile: OwnProfile
  onSaved: (profile: OwnProfile | null) => void
}) {
  const { t, i18n } = useTranslation('account')
  const { language } = useLanguage()
  const lang = langOf(i18n.language)
  const [fullName, setFullName] = useState(profile.full_name)
  const [mobile, setMobile] = useState(profile.mobile)
  const [country, setCountry] = useState<Country>('SA')
  const [notice, setNotice] = useState('')
  const [formError, setFormError] = useState('')
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (fullName.trim().length < 2 || !isValidInternationalPhone(mobile, country) || !isMobile(mobile)) {
      setFormError(t('auth.invalidRegister'))
      return
    }
    setPending(true)
    setFormError('')
    setNotice('')
    try {
      await updateOwnProfile(userId, { fullName, mobile })
      const next = await getOwnProfile(userId)
      onSaved(next)
      setNotice(t('saved'))
    } catch (err) {
      setFormError(errorText(err, lang))
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={submit} className="max-w-xl space-y-4 rounded-2xl border border-(--ra-border) bg-white p-5">
      <label className="grid gap-1.5">
        <span className="text-xs font-semibold text-(--ra-muted)">{t('fields.fullName')}</span>
        <input className={fieldClass} value={fullName} onChange={(event) => setFullName(event.target.value)} required />
      </label>
      <label className="grid gap-1.5">
        <span className="text-xs font-semibold text-(--ra-muted)">{t('fields.mobile')}</span>
        <InternationalPhoneInput
          id="profile-mobile"
          value={mobile}
          onChange={setMobile}
          onCountryChange={setCountry}
          country={country}
          defaultCountry="SA"
          labelsLocale={language}
        />
      </label>
      <p className="text-sm text-(--ra-muted)">
        {t('profile.emailLocked')} <LtrText>{profile.email ?? '—'}</LtrText>
      </p>
      {formError ? <Alert message={formError} /> : null}
      {notice ? <Success message={notice} /> : null}
      <button type="submit" disabled={pending} className="rounded-xl bg-(--ra-green) px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
        {pending ? t('pending') : t('save')}
      </button>
    </form>
  )
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
      <Link to="/account/bookings" className="text-sm font-semibold text-(--ra-green)">{t('back')}</Link>
      <div className="rounded-2xl border border-(--ra-border) bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-(--ra-green)"><LtrText>{booking.reference}</LtrText></h1>
          <StatusText>{bookingStatusLabel(booking.status, language)}</StatusText>
        </div>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <Info label={t('bookings.package')} value={booking.package_title_snapshot || '—'} />
          <Info label={t('bookings.date')} value={formatDate(booking.travel_date, language)} />
          <Info label={t('bookings.travelers')} value={String(booking.travelers_count)} />
          <Info label={t('bookings.total')} value={formatMoney(booking.total_amount, language)} />
        </dl>
        {booking.customer_note ? <p className="mt-4 text-sm leading-relaxed text-(--ra-muted)">{booking.customer_note}</p> : null}
      </div>
      <Panel title={t('bookings.history')}>
        {history.length === 0 ? <p className="text-sm text-(--ra-muted)">{t('empty')}</p> : (
          <ol className="space-y-3">
            {history.map((event) => (
              <li key={event.id} className="rounded-xl bg-(--ra-bg) px-4 py-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-(--ra-green)">{bookingStatusLabel(event.new_status, language)}</span>
                  <span className="text-(--ra-muted)">{formatDate(event.created_at, language)}</span>
                </div>
                {event.note ? <p className="mt-1 text-(--ra-muted)">{event.note}</p> : null}
              </li>
            ))}
          </ol>
        )}
      </Panel>
      <Panel title={t('bookings.payments')}>
        {payments.length === 0 ? <p className="text-sm text-(--ra-muted)">{t('bookings.noPayments')}</p> : (
          <ul className="space-y-2">
            {payments.map((payment) => (
              <li key={payment.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-(--ra-bg) px-4 py-3 text-sm">
                <span>{formatMoney(payment.amount, language)} · {t(`payments.${payment.method}`, { defaultValue: payment.method })}</span>
                <span className="text-(--ra-muted)">{formatDate(payment.paid_on, language)} · {t(`payments.${payment.status}`, { defaultValue: payment.status })}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
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
      <Link to="/account/visas" className="text-sm font-semibold text-(--ra-green)">{t('back')}</Link>
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
  const [programId, setProgramId] = useState(params.get('program') ?? '')
  const [rows, setRows] = useState<OwnInquiry[]>([])
  const [programs, setPrograms] = useState<PublicPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (!userId) return
    let active = true
    Promise.all([listOwnInquiries(userId), listPublishedHajjPrograms()])
      .then(([inquiries, published]) => {
        if (!active) return
        setRows(inquiries)
        setPrograms(published)
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
      setError(errorText(new Error('account cannot submit inquiries'), language))
      return
    }
    const form = new FormData(event.currentTarget)
    const message = String(form.get('message') ?? '').trim()
    const travelers = Number(form.get('travelers') ?? 1)
    const selectedProgram = programId || null
    if (message.length < 2 || message.length > 2000 || !Number.isInteger(travelers) || travelers < 1 || travelers > 100) {
      setError(t('inquiries.invalid'))
      return
    }
    setPending(true)
    setError('')
    try {
      await createHajjInquiry({ userId, programId: selectedProgram, travelers, message })
      setRows(await listOwnInquiries(userId))
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
      <PageTitle title={t('inquiries.title')} subtitle={t('inquiries.subtitle')} />
      <form onSubmit={submit} className="grid gap-4 rounded-2xl border border-(--ra-border) bg-white p-5">
        <label className="grid gap-1.5">
          <span className="text-xs font-semibold text-(--ra-muted)">{t('fields.program')}</span>
          <select name="program_id" className={fieldClass} value={programId} onChange={(event) => setProgramId(event.target.value)}>
            <option value="">{t('inquiries.general')}</option>
            {programs.map((program) => (
              <option key={program.id} value={program.id}>{program.title}</option>
            ))}
          </select>
        </label>
        <TextField label={t('fields.travelers')} name="travelers" type="number" defaultValue="1" />
        <label className="grid gap-1.5">
          <span className="text-xs font-semibold text-(--ra-muted)">{t('fields.message')}</span>
          <textarea name="message" rows={4} className={fieldClass} required />
        </label>
        {error ? <Alert message={error} /> : null}
        {notice ? <Success message={notice} /> : null}
        <button type="submit" disabled={pending} className="w-fit rounded-xl bg-(--ra-green) px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
          {pending ? t('pending') : t('send')}
        </button>
      </form>
      {loading ? <Loading label={t('loading')} /> : rows.length === 0 ? <p className="text-sm text-(--ra-muted)">{t('inquiries.empty')}</p> : (
        <ul className="grid gap-3">
          {rows.map((row) => (
            <li key={row.id} className="rounded-2xl border border-(--ra-border) bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-(--ra-green)">{row.program_title || t('inquiries.general')}</span>
                <StatusText>{inquiryStatusLabel(row.internal_status, language)}</StatusText>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-(--ra-muted)">{row.message}</p>
            </li>
          ))}
        </ul>
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
          <Link to={`/account/bookings/${booking.id}`} className="block rounded-xl border border-(--ra-border) px-4 py-3 transition hover:border-(--ra-gold)/50">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-(--ra-green)"><LtrText>{booking.reference}</LtrText></span>
              <StatusText>{bookingStatusLabel(booking.status, language)}</StatusText>
            </div>
            <p className="mt-1 text-sm text-(--ra-muted)">
              {booking.package_title_snapshot || '—'} · {formatDate(booking.travel_date, language)} · {formatMoney(booking.total_amount, language)}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  )
}

function ProfileCard({ profile, language, statusLabel }: { profile: OwnProfile; language: AppLanguage; statusLabel: string }) {
  return (
    <div className="rounded-2xl border border-(--ra-border) bg-white p-5">
      <h2 className="text-xl font-bold text-(--ra-green)">{profile.full_name || '—'}</h2>
      <p className="mt-1 text-sm text-(--ra-muted)"><LtrText>{profile.mobile}</LtrText></p>
      <p className="text-sm text-(--ra-muted)"><LtrText>{profile.email ?? '—'}</LtrText></p>
      <p className="mt-3 text-sm">
        <span className="text-(--ra-muted)">{statusLabel}: </span>
        <StatusText>{accountStatusLabel(profile.account_status, language)}</StatusText>
      </p>
    </div>
  )
}

function PageTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-(--ra-green)">{title}</h1>
      <p className="mt-1 text-sm leading-relaxed text-(--ra-muted)">{subtitle}</p>
    </div>
  )
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-(--ra-border) bg-white p-5">
      <h2 className="mb-3 text-lg font-bold text-(--ra-green)">{title}</h2>
      {children}
    </section>
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

function StatusText({ children }: { children: ReactNode }) {
  return <span className="inline-flex rounded-full bg-(--ra-gold-soft) px-2.5 py-1 text-xs font-bold text-(--ra-green)">{children}</span>
}

function Alert({ message }: { message: string }) {
  return <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{message}</p>
}

function Success({ message }: { message: string }) {
  return <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p>
}
