import {
  Clock,
  ExternalLink,
  Loader2,
  Mail,
  MapPin,
  MessageSquareText,
  Phone,
  Send,
} from 'lucide-react'
import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { Country } from 'react-phone-number-input'
import { useLanguage } from '../../shared/hooks/useLanguage'
import { InternationalPhoneInput } from '../../shared/ui/InternationalPhoneInput'
import { useToast } from '../../shared/ui/toast-context'
import { isValidInternationalPhone } from '../../shared/utils/phone'
import { getMapsEmbedUrl, getMapsSearchUrl } from '../../shared/utils/maps'
import { submitContactForm } from './submit-contact-form'

type ContactFields = {
  name: string
  phone: string
  email: string
  message: string
}

type FieldKey = keyof ContactFields

const CONTACT_SERVICE = 'General inquiry'

const EMPTY_FIELDS: ContactFields = {
  name: '',
  phone: '',
  email: '',
  message: '',
}

const inputBase =
  'w-full rounded-xl border bg-white px-4 text-[15px] leading-normal text-[#0F172A] outline-none transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-[#94A3B8] disabled:cursor-not-allowed disabled:bg-[#F8FAFC] disabled:opacity-70'
const inputOk = `${inputBase} border-[#E2E8F0] hover:border-[#CBD5E1] focus:border-[#2563EB] focus:ring-[3px] focus:ring-[#2563EB]/20`
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
    <div className={`grid gap-2 ${className}`}>
      <label htmlFor={id} className="text-sm font-medium tracking-tight text-[#0F172A]">
        {label} <span className="font-normal text-[#2563EB]">*</span>
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
      className="rounded-2xl border border-red-200 bg-red-50/70 p-4 text-red-900 shadow-sm"
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

type SectionHeaderProps = {
  title: string
  description: string
}

