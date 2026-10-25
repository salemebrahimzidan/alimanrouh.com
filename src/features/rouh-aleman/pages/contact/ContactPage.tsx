import { Clock, ExternalLink, Loader2, Mail, MapPin, Phone, Send } from 'lucide-react'
import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Country } from 'react-phone-number-input'
import { useLanguage } from '../../shared/hooks/useLanguage'
import { InternationalPhoneInput } from '../../shared/ui/InternationalPhoneInput'
import { LtrText } from '../../shared/ui/LtrText'
import { useToast } from '../../shared/ui/toast-context'
import { isValidInternationalPhone } from '../../shared/utils/phone'
import { getMapsEmbedUrl, getMapsSearchUrl } from '../../shared/utils/maps'
import { submitContactForm } from './submit-contact-form'
import type { SupportTopic } from '../../../../lib/customer-data'

type ContactFields = {
  name: string
  phone: string
  email: string
  message: string
}

type FieldKey = keyof ContactFields

const EMPTY_FIELDS: ContactFields = {
  name: '',
  phone: '',
  email: '',
  message: '',
}

const inputBase =
  'h-10 w-full rounded-lg border bg-white px-3 text-sm leading-normal text-(--ra-black) outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-(--ra-muted)/70 disabled:cursor-not-allowed disabled:bg-(--ra-bg) disabled:opacity-70'
const inputOk = `${inputBase} border-(--ra-border) hover:border-(--ra-gold)/50 focus:border-(--ra-green) focus:ring-[3px] focus:ring-(--ra-green)/15`
const inputErr = `${inputBase} border-red-400 focus:border-red-500 focus:ring-[3px] focus:ring-red-500/20`

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

type FormFieldProps = {
  id: string
  label: string
  error?: string
  children: ReactNode
  className?: string
}

