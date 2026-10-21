import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from './auth-context'
import { InternationalPhoneInput } from '../shared/ui/InternationalPhoneInput'
import { useLanguage } from '../shared/hooks/useLanguage'
import { isValidInternationalPhone } from '../shared/utils/phone'
import {
  authRedirectUrl,
  customerSignUpPayload,
  errorText,
  isEmail,
  safeNextPath,
  type AppLanguage,
} from '../../../lib/customer-contract'
import { requireDb } from '../../../lib/supabase'
import type { Country } from 'react-phone-number-input'

const fieldClass =
  'w-full rounded-xl border border-(--ra-border) bg-white px-4 py-3 text-sm font-medium text-(--ra-black) outline-none transition focus:border-(--ra-green)/35 focus:ring-2 focus:ring-(--ra-ring)'

function languageOf(language: string): AppLanguage {
  return language === 'ar' ? 'ar' : 'en'
}

export function LoginPage() {
  const { t, i18n } = useTranslation('account')
  const language = languageOf(i18n.language)
  const { configured, loading, session } = useAuth()
  const [params] = useSearchParams()
  const next = safeNextPath(params.get('next'))
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  if (!configured) return <ConfigNotice />
  if (!loading && session) return <Navigate to={next} replace />

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') ?? '')
    const password = String(form.get('password') ?? '')
    if (!isEmail(email) || password.length < 8) {
      setError(t('auth.invalidLogin'))
      return
    }
    setPending(true)
    setError('')
    const { error: signError } = await requireDb().auth.signInWithPassword({ email: email.trim(), password })
    setPending(false)
    if (signError) setError(errorText(signError, language))
  }

  return (
    <AuthCard title={t('auth.loginTitle')} subtitle={t('auth.loginSubtitle')}>
      <form onSubmit={submit} className="space-y-4">
        <Field label={t('fields.email')} name="email" type="email" autoComplete="username" required />
        <Field label={t('fields.password')} name="password" type="password" autoComplete="current-password" required minLength={8} />
        {error ? <Alert message={error} /> : null}
        <Submit pending={pending} label={t('auth.loginAction')} pendingLabel={t('auth.pending')} />
      </form>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
        <Link to="/forgot-password" className="font-semibold text-(--ra-green)">{t('auth.forgot')}</Link>
        <Link to={`/register?next=${encodeURIComponent(next)}`} className="font-semibold text-(--ra-gold)">{t('auth.createAccount')}</Link>
      </div>
    </AuthCard>
  )
}

export function RegisterPage() {
  const { t, i18n } = useTranslation('account')
  const { language } = useLanguage()
  const lang = languageOf(i18n.language)
  const { configured, loading, session } = useAuth()
  const [params] = useSearchParams()
  const next = safeNextPath(params.get('next'))
  const [phone, setPhone] = useState('')
  const [phoneCountry, setPhoneCountry] = useState<Country>('SA')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [pending, setPending] = useState(false)

  if (!configured) return <ConfigNotice />
  if (!loading && session) return <Navigate to={next} replace />

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const fullName = String(form.get('full_name') ?? '').trim()
    const email = String(form.get('email') ?? '').trim()
    const password = String(form.get('password') ?? '')
    const confirm = String(form.get('confirm') ?? '')
    if (fullName.length < 2 || fullName.length > 120 || !isValidInternationalPhone(phone, phoneCountry) || phone.trim().length > 20 || !isEmail(email)) {
      setError(t('auth.invalidRegister'))
      return
    }
    if (password.length < 8 || password !== confirm) {
      setError(t('auth.passwordMismatch'))
      return
    }
    setPending(true)
    setError('')
    const payload = customerSignUpPayload({ fullName, mobile: phone.trim(), email, password }, window.location.origin)
    const { data, error: signError } = await requireDb().auth.signUp(payload)
    setPending(false)
    if (signError) {
      setError(errorText(signError, lang))
      return
    }
    if (!data.session) setDone(true)
  }

  return (
    <AuthCard title={t('auth.registerTitle')} subtitle={t('auth.registerSubtitle')}>
      {done ? (
        <p className="text-sm leading-7 text-(--ra-black)">{t('auth.confirmEmail')}</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field label={t('fields.fullName')} name="full_name" autoComplete="name" required />
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold text-(--ra-muted)">{t('fields.mobile')}</span>
            <InternationalPhoneInput
              id="register-mobile"
              value={phone}
              onChange={setPhone}
              onCountryChange={setPhoneCountry}
              country={phoneCountry}
              defaultCountry="SA"
              labelsLocale={language}
              placeholder={t('fields.mobilePlaceholder')}
            />
          </label>
          <Field label={t('fields.email')} name="email" type="email" autoComplete="email" required />
          <Field label={t('fields.password')} name="password" type="password" autoComplete="new-password" required minLength={8} />
          <Field label={t('fields.confirmPassword')} name="confirm" type="password" autoComplete="new-password" required minLength={8} />
          {error ? <Alert message={error} /> : null}
          <Submit pending={pending} label={t('auth.registerAction')} pendingLabel={t('auth.pending')} />
        </form>
      )}
      <p className="mt-5 text-sm">
        <Link to={`/login?next=${encodeURIComponent(next)}`} className="font-semibold text-(--ra-green)">{t('auth.haveAccount')}</Link>
      </p>
    </AuthCard>
  )
}

