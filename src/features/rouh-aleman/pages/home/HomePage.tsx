import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { listPublishedUmrahPackages, type PublicPackage } from '../../../../lib/catalog'
import { useInView } from '../../shared/hooks/useInView'
import { CountUp } from '../../shared/ui/CountUp'
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Award,
  Bus,
  CalendarDays,
  Car,
  Clock,
  FileText,
  Globe,
  Headphones,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Smile,
  Sparkles,
  Tag,
  TrendingUp,
  Users,
} from 'lucide-react'

const STATS_BG = '/images/home/stats-makkah.jpg'
const STATS_BARS = [35, 55, 45, 70, 60, 85] as const

const HERO_IMAGE = '/images/home/hero-kaaba.png'
const HERO_FALLBACK = '/images/home/hero.jpg'

const PROGRAM_IMAGES = [
  '/images/home/umrah-package-1.png',
  '/images/home/hajj-package-1.png',
  '/images/home/hotel-room.png',
  '/images/home/tourism.png',
] as const

const WHY_MAIN_IMAGE = '/images/umrah/umrah-hero.jpg'
const WHY_SECOND_IMAGE = '/images/hajj/hajj-hero.jpg'

const DESTINATION_IMAGES = [
  '/images/home/destination-1.jpg',
  '/images/home/destination-madinah.jpg',
  '/images/home/destination-jeddah.jpg',
  '/images/home/destination-landmarks.jpg',
] as const

const DESTINATION_LAYOUT = [
  'sm:col-span-2 lg:row-span-2',
  'sm:col-span-2',
  '',
  '',
] as const

const IMAGE_FALLBACK = PROGRAM_IMAGES[0]
const PACKAGE_FALLBACK = { hajj: '/images/hajj/hajj-hero.jpg', umrah: '/images/umrah/umrah-hero.jpg' } as const

function digitsOnly(phone: string) {
  return phone.replace(/\D/g, '')
}

function telHref(phone: string) {
  return `tel:${phone.replace(/\s/g, '')}`
}