function FormField({ id, label, error, children, className = '' }: FormFieldProps) {
  return (
    <div className={`grid gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-xs font-medium tracking-tight text-(--ra-black)/80">
        {label} <span className="font-normal text-(--ra-gold)">*</span>
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm leading-snug text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

type ErrorSummaryProps = {
  errors: Partial<Record<FieldKey, string>>
  fieldIds: Record<FieldKey, string>
  title: string
}

function ErrorSummary({ errors, fieldIds, title }: ErrorSummaryProps) {
  const entries = (['name', 'phone', 'email', 'message'] as const)
    .map((key) => ({ key, message: errors[key] }))
    .filter((item): item is { key: FieldKey; message: string } => Boolean(item.message))

  if (entries.length === 0) return null

  return (
    <div
      className="rounded-xl border border-red-200 bg-red-50/70 p-3 text-red-900"
      role="alert"
      aria-live="polite"
    >
      <p className="text-sm font-semibold">{title}</p>
      <ul className="mt-2 grid gap-1.5 text-sm">
        {entries.map(({ key, message }) => (
          <li key={key}>
            <a
              href={`#${fieldIds[key]}`}
              onClick={(e) => {
                e.preventDefault()
                document.getElementById(fieldIds[key])?.focus()
              }}
              className="underline decoration-red-300 underline-offset-4 hover:decoration-red-500"
            >
              {message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

type ContactChannelProps = {
  icon: ReactNode
  label: string
  children: ReactNode
  className?: string
}

function ContactChannel({ icon, label, children, className = '' }: ContactChannelProps) {
  return (
    <li className={`flex items-start gap-2.5 ${className}`}>
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-(--ra-gold-soft) text-(--ra-green)">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold tracking-[0.08em] text-(--ra-muted) uppercase">{label}</p>
        <div className="mt-0.5 text-xs font-medium leading-snug text-(--ra-black)">{children}</div>
      </div>
    </li>
  )
}

export function ContactPage() {
  const { t } = useTranslation('contact')
  const { t: ts } = useTranslation('shared')
  const { showToast } = useToast()
  const { language } = useLanguage()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const formId = useId()

  const [fields, setFields] = useState<ContactFields>(EMPTY_FIELDS)
  const [topic, setTopic] = useState<SupportTopic>(() => {
    const requested = searchParams.get('topic')
    return requested === 'general' || requested === 'hajj' || requested === 'umrah' || requested === 'booking' || requested === 'complaint' ? requested : 'contact'
  })
  const [phoneCountry, setPhoneCountry] = useState<Country>('SA')
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({})
  const [sending, setSending] = useState(false)

  const fieldIds: Record<FieldKey, string> = {
    name: `${formId}-name`,
    phone: `${formId}-phone`,
    email: `${formId}-email`,
    message: `${formId}-message`,
  }

  function validate(): Partial<Record<FieldKey, string>> {
    const next: Partial<Record<FieldKey, string>> = {}
    const name = fields.name.trim()
    const phone = fields.phone.trim()
    const email = fields.email.trim()
    const message = fields.message.trim()

    if (name.length < 2) next.name = t('form.errors.name')
    if (!isValidInternationalPhone(phone, phoneCountry)) next.phone = t('form.errors.phone')
    if (!isValidEmail(email)) next.email = t('form.errors.email')
    if (message.length < 10) next.message = t('form.errors.message')
    if (message.length > 5000) next.message = t('form.errors.messageTooLong')

    return next
  }

  function updateField(key: FieldKey, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
  }

  function scrollToFirstError(nextErrors: Partial<Record<FieldKey, string>>) {
    const firstKey = (['name', 'phone', 'email', 'message'] as const).find((key) => nextErrors[key])
    if (!firstKey) return
    document.getElementById(fieldIds[firstKey])?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (sending) return

    const nextErrors = validate()
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      scrollToFirstError(nextErrors)
      return
    }

    // Must be read before `sending` disables the fieldset: disabled controls are omitted from FormData.
    const form = event.currentTarget
    const formData = new FormData(form)
    formData.set('name', fields.name.trim())
    formData.set('email', fields.email.trim())
    formData.set('phone', fields.phone.trim())
    formData.set('message', fields.message.trim())

    setErrors({})
    setSending(true)

    try {
      const contextValue = searchParams.get('context')
      const context = contextValue
        ? `${topic === 'hajj' ? 'hajj_program_id' : topic === 'umrah' ? 'umrah_package_id' : 'reference'}=${contextValue}`.slice(0, 240)
        : null
      const result = await submitContactForm(formData, { topic, context })
      form.reset()
      setFields(EMPTY_FIELDS)
      showToast('success', t('form.success'))
      navigate(result.guest
        ? `/support/guest?id=${encodeURIComponent(result.conversationId)}`
        : `/account/inquiries?conversation=${encodeURIComponent(result.conversationId)}`)
    } catch (err) {
      console.error('Contact form submission failed:', err)
      showToast('error', t('form.errors.submitFailed'))
    } finally {
      setSending(false)
    }
  }

  const disabled = sending
  const phoneHref = `tel:${ts('company.phone').replace(/\s/g, '')}`
  const phone2Href = `tel:${ts('company.phone2').replace(/\s/g, '')}`
  const mailHref = `mailto:${ts('company.email')}`
  const companyName = ts('brand.name')
  const mapAddress = ts('company.address2')
  const mapsEmbedUrl = getMapsEmbedUrl({ address: mapAddress, companyName })
  const mapsSearchUrl = getMapsSearchUrl({ address: mapAddress, companyName })

  return (
    <div className="relative -mx-4 bg-(--ra-bg) px-4 py-5 sm:-mx-6 sm:px-6 sm:py-6 lg:-mx-8 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-(--ra-border) bg-white shadow-[0_8px_24px_rgba(11,15,20,0.04)]">
        <div className="grid items-stretch lg:grid-cols-[minmax(0,1fr)_232px]">
        <form
          noValidate
          className="p-4 sm:p-5"
          onSubmit={handleSubmit}
          aria-busy={sending}
        >
          <div className="mb-4">
            <h2 className="text-base font-semibold tracking-tight text-(--ra-green) sm:text-lg">
              {t('form.title')}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-(--ra-muted) sm:text-sm">{t('form.hint')}</p>
          </div>

          <ErrorSummary errors={errors} fieldIds={fieldIds} title={t('form.hint')} />

          <fieldset disabled={disabled} className="mt-3 grid gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField id={fieldIds.name} label={t('form.name')} error={errors.name} className="min-w-0">
                <input
                  id={fieldIds.name}
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={120}
                  value={fields.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder={t('form.placeholders.name')}
                  className={errors.name ? inputErr : inputOk}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? `${fieldIds.name}-error` : undefined}
                />
              </FormField>

              <FormField id={fieldIds.phone} label={t('form.phone')} error={errors.phone} className="min-w-0">
                <InternationalPhoneInput
                  id={fieldIds.phone}
                  name="phone"
                  value={fields.phone}
                  onChange={(value) => updateField('phone', value)}
                  onCountryChange={setPhoneCountry}
                  country={phoneCountry}
                  disabled={disabled}
                  hasError={Boolean(errors.phone)}
                  compact
                  maxLength={30}
                  defaultCountry="SA"
                  labelsLocale={language}
                  placeholder={t('form.placeholders.phone')}
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby={errors.phone ? `${fieldIds.phone}-error` : undefined}
                />
              </FormField>

              <FormField
                id={fieldIds.email}
                label={t('form.email')}
                error={errors.email}
                className="sm:col-span-2"
              >
                <input
                  id={fieldIds.email}
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  value={fields.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder={t('form.placeholders.email')}
                  className={errors.email ? inputErr : inputOk}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? `${fieldIds.email}-error` : undefined}
                />
              </FormField>
            </div>

            <label className="grid gap-1.5 text-xs font-semibold text-(--ra-muted)">
              {t('form.topic')}
              <select
                value={topic}
                onChange={(event) => setTopic(event.target.value as SupportTopic)}
                className={inputOk}
              >
                <option value="contact">{t('form.topics.contact')}</option>
                <option value="general">{t('form.topics.general')}</option>
                <option value="hajj">{t('form.topics.hajj')}</option>
                <option value="umrah">{t('form.topics.umrah')}</option>
                <option value="booking">{t('form.topics.booking')}</option>
                <option value="complaint">{t('form.topics.complaint')}</option>
              </select>
            </label>

            <FormField id={fieldIds.message} label={t('form.message')} error={errors.message}>
              <textarea
                id={fieldIds.message}
                name="message"
                required
                minLength={10}
                maxLength={5000}
                rows={4}
                value={fields.message}
                onChange={(e) => updateField('message', e.target.value)}
                placeholder={t('form.placeholders.message')}
                className={[
                  'min-h-24 resize-y py-2',
                  errors.message ? inputErr : inputOk,
                ].join(' ')}
                aria-invalid={Boolean(errors.message)}
                aria-describedby={errors.message ? `${fieldIds.message}-error` : undefined}
              />
            </FormField>
          </fieldset>

          <div className="mt-3 flex sm:justify-end">
            <button
              type="submit"
              disabled={disabled}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-(--ra-green) px-5 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(6,51,39,0.22)] transition hover:bg-(--ra-green-2) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--ra-green) disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  {t('form.sending')}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" aria-hidden="true" />
                  {t('form.action')}
                </>
              )}
            </button>
          </div>
        </form>

        <aside className="border-t border-(--ra-border) bg-(--ra-bg)/60 p-3.5 lg:border-t-0 lg:border-s">
          <h3 className="text-sm font-semibold tracking-tight text-(--ra-green)">{t('info.title')}</h3>
          <p className="mt-0.5 text-[11px] leading-snug text-(--ra-muted)">{ts('brand.name')}</p>
          <ul className="mt-3 grid gap-2.5">
            <ContactChannel icon={<Phone className="h-3.5 w-3.5" />} label={t('info.phone')}>
              <span className="grid gap-0.5">
                <a href={phoneHref} className="hover:text-(--ra-green)">
                  <LtrText className="whitespace-nowrap">{ts('company.phone')}</LtrText>
                </a>
                <a href={phone2Href} className="hover:text-(--ra-green)">
                  <LtrText className="whitespace-nowrap">{ts('company.phone2')}</LtrText>
                </a>
              </span>
            </ContactChannel>
            <ContactChannel icon={<Mail className="h-3.5 w-3.5" />} label={t('info.email')}>
              <a href={mailHref} className="break-all hover:text-(--ra-green)">
                {ts('company.email')}
              </a>
            </ContactChannel>
            <ContactChannel icon={<MapPin className="h-3.5 w-3.5" />} label={t('info.address')}>
              <span>{ts('company.address2')}</span>
            </ContactChannel>
            <ContactChannel icon={<Clock className="h-3.5 w-3.5" />} label={t('info.hours')}>
              <span>{ts('company.hours')}</span>
            </ContactChannel>
          </ul>
        </aside>
        </div>
      </div>

      <section className="mx-auto mt-4 max-w-5xl overflow-hidden rounded-2xl border border-(--ra-border) bg-white shadow-[0_8px_24px_rgba(11,15,20,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-(--ra-border) px-4 py-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold tracking-[0.14em] text-(--ra-gold) uppercase">{t('map.eyebrow')}</p>
            <h3 className="text-sm font-semibold tracking-tight text-(--ra-green)">{t('map.title')}</h3>
          </div>
          <a
            href={mapsSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-(--ra-green) px-3 text-xs font-semibold text-white transition hover:bg-(--ra-green-2)"
          >
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            {t('map.openInMaps')}
            <ExternalLink className="h-3.5 w-3.5 opacity-80" aria-hidden="true" />
          </a>
        </div>
        <div className="relative h-52 bg-(--ra-bg) sm:h-60">
          <iframe
            title={t('map.title')}
            src={mapsEmbedUrl}
            className="absolute inset-0 h-full w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      </section>
    </div>
  )
}