export function ForgotPasswordPage() {
  const { t, i18n } = useTranslation('account')
  const language = languageOf(i18n.language)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const email = String(new FormData(event.currentTarget).get('email') ?? '')
    if (!isEmail(email)) {
      setError(t('auth.invalidEmail'))
      return
    }
    setPending(true)
    setError('')
    const { error: resetError } = await requireDb().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: authRedirectUrl('/reset-password', window.location.origin),
    })
    setPending(false)
    if (resetError) setError(errorText(resetError, language))
    else setNotice(t('auth.resetSent'))
  }

  return (
    <AuthCard title={t('auth.forgotTitle')} subtitle={t('auth.forgotSubtitle')}>
      <form onSubmit={submit} className="space-y-4">
        <Field label={t('fields.email')} name="email" type="email" autoComplete="email" required />
        {error ? <Alert message={error} /> : null}
        {notice ? <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p> : null}
        <Submit pending={pending} label={t('auth.sendReset')} pendingLabel={t('auth.pending')} />
      </form>
      <p className="mt-5 text-sm">
        <Link to="/login" className="font-semibold text-(--ra-green)">{t('auth.backToLogin')}</Link>
      </p>
    </AuthCard>
  )
}

export function ResetPasswordPage() {
  const { t, i18n } = useTranslation('account')
  const language = languageOf(i18n.language)
  const { configured, loading, session } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  if (!configured) return <ConfigNotice />
  if (loading) return <Loading label={t('loading')} />
  if (!session) {
    return (
      <AuthCard title={t('auth.resetTitle')} subtitle={t('auth.resetMissing')}>
        <Link to="/forgot-password" className="text-sm font-semibold text-(--ra-green)">{t('auth.forgot')}</Link>
      </AuthCard>
    )
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const password = String(form.get('password') ?? '')
    const confirm = String(form.get('confirm') ?? '')
    if (password.length < 8 || password !== confirm) {
      setError(t('auth.passwordMismatch'))
      return
    }
    setPending(true)
    setError('')
    const { error: updateError } = await requireDb().auth.updateUser({ password })
    setPending(false)
    if (updateError) {
      setError(errorText(updateError, language))
      return
    }
    navigate('/account', { replace: true })
  }

  return (
    <AuthCard title={t('auth.resetTitle')} subtitle={t('auth.resetSubtitle')}>
      <form onSubmit={submit} className="space-y-4">
        <Field label={t('fields.password')} name="password" type="password" autoComplete="new-password" required minLength={8} />
        <Field label={t('fields.confirmPassword')} name="confirm" type="password" autoComplete="new-password" required minLength={8} />
        {error ? <Alert message={error} /> : null}
        <Submit pending={pending} label={t('auth.savePassword')} pendingLabel={t('auth.pending')} />
      </form>
    </AuthCard>
  )
}

export function ConfigNotice() {
  const { t } = useTranslation('account')
  return (
    <AuthCard title={t('config.title')} subtitle={t('config.body')}>
      <p className="text-sm text-(--ra-muted)">{t('config.hint')}</p>
    </AuthCard>
  )
}

function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-lg py-8 sm:py-12">
      <div className="rounded-[22px] border border-(--ra-border) bg-white p-6 shadow-(--ra-shadow) sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-(--ra-gold)">Al Iman Rouh</p>
        <h1 className="mt-2 text-2xl font-bold text-(--ra-green)">{title}</h1>
        {subtitle ? <p className="mt-2 text-sm leading-relaxed text-(--ra-muted)">{subtitle}</p> : null}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  )
}

function Field({ label, name, type = 'text', ...props }: { label: string; name: string; type?: string; autoComplete?: string; required?: boolean; minLength?: number }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-semibold text-(--ra-muted)">{label}</span>
      <input name={name} type={type} className={fieldClass} {...props} />
    </label>
  )
}

function Submit({ pending, label, pendingLabel }: { pending: boolean; label: string; pendingLabel: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-(--ra-green) px-5 py-3 text-sm font-semibold text-white transition hover:bg-(--ra-green-2) disabled:opacity-60"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
      {pending ? pendingLabel : label}
    </button>
  )
}

function Alert({ message }: { message: string }) {
  return (
    <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
      {message}
    </p>
  )
}

export function Loading({ label }: { label: string }) {
  return (
    <div className="flex min-h-40 items-center justify-center gap-2 text-sm font-semibold text-(--ra-muted)" role="status">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      {label}
    </div>
  )
}