function SectionHeader({ title, description }: SectionHeaderProps) {
  return (
    <div className="space-y-1.5">
      <h3 className="text-base font-semibold tracking-tight text-[#0F172A]">{title}</h3>
      <p className="text-sm leading-relaxed text-[#64748B]">{description}</p>
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
    <li
      className={`group rounded-2xl border border-[#E2E8F0] bg-white p-4 transition duration-200 hover:border-[#BFDBFE] hover:shadow-[0_8px_24px_rgba(37,99,235,0.08)] ${className}`}
    >
      <div className="flex gap-3.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#2563EB] transition duration-200 group-hover:bg-[#2563EB] group-hover:text-white">
          {icon}
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-[11px] font-semibold tracking-[0.08em] text-[#64748B] uppercase">{label}</p>
          <div className="mt-1.5 text-sm font-medium leading-snug text-[#0F172A]">{children}</div>
        </div>
      </div>
    </li>
  )
}

export function ContactPage() {
  const { t } = useTranslation('contact')
  const { t: ts } = useTranslation('shared')
  const { showToast } = useToast()
  const { language } = useLanguage()
  const formId = useId()

  const [fields, setFields] = useState<ContactFields>(EMPTY_FIELDS)
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
      await submitContactForm(formData)
      form.reset()
      setFields(EMPTY_FIELDS)
      showToast('success', t('form.success'))
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
    <div
      className="relative -mx-4 min-h-full overflow-hidden bg-white px-4 py-8 sm:-mx-6 sm:px-6 sm:py-10 lg:-mx-8 lg:px-8 lg:py-12"
    >
      <div className="relative mx-auto flex max-w-6xl flex-col gap-8 lg:gap-10">
        {/* Workspace: form + rail */}
        <section>
          <form
            noValidate
            className="flex w-full flex-col gap-8"
            onSubmit={handleSubmit}
            aria-busy={sending}
          >
              <div className="space-y-2 border-b border-[#E2E8F0] pb-8">
                <h2 className="text-xl font-semibold tracking-tight text-[#0F172A] sm:text-2xl">
                  {t('form.title')}
                </h2>
                <p className="max-w-prose text-sm leading-relaxed text-[#64748B] sm:text-[15px]">
                  {t('form.hint')}
                </p>
              </div>

              <ErrorSummary errors={errors} fieldIds={fieldIds} title={t('form.hint')} />

              <input type="hidden" name="service" value={CONTACT_SERVICE} />

              <fieldset disabled={disabled} className="flex flex-1 flex-col gap-10">
                {/* Details */}
                <div className="space-y-6">
                  <SectionHeader
                    title={t('form.sections.details')}
                    description={t('form.sections.detailsHint')}
                  />
                  <div className="grid gap-5 sm:grid-cols-2">
                    <FormField
                      id={fieldIds.name}
                      label={t('form.name')}
                      error={errors.name}
                      className="min-w-0"
                    >
                      <input
                        id={fieldIds.name}
                        name="name"
                        type="text"
                        autoComplete="name"
                        required
                        minLength={2}
                        value={fields.name}
                        onChange={(e) => updateField('name', e.target.value)}
                        placeholder={t('form.placeholders.name')}
                        className={`h-12 ${errors.name ? inputErr : inputOk}`}
                        aria-invalid={Boolean(errors.name)}
                        aria-describedby={errors.name ? `${fieldIds.name}-error` : undefined}
                      />
                    </FormField>

                    <FormField
                      id={fieldIds.phone}
                      label={t('form.phone')}
                      error={errors.phone}
                      className="min-w-0"
                    >
                      <InternationalPhoneInput
                        id={fieldIds.phone}
                        name="phone"
                        value={fields.phone}
                        onChange={(value) => updateField('phone', value)}
                        onCountryChange={setPhoneCountry}
                        country={phoneCountry}
                        disabled={disabled}
                        hasError={Boolean(errors.phone)}
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
                        value={fields.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        placeholder={t('form.placeholders.email')}
                        className={`h-12 ${errors.email ? inputErr : inputOk}`}
                        aria-invalid={Boolean(errors.email)}
                        aria-describedby={errors.email ? `${fieldIds.email}-error` : undefined}
                      />
                    </FormField>
                  </div>
                </div>

                {/* Message composer */}
                <div className="space-y-4">
                  <SectionHeader
                    title={t('form.sections.message')}
                    description={t('form.sections.messageHint')}
                  />
                  <FormField id={fieldIds.message} label={t('form.message')} error={errors.message}>
                    <div
                      className={[
                        'rounded-2xl border-2 border-dashed bg-white p-4 transition duration-200',
                        errors.message
                          ? 'border-red-300 bg-red-50/30'
                          : 'border-[#CBD5E1] focus-within:border-[#2563EB] focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(37,99,235,0.12)]',
                      ].join(' ')}
                    >
                      <div className="mb-3 flex items-center gap-2 text-[#64748B]">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-[#E2E8F0]">
                          <MessageSquareText className="h-4 w-4 text-[#2563EB]" aria-hidden="true" />
                        </span>
                        <span className="text-xs font-medium">{t('form.sections.messageHint')}</span>
                      </div>
                      <textarea
                        id={fieldIds.message}
                        name="message"
                        required
                        minLength={10}
                        value={fields.message}
                        onChange={(e) => updateField('message', e.target.value)}
                        placeholder={t('form.placeholders.message')}
                        className={[
                          'min-h-40 w-full resize-y rounded-xl border-0 bg-white px-4 py-3.5 text-[15px] leading-relaxed text-[#0F172A] shadow-sm ring-1 outline-none transition duration-200 placeholder:text-[#94A3B8] disabled:opacity-70',
                          errors.message
                            ? 'ring-red-300 focus:ring-[3px] focus:ring-red-500/20'
                            : 'ring-[#E2E8F0] focus:ring-[3px] focus:ring-[#2563EB]/20',
                        ].join(' ')}
                        aria-invalid={Boolean(errors.message)}
                        aria-describedby={errors.message ? `${fieldIds.message}-error` : undefined}
                      />
                    </div>
                  </FormField>
                </div>
              </fieldset>

              <div className="flex justify-stretch border-t border-[#E2E8F0] pt-8 sm:justify-end">
                <button
                  type="submit"
                  disabled={disabled}
                  className="inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-[#2563EB] px-8 text-[15px] font-semibold text-white shadow-[0_1px_2px_rgba(37,99,235,0.25),0_10px_28px_rgba(37,99,235,0.28)] transition duration-200 hover:bg-[#1D4ED8] hover:shadow-[0_1px_2px_rgba(29,78,216,0.3),0_14px_32px_rgba(37,99,235,0.35)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2563EB]/25 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none sm:w-auto sm:min-w-[240px]"
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

          <aside className="mt-10 border-t border-[#E2E8F0] pt-10">
            <div className="mb-6">
              <h3 className="text-lg font-semibold tracking-tight text-[#0F172A]">{t('info.title')}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#64748B]">{ts('brand.name')}</p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <ContactChannel icon={<Phone className="h-4 w-4" />} label={t('info.phone')}>
                <a
                  href={phoneHref}
                  className="tabular-nums transition-colors duration-200 hover:text-[#2563EB]"
                >
                  {ts('company.phone')}
                </a>
                <a
                  href={phone2Href}
                  className="block tabular-nums transition-colors duration-200 hover:text-[#2563EB]"
                >
                  {ts('company.phone2')}
                </a>
              </ContactChannel>
              <ContactChannel icon={<Mail className="h-4 w-4" />} label={t('info.email')}>
                <a href={mailHref} className="break-all transition-colors duration-200 hover:text-[#2563EB]">
                  {ts('company.email')}
                </a>
              </ContactChannel>
              <ContactChannel icon={<MapPin className="h-4 w-4" />} label={t('info.address')}>
                <span>{ts('company.address2')}</span>
              </ContactChannel>
              <ContactChannel icon={<Clock className="h-4 w-4" />} label={t('info.hours')}>
                <span>{ts('company.hours')}</span>
              </ContactChannel>
            </ul>
          </aside>
        </section>

        {/* Map */}
        <section className="overflow-hidden rounded-[22px] border border-(--ra-border) bg-white shadow-[0_22px_70px_rgba(2,6,23,0.08)] ring-1 ring-black/2">
          <div className="grid lg:grid-cols-[minmax(0,340px)_1fr]">
            <div className="flex flex-col justify-center gap-6 border-b border-(--ra-border) p-6 sm:p-8 lg:border-b-0 lg:border-e">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-(--ra-gold)">{t('map.eyebrow')}</p>
                <h3 className="mt-2 text-xl font-bold tracking-tight text-(--ra-green) sm:text-2xl">{t('map.title')}</h3>
                <p className="mt-2 text-sm leading-relaxed text-(--ra-muted)">{t('map.subtitle')}</p>
              </div>

              <ul className="grid gap-3">
                <li className="flex gap-3.5 rounded-2xl border border-(--ra-border)/80 bg-(--ra-bg) p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-(--ra-green) shadow-sm ring-1 ring-(--ra-border)">
                    <MapPin className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <p className="text-[11px] font-semibold tracking-[0.08em] text-(--ra-muted) uppercase">{t('info.address')}</p>
                    <p className="mt-1.5 text-sm font-medium leading-snug text-(--ra-black)">{mapAddress}</p>
                  </div>
                </li>
                <li className="flex gap-3.5 rounded-2xl border border-(--ra-border)/80 bg-(--ra-bg) p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-(--ra-green) shadow-sm ring-1 ring-(--ra-border)">
                    <Clock className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <p className="text-[11px] font-semibold tracking-[0.08em] text-(--ra-muted) uppercase">{t('info.hours')}</p>
                    <p className="mt-1.5 text-sm font-medium leading-snug text-(--ra-black)">{ts('company.hours')}</p>
                  </div>
                </li>
              </ul>

              <a
                href={mapsSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-(--ra-green) px-6 py-3.5 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(6,51,39,0.28)] transition motion-safe:hover:-translate-y-0.5 hover:bg-(--ra-green-2)"
              >
                <MapPin className="h-4 w-4" aria-hidden="true" />
                {t('map.openInMaps')}
                <ExternalLink className="h-4 w-4 opacity-80" aria-hidden="true" />
              </a>
            </div>

            <div className="relative min-h-[280px] bg-(--ra-bg) sm:min-h-[320px] lg:min-h-[420px]">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-10 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]"
              />
              <iframe
                title={t('map.title')}
                src={mapsEmbedUrl}
                className="absolute inset-0 h-full w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