export function HomePage() {
  const { t } = useTranslation('home')
  const { t: ts } = useTranslation('shared')
  const [heroFailed, setHeroFailed] = useState(false)
  const { ref: statsRef, inView: statsInView } = useInView<HTMLDivElement>()

  const phone = ts('company.phone')
  const waHref = useMemo(() => {
    const d = digitsOnly(phone)
    return d ? `https://wa.me/${d}` : 'https://wa.me/'
  }, [phone])
  const [packages, setPackages] = useState<PublicPackage[]>([])
  const [loadingPackages, setLoadingPackages] = useState(true)
  const [packageError, setPackageError] = useState(false)

  useEffect(() => {
    let active = true
    listPublishedUmrahPackages()
      .then((data) => {
        if (active) setPackages(data.slice(0, 4))
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

  const destinations = useMemo(
    () =>
      [0, 1, 2, 3].map((i) => ({
        img: DESTINATION_IMAGES[i] ?? DESTINATION_IMAGES[0],
        nameKey: `destinations.items.${i}.name` as const,
        descKey: `destinations.items.${i}.desc` as const,
      })),
    [],
  )

  const heroSrc = heroFailed ? HERO_FALLBACK : HERO_IMAGE

  return (
    <div className="w-full space-y-16 pb-28 sm:space-y-20 sm:pb-32 lg:space-y-24">
      {/* Hero */}
      <section className="relative -mx-4 overflow-hidden sm:-mx-6 lg:-mx-8">
        <div className="relative min-h-[min(88dvh,760px)] w-full">
          <img
            src={heroSrc}
            alt=""
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover object-[center_35%] motion-safe:transition-transform motion-safe:duration-[12s] motion-safe:ease-out hover:scale-[1.02]"
            onError={() => setHeroFailed(true)}
          />
          <div
            className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.96)_0%,rgba(255,255,255,0.82)_34%,rgba(255,255,255,0.22)_58%,rgba(6,51,39,0.55)_100%)] rtl:bg-[linear-gradient(-115deg,rgba(255,255,255,0.96)_0%,rgba(255,255,255,0.82)_34%,rgba(255,255,255,0.22)_58%,rgba(6,51,39,0.55)_100%)]"
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 bg-linear-to-t from-black/45 via-black/10 to-transparent"
            aria-hidden="true"
          />
          <div className="pointer-events-none absolute -inset-40 bg-[radial-gradient(closest-side,rgba(198,160,74,0.12),transparent_70%)] opacity-90 inset-s-[55%] rtl:inset-s-auto rtl:inset-e-[45%]" aria-hidden="true" />

          <div className="relative flex min-h-[min(88dvh,760px)] items-center px-4 pb-14 pt-36 sm:px-6 sm:pb-16 sm:pt-40 lg:px-10 lg:pb-20 lg:pt-44">
            <div className="w-full max-w-2xl text-start">
              <div className="rounded-[22px] border border-white/50 bg-(--ra-glass) p-6 shadow-[0_24px_80px_rgba(2,6,23,0.12)] ring-1 ring-black/5 backdrop-blur-xl sm:p-8">
                <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-(--ra-gold) sm:text-sm">
                  <Sparkles className="h-3.5 w-3.5 opacity-90" aria-hidden="true" />
                  {t('hero.eyebrow')}
                </p>
                <h1 className="mt-3 text-balance text-3xl font-bold leading-[1.12] tracking-tight text-(--ra-green) sm:text-4xl lg:text-[2.75rem]">
                  <span className="text-(--ra-green)">{t('hero.titleLead')}</span>{' '}
                  <span className="bg-linear-to-r from-(--ra-gold) to-[#a8842f] bg-clip-text text-transparent">
                    {t('hero.titleAccent')}
                  </span>
                </h1>
                <p className="mt-4 max-w-xl text-pretty text-sm leading-relaxed text-(--ra-muted) sm:text-base">
                  {t('hero.subtitle')}
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link
                    to="/booking"
                    className="inline-flex items-center gap-2 rounded-2xl bg-(--ra-green) px-7 py-3.5 text-sm font-semibold text-white shadow-[0_18px_44px_rgba(6,51,39,0.38)] transition motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-[0_22px_50px_rgba(6,51,39,0.42)] hover:bg-(--ra-green-2)"
                  >
                    <CalendarDays className="h-4 w-4 opacity-95" aria-hidden="true" />
                    <span>{t('hero.primaryCta')}</span>
                    <ArrowRight className="h-4 w-4 rtl:hidden" aria-hidden="true" />
                    <ArrowLeft className="hidden h-4 w-4 rtl:inline" aria-hidden="true" />
                  </Link>
                  <Link
                    to="/booking"
                    className="inline-flex items-center gap-2 rounded-2xl border border-(--ra-green)/25 bg-white/70 px-7 py-3.5 text-sm font-semibold text-(--ra-green) shadow-sm backdrop-blur-md transition motion-safe:hover:-translate-y-0.5 motion-safe:hover:border-(--ra-gold)/40 motion-safe:hover:bg-white"
                  >
                    <Headphones className="h-4 w-4" aria-hidden="true" />
                    {t('hero.secondaryCta')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
        {[
          { Icon: Tag, titleKey: 'valueProps.items.0.title', subtitleKey: 'valueProps.items.0.subtitle' },
          { Icon: Package, titleKey: 'valueProps.items.1.title', subtitleKey: 'valueProps.items.1.subtitle' },
          { Icon: Users, titleKey: 'valueProps.items.2.title', subtitleKey: 'valueProps.items.2.subtitle' },
          { Icon: Headphones, titleKey: 'valueProps.items.3.title', subtitleKey: 'valueProps.items.3.subtitle' },
        ].map(({ Icon, titleKey, subtitleKey }, i) => (
          <div
            key={titleKey}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-(--ra-border) bg-white p-6 text-start shadow-[0_1px_2px_rgba(2,6,23,0.04),0_14px_36px_-14px_rgba(6,51,39,0.16)] transition duration-300 hover:border-(--ra-gold)/40 hover:shadow-[0_1px_2px_rgba(2,6,23,0.04),0_22px_48px_-14px_rgba(6,51,39,0.22)] motion-safe:hover:-translate-y-1"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-[#eef3ef] text-(--ra-green) ring-1 ring-(--ra-green)/10 transition duration-300 group-hover:bg-(--ra-gold)/15 group-hover:ring-(--ra-gold)/35">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="text-[11px] font-semibold text-(--ra-muted)/60 tabular-nums" aria-hidden="true">
                0{i + 1}
              </span>
            </div>
            <h3 className="mt-5 text-base font-bold text-(--ra-black)">{t(titleKey)}</h3>
            <span className="mt-2.5 block h-0.5 w-8 rounded-full bg-(--ra-gold)" aria-hidden="true" />
            <p className="mt-3 text-sm leading-relaxed text-(--ra-muted)">{t(subtitleKey)}</p>
          </div>
        ))}
      </section>

      {/* Featured programs */}
      <section className="relative">
        <div className="mx-auto max-w-6xl space-y-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div className="text-start">
              <h2 className="text-3xl font-bold tracking-tight text-(--ra-green) sm:text-4xl">{t('featuredPrograms.title')}</h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-(--ra-muted) sm:text-base">{t('featuredPrograms.subtitle')}</p>
            </div>
            <Link
              to="/offers"
              className="inline-flex items-center justify-center gap-2 self-start rounded-2xl border border-(--ra-border) bg-white px-6 py-3 text-sm font-semibold text-(--ra-black) shadow-sm transition motion-safe:hover:-translate-y-0.5 motion-safe:hover:border-(--ra-gold)/45 motion-safe:hover:shadow-md sm:self-auto"
            >
              <span>{t('featuredPrograms.viewAll')}</span>
              <ArrowRight className="h-4 w-4 rtl:hidden" aria-hidden="true" />
              <ArrowLeft className="hidden h-4 w-4 rtl:inline" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {loadingPackages ? (
              [0, 1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse rounded-2xl border border-(--ra-border) bg-white p-2.5" aria-hidden="true">
                  <div className="aspect-4/3 rounded-xl bg-(--ra-bg)" />
                  <div className="space-y-3 p-3 pt-4">
                    <div className="h-4 w-2/3 rounded bg-(--ra-bg)" />
                    <div className="h-3 w-full rounded bg-(--ra-bg)" />
                    <div className="h-3 w-4/5 rounded bg-(--ra-bg)" />
                    <div className="h-9 w-full rounded-xl bg-(--ra-bg)" />
                  </div>
                </div>
              ))
            ) : packageError ? (
              <div className="col-span-full rounded-2xl border border-dashed border-(--ra-border) bg-white p-10 text-center text-sm font-medium text-(--ra-muted)">
                {ts('ui.catalogError')}
              </div>
            ) : packages.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-dashed border-(--ra-border) bg-white p-10 text-center text-sm font-medium text-(--ra-muted)">
                {t('featuredPrograms.empty')}
              </div>
            ) : (
              packages.map((pkg) => {
                const fallback = PACKAGE_FALLBACK.umrah
                const image = pkg.imageUrl ?? fallback
                return (
                  <article
                    key={pkg.id}
                    className="group flex flex-col rounded-2xl border border-(--ra-border) bg-white p-2.5 shadow-[0_1px_2px_rgba(2,6,23,0.04),0_14px_36px_-14px_rgba(6,51,39,0.16)] transition duration-300 hover:border-(--ra-gold)/40 hover:shadow-[0_1px_2px_rgba(2,6,23,0.04),0_22px_48px_-14px_rgba(6,51,39,0.24)] motion-safe:hover:-translate-y-1"
                  >
                    <Link to={`/booking?package=${pkg.id}`} className="relative block aspect-4/3 overflow-hidden rounded-xl bg-(--ra-bg)">
                      <img
                        src={image}
                        alt={pkg.title}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover motion-safe:transition-transform motion-safe:duration-700 motion-safe:group-hover:scale-[1.06]"
                        onError={(e) => {
                          if (!e.currentTarget.src.endsWith(fallback)) e.currentTarget.src = fallback
                        }}
                      />
                      <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/55 via-black/5 to-transparent" aria-hidden="true" />
                      <span className="absolute top-3 inset-s-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-(--ra-green) shadow-sm backdrop-blur-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-(--ra-gold)" aria-hidden="true" />
                        {t('featuredPrograms.umrah')}
                      </span>
                      <span className="absolute bottom-3 inset-s-3 inline-flex items-center gap-1.5 text-xs font-semibold text-white">
                        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                        {pkg.duration ? t('featuredPrograms.days', { count: pkg.duration }) : t('featuredPrograms.flexible')}
                      </span>
                    </Link>

                    <div className="flex flex-1 flex-col px-2.5 pt-4 pb-1.5 text-start">
                      <h3 className="line-clamp-1 text-base font-bold text-(--ra-black)">{pkg.title}</h3>
                      <p className="mt-1.5 line-clamp-2 min-h-10 text-sm leading-5 text-(--ra-muted)">{pkg.description}</p>

                      <div className="mt-4 flex items-end justify-between gap-3 border-t border-(--ra-border)/70 pt-4">
                        <div className="min-w-0">
                          <div className="text-[11px] font-medium text-(--ra-muted)">{t('featuredPrograms.from')}</div>
                          <div className="mt-0.5 flex items-baseline gap-1 text-xl font-extrabold leading-none text-(--ra-green) tabular-nums">
                          {Number(pkg.price ?? 0).toLocaleString('en-US')}
                            <span className="text-xs font-bold text-(--ra-gold)">{t('featuredPrograms.currency')}</span>
                          </div>
                        </div>
                        <Link
                          to={`/booking?package=${pkg.id}`}
                          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-(--ra-green) px-3.5 py-2.5 text-xs font-semibold text-white shadow-[0_8px_18px_-8px_rgba(6,51,39,0.6)] transition hover:bg-(--ra-green-2)"
                        >
                          {t('featuredPrograms.bookNow')}
                          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 rtl:hidden" aria-hidden="true" />
                          <ArrowLeft className="hidden h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5 rtl:inline" aria-hidden="true" />
                        </Link>
                      </div>
                    </div>
                  </article>
                )
              })
            )}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative -mx-4 overflow-hidden bg-white px-4 py-16 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-10 lg:py-24">
        <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-[#fbf8f1] via-white to-[#f7f3ea]" aria-hidden="true" />
        <img
          src={STATS_BG}
          alt=""
          loading="lazy"
          decoding="async"
          className="pointer-events-none absolute inset-y-0 right-0 h-full w-full object-cover object-right opacity-25 mask-[linear-gradient(to_left,black_45%,transparent)] lg:w-[32%] lg:opacity-100 xl:w-[36%]"
          aria-hidden="true"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-white to-transparent" aria-hidden="true" />
        <div
          className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-(--ra-gold)/12 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-8 lg:pr-[26%] xl:gap-12 xl:pr-[30%] rtl:lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div className="text-start lg:order-2 rtl:lg:order-none">
            <span className="inline-flex items-center gap-2 rounded-full border border-(--ra-gold)/30 bg-[#fbf3df] px-3.5 py-1 text-xs font-semibold text-(--ra-green) shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-(--ra-gold)" aria-hidden="true" />
              {t('stats.eyebrow')}
            </span>
            <h2 className="mt-5 text-balance text-3xl font-bold leading-tight tracking-tight text-(--ra-green) sm:text-4xl lg:text-3xl xl:text-[2.6rem]">
              {t('stats.titleLead')}
              <span className="block bg-linear-to-r from-[#b8893a] via-(--ra-gold) to-[#d9b56a] bg-clip-text text-transparent rtl:bg-linear-to-l">
                {t('stats.titleAccent')}
              </span>
            </h2>
            <p className="mt-4 max-w-md text-pretty text-sm leading-relaxed text-(--ra-muted) sm:text-base">{t('stats.subtitle')}</p>
            <Link
              to="/booking"
              className="group/cta mt-8 inline-flex items-center gap-2 rounded-xl bg-(--ra-green) px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_-8px_rgba(6,51,39,0.5)] transition hover:bg-(--ra-green-2)"
            >
              {t('stats.cta')}
              <ArrowRight className="h-4 w-4 transition-transform group-hover/cta:translate-x-0.5 rtl:hidden" aria-hidden="true" />
              <ArrowLeft className="hidden h-4 w-4 transition-transform group-hover/cta:-translate-x-0.5 rtl:inline" aria-hidden="true" />
            </Link>
          </div>

          <div ref={statsRef} className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:order-1 rtl:lg:order-none">
            {[
              { Icon: Globe, key: 'countries' },
              { Icon: Smile, key: 'satisfaction' },
              { Icon: Award, key: 'experience' },
              { Icon: Users, key: 'pilgrims' },
            ].map(({ Icon, key }, i) => (
              <div
                key={key}
                className={`transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                  statsInView ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100'
                }`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="group relative h-full overflow-hidden rounded-2xl border border-white bg-white/85 p-5 text-start shadow-[0_1px_2px_rgba(2,6,23,0.04),0_14px_36px_-14px_rgba(6,51,39,0.18)] ring-1 ring-(--ra-border)/70 backdrop-blur-md transition duration-300 hover:ring-(--ra-gold)/40 hover:shadow-[0_1px_2px_rgba(2,6,23,0.04),0_22px_48px_-14px_rgba(6,51,39,0.24)] motion-safe:hover:-translate-y-0.5 sm:p-6">
                  <div className="pointer-events-none absolute bottom-0 flex h-20 items-end gap-1.5 opacity-[0.07] inset-e-6" aria-hidden="true">
                    {STATS_BARS.map((h, b) => (
                      <span key={b} className="w-2.5 rounded-t-sm bg-(--ra-green)" style={{ height: `${h}%` }} />
                    ))}
                  </div>

                  <div className="relative flex items-start justify-between gap-3">
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-[#eef3ef] text-(--ra-green) ring-1 ring-(--ra-green)/10 transition duration-300 group-hover:bg-(--ra-gold)/15 group-hover:ring-(--ra-gold)/35">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 text-end">
                      <span className="block text-[11px] font-semibold text-(--ra-muted)/70 tabular-nums" aria-hidden="true">
                        0{i + 1}
                      </span>
                      <span className="mt-1 flex max-w-full items-center justify-end gap-1 text-[11px] font-medium text-(--ra-muted)" aria-hidden="true">
                        <TrendingUp className="h-3 w-3 shrink-0 text-emerald-600 rtl:-scale-x-100" />
                        <span className="truncate">{t(`stats.${key}.label`)}</span>
                      </span>
                    </div>
                  </div>
                  <div className="relative mt-5 text-4xl font-extrabold leading-none tracking-tight text-(--ra-green) tabular-nums sm:text-[2.6rem] lg:text-[2.1rem] xl:text-[2.6rem]">
                    <CountUp value={t(`stats.${key}.value`)} start={statsInView} delayMs={i * 100 + 150} durationMs={2000} />
                  </div>
                  <span className="relative mt-3 block h-0.5 w-10 rounded-full bg-(--ra-gold)" aria-hidden="true" />
                  <p className="relative mt-3 text-sm font-bold text-(--ra-black)">{t(`stats.${key}.label`)}</p>
                  <p className="relative mt-1 text-xs leading-relaxed text-(--ra-muted)">{t(`stats.${key}.caption`)}</p>
                  <span
                    className={`absolute inset-x-0 bottom-0 h-0.5 origin-left bg-linear-to-r from-(--ra-gold) to-(--ra-gold)/0 transition-transform duration-1000 ease-out motion-reduce:transition-none rtl:origin-right rtl:bg-linear-to-l ${
                      statsInView ? 'scale-x-100' : 'scale-x-0 motion-reduce:scale-x-100'
                    }`}
                    style={{ transitionDelay: `${i * 100 + 300}ms` }}
                    aria-hidden="true"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why choose us + video */}
      <section className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:items-center lg:gap-14">
        <div className="relative order-1 pb-12 pe-6 sm:pe-12 lg:order-2 rtl:lg:order-1">
          <div
            className="pointer-events-none absolute -top-6 inset-e-0 h-40 w-40 bg-[radial-gradient(rgba(198,160,74,0.45)_1.5px,transparent_1.5px)] bg-size-[14px_14px]"
            aria-hidden="true"
          />
          <div className="relative overflow-hidden rounded-3xl shadow-[0_28px_70px_-20px_rgba(6,51,39,0.35)] ring-1 ring-black/5">
            <img
              src={WHY_MAIN_IMAGE}
              alt=""
              loading="lazy"
              decoding="async"
              className="aspect-5/4 w-full bg-(--ra-bg) object-cover"
              onError={(e) => {
                if (e.currentTarget.src !== IMAGE_FALLBACK) e.currentTarget.src = IMAGE_FALLBACK
              }}
            />
          </div>

          <div className="absolute bottom-0 inset-e-0 w-[42%] overflow-hidden rounded-2xl border-4 border-white shadow-[0_20px_50px_-12px_rgba(6,51,39,0.4)]">
            <img src={WHY_SECOND_IMAGE} alt="" loading="lazy" decoding="async" className="aspect-square w-full object-cover" />
          </div>

          <div className="absolute top-5 inset-s-5 flex items-center gap-3 rounded-2xl bg-white/95 p-3 pe-5 shadow-[0_16px_40px_-12px_rgba(2,6,23,0.3)] ring-1 ring-black/5 backdrop-blur-sm">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-(--ra-gold)/15 text-(--ra-gold)">
              <Award className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="text-start leading-tight">
              <div className="text-xl font-extrabold text-(--ra-green) tabular-nums">{t('stats.experience.value')}</div>
              <div className="text-xs font-medium text-(--ra-muted)">{t('stats.experience.label')}</div>
            </div>
          </div>

          <div className="absolute bottom-6 inset-s-5 flex items-center gap-3 rounded-2xl bg-(--ra-green) p-3 pe-5 text-white shadow-[0_16px_40px_-12px_rgba(6,51,39,0.6)] ring-1 ring-(--ra-gold)/25">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-(--ra-gold)">
              <Headphones className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="text-sm font-bold">{t('valueProps.items.3.title')}</div>
          </div>
        </div>

        <div className="order-2 text-start lg:order-1 rtl:lg:order-2">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-(--ra-gold)">{t('whyUs.titleGold')}</p>
          <h2 className="mt-2 text-2xl font-bold leading-snug text-(--ra-green) sm:text-3xl">{t('whyUs.titleGreen')}</h2>
          <p className="mt-4 text-sm leading-relaxed text-(--ra-muted) sm:text-base">{t('whyUs.intro')}</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              { Icon: Globe, titleKey: 'whyUs.items.0.title', subtitleKey: 'whyUs.items.0.subtitle' },
              { Icon: Bus, titleKey: 'whyUs.items.1.title', subtitleKey: 'whyUs.items.1.subtitle' },
              { Icon: Car, titleKey: 'whyUs.items.2.title', subtitleKey: 'whyUs.items.2.subtitle' },
              { Icon: FileText, titleKey: 'whyUs.items.3.title', subtitleKey: 'whyUs.items.3.subtitle' },
            ].map(({ Icon, titleKey, subtitleKey }) => (
              <div
                key={titleKey}
                className="group rounded-2xl border border-(--ra-border) bg-white p-5 shadow-[0_1px_2px_rgba(2,6,23,0.04),0_12px_30px_-14px_rgba(6,51,39,0.14)] transition duration-300 hover:border-(--ra-gold)/40 motion-safe:hover:-translate-y-0.5"
              >
                <div className="grid h-11 w-11 place-items-center rounded-full bg-[#eef3ef] text-(--ra-green) ring-1 ring-(--ra-green)/10 transition duration-300 group-hover:bg-(--ra-gold)/15 group-hover:ring-(--ra-gold)/35">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="mt-4 text-sm font-bold text-(--ra-black)">{t(titleKey)}</div>
                <p className="mt-1 text-xs leading-relaxed text-(--ra-muted)">{t(subtitleKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Destinations */}
      <section className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div className="text-start">
            <span className="inline-flex items-center gap-2 rounded-full border border-(--ra-gold)/30 bg-[#fbf3df] px-3.5 py-1 text-xs font-semibold text-(--ra-green)">
              <MapPin className="h-3.5 w-3.5 text-(--ra-gold)" aria-hidden="true" />
              {t('destinations.eyebrow')}
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-(--ra-green) sm:text-4xl">{t('destinations.title')}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-(--ra-muted) sm:text-base">{t('destinations.subtitle')}</p>
          </div>
          <Link
            to="/tourism"
            className="inline-flex shrink-0 items-center gap-2 self-start rounded-2xl bg-(--ra-green) px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_-10px_rgba(6,51,39,0.6)] transition hover:bg-(--ra-green-2) sm:self-auto"
          >
            {t('destinations.cta')}
            <ArrowRight className="h-4 w-4 rtl:hidden" aria-hidden="true" />
            <ArrowLeft className="hidden h-4 w-4 rtl:inline" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid auto-rows-[220px] gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:auto-rows-[230px] lg:gap-5">
          {destinations.map((d, i) => (
            <Link
              key={d.nameKey}
              to="/tourism"
              className={`group relative overflow-hidden rounded-3xl bg-(--ra-bg) shadow-[0_18px_44px_-18px_rgba(6,51,39,0.35)] ring-1 ring-black/5 ${DESTINATION_LAYOUT[i]}`}
            >
              <img
                src={d.img}
                alt=""
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover motion-safe:transition-transform motion-safe:duration-700 motion-safe:group-hover:scale-[1.05]"
                onError={(e) => {
                  if (e.currentTarget.src !== IMAGE_FALLBACK) e.currentTarget.src = IMAGE_FALLBACK
                }}
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/30 via-45% to-transparent" aria-hidden="true" />

              <span className="absolute top-4 inset-s-4 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold text-white ring-1 ring-white/30 backdrop-blur-md tabular-nums">
                0{i + 1}
              </span>

              <span className="absolute top-4 inset-e-4 grid h-9 w-9 place-items-center rounded-full bg-white text-(--ra-green) shadow-lg transition duration-300 group-hover:bg-(--ra-gold) group-hover:text-white">
                <ArrowUpRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
              </span>

              <div className="absolute inset-x-0 bottom-0 p-5 text-start text-white sm:p-6">
                <h3 className={`font-bold ${i === 0 ? 'text-2xl sm:text-3xl' : 'text-xl'}`}>{t(d.nameKey)}</h3>
                <p className={`mt-1.5 text-sm leading-relaxed text-white/85 ${i === 0 ? 'max-w-sm' : 'line-clamp-2'}`}>{t(d.descKey)}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Promo / advisory CTA */}
      <section className="relative -mx-4 overflow-hidden bg-(--ra-green) px-4 py-12 text-white sm:-mx-6 sm:rounded-[24px] sm:px-8 lg:mx-0 lg:px-12 lg:py-14">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_120%_at_0%_0%,rgba(198,160,74,0.18),transparent_55%),radial-gradient(70%_100%_at_100%_100%,rgba(255,255,255,0.08),transparent_50%)]" aria-hidden="true" />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl text-start">
            <h2 className="text-2xl font-bold leading-snug sm:text-3xl">{t('promo.title')}</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/85 sm:text-base">{t('promo.subtitle')}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:shrink-0">
            <Link
              to="/booking"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-7 py-3.5 text-sm font-semibold text-(--ra-green) shadow-lg transition motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-xl"
            >
              {t('promo.primary')}
              <ArrowRight className="h-4 w-4 rtl:hidden" aria-hidden="true" />
              <ArrowLeft className="hidden h-4 w-4 rtl:inline" aria-hidden="true" />
            </Link>
            <a
              href={telHref(phone)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition motion-safe:hover:-translate-y-0.5 motion-safe:hover:bg-white/15"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
              {t('promo.secondary')}
            </a>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="mx-auto max-w-6xl rounded-[22px] border border-(--ra-border) bg-white p-7 shadow-[0_22px_70px_rgba(2,6,23,0.08)] ring-1 ring-black/2 sm:p-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="text-start">
            <div className="text-2xl font-bold text-(--ra-green)">{t('contactCta.title')}</div>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-(--ra-muted) sm:text-base">{t('contactCta.subtitle')}</p>
          </div>
          <Link
            to="/booking"
            className="inline-flex justify-center rounded-2xl bg-(--ra-green) px-8 py-3.5 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(6,51,39,0.28)] transition motion-safe:hover:-translate-y-0.5 hover:bg-(--ra-green-2) md:min-w-[200px] md:justify-center"
          >
            {t('contactCta.action')}
          </Link>
        </div>
      </section>

      <a
        href={waHref}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-5 inset-s-5 z-30 inline-flex items-center gap-2 rounded-full border border-white/20 bg-[#25D366] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_44px_rgba(37,211,102,0.45)] ring-1 ring-black/5 backdrop-blur-sm transition motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-xl"
      >
        <MessageCircle className="h-5 w-5" aria-hidden="true" />
        {t('whatsapp.label')}
      </a>
    </div>
  )
}
