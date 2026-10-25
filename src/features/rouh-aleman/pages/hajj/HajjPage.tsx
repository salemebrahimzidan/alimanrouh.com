import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bus,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  FileCheck,
  Hotel,
  MessageCircle,
  Phone,
  Plane,
  Sparkles,
  Tent,
} from 'lucide-react'
import { listPublishedHajjPrograms, type PublicPackage } from '../../../../lib/catalog'

const HERO_IMAGE = '/images/hajj/hajj-hero.jpg'
const IMAGE_FALLBACK = '/images/home/hajj-package-1.png'

const INCLUDED_ICONS = [FileCheck, Plane, Hotel, Tent, Bus, BookOpen] as const
const HIGHLIGHT_COUNT = 3
const JOURNEY_COUNT = 4
const FAQ_COUNT = 5

export function HajjPage() {
  const { t } = useTranslation('hajj')
  const { t: ts } = useTranslation('shared')
  const [packages, setPackages] = useState<PublicPackage[]>([])
  const [loadingPackages, setLoadingPackages] = useState(true)
  const [packageError, setPackageError] = useState(false)

  const phone = ts('company.phone')
  const waHref = useMemo(() => `https://wa.me/${phone.replace(/\D/g, '')}`, [phone])
  const telHref = `tel:${phone.replace(/\s/g, '')}`

  useEffect(() => {
    let active = true
    listPublishedHajjPrograms()
      .then((data) => {
        if (active) setPackages(data)
      })
      .catch((error) => {
        console.error('Failed to load packages', error)
        if (active) setPackageError(true)
      })
      .finally(() => {
        if (active) setLoadingPackages(false)
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="w-full space-y-16 pb-20 sm:space-y-20 sm:pb-24">
      {/* Hero */}
      <section className="relative -mx-4 overflow-hidden sm:-mx-6 lg:-mx-8">
        <div className="relative min-h-[560px] w-full sm:min-h-[620px]">
          <img
            src={HERO_IMAGE}
            alt=""
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover object-center rtl:-scale-x-100"
            onError={(e) => {
              if (!e.currentTarget.src.endsWith(IMAGE_FALLBACK)) e.currentTarget.src = IMAGE_FALLBACK
            }}
          />
          <div
            className="absolute inset-0 bg-[linear-gradient(100deg,rgba(6,51,39,0.92)_0%,rgba(6,51,39,0.7)_40%,rgba(6,51,39,0.05)_85%)] rtl:bg-[linear-gradient(-100deg,rgba(6,51,39,0.92)_0%,rgba(6,51,39,0.7)_40%,rgba(6,51,39,0.05)_85%)]"
            aria-hidden="true"
          />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-(--ra-bg) to-transparent" aria-hidden="true" />
          <div className="relative mx-auto flex min-h-[560px] max-w-6xl items-center px-4 py-20 sm:min-h-[620px] sm:px-6 lg:px-8">
            <div className="max-w-2xl text-start text-white">
              <p className="inline-flex items-center gap-2 rounded-full border border-(--ra-gold)/40 bg-black/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-(--ra-gold) backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                {t('hero.eyebrow')}
              </p>
              <h1 className="mt-5 text-balance text-3xl font-bold leading-[1.15] tracking-tight sm:text-4xl lg:text-5xl">
                {t('hero.title')}
              </h1>
              <p className="mt-5 max-w-xl text-pretty text-sm leading-relaxed text-white/85 sm:text-base">
                {t('hero.subtitle')}
              </p>
              <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/90">
                {Array.from({ length: HIGHLIGHT_COUNT }, (_, i) => (
                  <li key={i} className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-(--ra-gold)" aria-hidden="true" />
                    {t(`highlights.${i}`)}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  to="#hajj-inquiry"
                  className="inline-flex items-center gap-2 rounded-2xl bg-(--ra-gold) px-7 py-3.5 text-sm font-semibold text-(--ra-green) shadow-[0_18px_44px_rgba(198,160,74,0.35)] transition motion-safe:hover:-translate-y-0.5"
                >
                  <CalendarDays className="h-4 w-4" aria-hidden="true" />
                  {t('hero.primaryCta')}
                  <ArrowRight className="h-4 w-4 rtl:hidden" aria-hidden="true" />
                  <ArrowLeft className="hidden h-4 w-4 rtl:inline" aria-hidden="true" />
                </Link>
                <a
                  href={waHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition motion-safe:hover:-translate-y-0.5 hover:bg-white/15"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  {t('hero.whatsappCta')}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What's included */}
      <section className="mx-auto max-w-6xl space-y-8">
        <div className="text-start">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-(--ra-gold)">{t('included.eyebrow')}</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-(--ra-green) sm:text-4xl">{t('included.title')}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-(--ra-muted) sm:text-base">{t('included.subtitle')}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {INCLUDED_ICONS.map((Icon, i) => (
            <div
              key={i}
              className="group rounded-2xl border border-(--ra-border) bg-white p-6 shadow-[0_14px_40px_rgba(2,6,23,0.06)] transition motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-[0_22px_55px_rgba(2,6,23,0.1)]"
            >
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-(--ra-green) text-(--ra-gold) shadow-[0_10px_24px_rgba(6,51,39,0.25)]">
                <Icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-start text-base font-bold text-(--ra-green)">{t(`included.items.${i}.title`)}</h3>
              <p className="mt-1.5 text-start text-sm leading-relaxed text-(--ra-muted)">{t(`included.items.${i}.subtitle`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Journey timeline */}
      <section className="relative -mx-4 overflow-hidden bg-(--ra-green) px-4 py-14 text-white sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-10 lg:py-16">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_90%_at_100%_0%,rgba(198,160,74,0.16),transparent_60%)]"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-6xl space-y-10">
          <div className="text-start">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-(--ra-gold)">{t('journey.eyebrow')}</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{t('journey.title')}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">{t('journey.subtitle')}</p>
          </div>
          <ol className="relative grid gap-6 lg:grid-cols-4 lg:gap-5">
            <span
              className="absolute inset-y-2 inset-s-5 w-px bg-(--ra-gold)/30 lg:inset-x-0 lg:inset-y-auto lg:top-5 lg:h-px lg:w-auto"
              aria-hidden="true"
            />
            {Array.from({ length: JOURNEY_COUNT }, (_, i) => (
              <li key={i} className="relative flex gap-4 text-start lg:flex-col lg:gap-5">
                <span className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-(--ra-gold) text-sm font-bold text-(--ra-green) tabular-nums ring-4 ring-(--ra-green)">
                  {i + 1}
                </span>
                <div className="flex-1 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                  <p className="text-xs font-semibold text-(--ra-gold)">{t(`journey.items.${i}.day`)}</p>
                  <h3 className="mt-1.5 text-base font-bold">{t(`journey.items.${i}.title`)}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/75">{t(`journey.items.${i}.subtitle`)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Packages */}
      <section className="mx-auto max-w-6xl space-y-8">
        <div className="text-start">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-(--ra-gold)">{t('packages.eyebrow')}</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-(--ra-green) sm:text-4xl">{t('packages.title')}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-(--ra-muted) sm:text-base">{t('packages.subtitle')}</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loadingPackages ? (
            <div className="col-span-full rounded-[20px] border border-(--ra-border) bg-white p-10 text-center text-sm font-semibold text-(--ra-muted)">
              {t('packages.loading')}
            </div>
            ) : packageError ? (
              <div className="col-span-full rounded-[20px] border border-(--ra-border) bg-white p-10 text-center text-sm font-semibold text-(--ra-muted)">
                {ts('ui.catalogError')}
              </div>
            ) : packages.length === 0 ? (
            <div className="col-span-full rounded-[20px] border border-(--ra-border) bg-white p-10 text-center text-sm font-semibold text-(--ra-muted)">
              {t('packages.empty')}
            </div>
          ) : (
            packages.map((pkg) => (
              <article
                key={pkg.id}
                className="group flex flex-col overflow-hidden rounded-[20px] border border-(--ra-border) bg-white shadow-[0_18px_50px_rgba(2,6,23,0.08)] transition motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-[0_26px_70px_rgba(2,6,23,0.12)]"
              >
                <div className="relative aspect-4/3 overflow-hidden">
                  <img
                    src={pkg.imageUrl ?? IMAGE_FALLBACK}
                    alt={pkg.title}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full bg-(--ra-bg) object-cover motion-safe:transition-transform motion-safe:duration-500 group-hover:scale-[1.05]"
                    onError={(e) => {
                      if (!e.currentTarget.src.endsWith(IMAGE_FALLBACK)) e.currentTarget.src = IMAGE_FALLBACK
                    }}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/35 via-transparent to-transparent" aria-hidden="true" />
                  <div className="absolute top-3 inset-e-3 rounded-full bg-(--ra-gold) px-3 py-1 text-[11px] font-bold text-(--ra-green) shadow-md">
                    {pkg.duration ? t('packages.days', { count: pkg.duration }) : t('packages.badge')}
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <h3 className="text-start text-base font-bold text-(--ra-green)">{pkg.title}</h3>
                  <p className="line-clamp-3 text-start text-sm leading-relaxed text-(--ra-muted)">{pkg.description}</p>
                  <div className="flex items-center gap-1.5 text-xs text-(--ra-muted)">
                    <CalendarDays className="h-3.5 w-3.5 text-(--ra-green)" aria-hidden="true" />
                    {pkg.duration ? t('packages.days', { count: pkg.duration }) : t('packages.flexible')}
                  </div>
                  <div className="mt-auto flex items-end justify-between gap-3 border-t border-(--ra-border)/80 pt-4">
                    <div className="text-lg font-bold tabular-nums text-(--ra-gold)">
                      {pkg.price == null ? t('packages.priceOnRequest') : `${t('packages.currency')} ${pkg.price.toLocaleString()}`}
                    </div>
                    <Link
                      to={`/contact?topic=hajj&context=${encodeURIComponent(pkg.id)}`}
                      className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-(--ra-green) px-4 py-2 text-xs font-semibold text-white transition hover:bg-(--ra-green-2)"
                    >
                      {t('packages.inquire')}
                      <ArrowRight className="h-3.5 w-3.5 rtl:hidden" aria-hidden="true" />
                      <ArrowLeft className="hidden h-3.5 w-3.5 rtl:inline" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section id="hajj-inquiry" className="mx-auto max-w-3xl rounded-[24px] border border-(--ra-border) bg-white p-6 text-start shadow-[0_14px_40px_rgba(2,6,23,0.06)] sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-(--ra-gold)">{t('inquiry.eyebrow')}</p>
        <h2 className="mt-2 text-2xl font-bold text-(--ra-green)">{t('inquiry.title')}</h2>
        <p className="mt-3 text-sm leading-relaxed text-(--ra-muted)">{t('inquiry.disclaimer')}</p>
        <Link
          to="/contact?topic=hajj"
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-(--ra-green) px-6 py-3 text-sm font-semibold text-white"
        >
          {t('inquiry.action')}
        </Link>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-4xl space-y-8">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-(--ra-gold)">{t('faq.eyebrow')}</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-(--ra-green) sm:text-4xl">{t('faq.title')}</h2>
        </div>
        <div className="grid gap-3">
          {Array.from({ length: FAQ_COUNT }, (_, i) => (
            <details
              key={i}
              className="group rounded-2xl border border-(--ra-border) bg-white px-5 py-4 shadow-[0_8px_24px_rgba(2,6,23,0.04)] open:shadow-[0_14px_40px_rgba(2,6,23,0.08)]"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-start text-sm font-semibold text-(--ra-green) sm:text-base [&::-webkit-details-marker]:hidden">
                {t(`faq.items.${i}.q`)}
                <ChevronDown className="h-5 w-5 shrink-0 text-(--ra-gold) transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <p className="mt-3 text-start text-sm leading-relaxed text-(--ra-muted)">{t(`faq.items.${i}.a`)}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative mx-auto max-w-6xl overflow-hidden rounded-[24px] shadow-[0_28px_80px_rgba(2,6,23,0.16)]">
        <img src={HERO_IMAGE} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-(--ra-green)/90" aria-hidden="true" />
        <div className="relative flex flex-col gap-8 px-6 py-12 text-white sm:px-10 lg:flex-row lg:items-center lg:justify-between lg:px-12 lg:py-14">
          <div className="max-w-2xl text-start">
            <h2 className="text-2xl font-bold leading-snug sm:text-3xl">{t('cta.title')}</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/85 sm:text-base">{t('cta.subtitle')}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:shrink-0">
            <Link
              to="#hajj-inquiry"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-(--ra-gold) px-7 py-3.5 text-sm font-semibold text-(--ra-green) shadow-lg transition motion-safe:hover:-translate-y-0.5"
            >
              {t('cta.primary')}
              <ArrowRight className="h-4 w-4 rtl:hidden" aria-hidden="true" />
              <ArrowLeft className="hidden h-4 w-4 rtl:inline" aria-hidden="true" />
            </Link>
            <a
              href={telHref}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition motion-safe:hover:-translate-y-0.5 hover:bg-white/15"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
              {t('cta.call')}
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
