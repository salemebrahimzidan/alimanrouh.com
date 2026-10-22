import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, Clock, Mail, MapPin, Phone } from 'lucide-react'
import { siFacebook, siInstagram, siSnapchat, siTiktok, siWhatsapp, siX, siYoutube, type SimpleIcon } from 'simple-icons'
import { LtrText } from './LtrText'

/** Icons without an href render as non-clickable placeholders until the account URL is set. */
const SOCIAL_LINKS: Array<{ icon: SimpleIcon; href: string; tone: string }> = [
  {
    icon: siInstagram,
    href: '',
    tone: 'bg-[radial-gradient(circle_at_30%_107%,#fdf497_0%,#fdf497_5%,#fd5949_45%,#d6249f_60%,#285aeb_90%)] text-white',
  },
  { icon: siFacebook, href: '', tone: 'bg-[#0866ff] text-white' },
  { icon: siX, href: '', tone: 'bg-black text-white' },
  { icon: siTiktok, href: '', tone: 'bg-black text-white' },
  { icon: siSnapchat, href: '', tone: 'bg-[#fffc00] text-black ring-1 ring-black/10' },
  { icon: siYoutube, href: '', tone: 'bg-[#ff0000] text-white' },
]

const socialBaseClass =
  'grid h-10 w-10 place-items-center rounded-full shadow-[0_6px_16px_-8px_rgba(2,6,23,0.45)] transition duration-300 motion-safe:hover:-translate-y-0.5 hover:shadow-[0_10px_22px_-8px_rgba(2,6,23,0.5)]'

function BrandIcon({ icon }: { icon: SimpleIcon }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d={icon.path} />
    </svg>
  )
}

const quickLinks = [
  { to: '/', key: 'nav.home' },
  { to: '/umrah', key: 'nav.umrah' },
  { to: '/hajj', key: 'nav.hajj' },
  { to: '/tourism', key: 'nav.tourism' },
  { to: '/flights', key: 'nav.flights' },
]

const moreLinks = [
  { to: '/about', key: 'nav.about' },
  { to: '/contact', key: 'nav.contact' },
]

function telHref(phone: string) {
  return `tel:${phone.replace(/\s/g, '')}`
}

function FooterHeading({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-2 text-sm font-bold text-(--ra-green)">
      <span className="h-4 w-1 rounded-full bg-(--ra-gold)" aria-hidden="true" />
      {children}
    </div>
  )
}

function FooterLinks({ links }: { links: Array<{ to: string; key: string }> }) {
  const { t } = useTranslation('shared')
  return (
    <ul className="mt-5 grid gap-3">
      {links.map((l) => (
        <li key={l.to}>
          <NavLink
            to={l.to}
            end={l.to === '/'}
            className={({ isActive }) =>
              [
                'group inline-flex items-center gap-1.5 text-sm transition-colors',
                isActive ? 'font-semibold text-(--ra-gold)' : 'text-(--ra-muted) hover:text-(--ra-green)',
              ].join(' ')
            }
          >
            <ChevronRight className="h-3.5 w-3.5 text-(--ra-gold)/70 transition-transform group-hover:translate-x-0.5 rtl:hidden" aria-hidden="true" />
            <ChevronLeft className="hidden h-3.5 w-3.5 text-(--ra-gold)/70 transition-transform group-hover:-translate-x-0.5 rtl:inline" aria-hidden="true" />
            {t(l.key)}
          </NavLink>
        </li>
      ))}
    </ul>
  )
}

export function Footer() {
  const { t } = useTranslation('shared')
  const year = new Date().getFullYear()
  const phone = t('company.phone')
  const phone2 = t('company.phone2')
  const email = t('company.email')

  return (
    <footer className="relative overflow-hidden border-t border-(--ra-border) bg-white text-(--ra-black)">
      <div className="relative mx-auto w-full max-w-6xl px-4 pt-16 pb-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="text-start lg:col-span-3">
            <FooterHeading>{t('footer.quickLinks')}</FooterHeading>
            <FooterLinks links={quickLinks} />
          </div>

          <div className="text-start lg:col-span-2">
            <FooterHeading>{t('footer.more')}</FooterHeading>
            <FooterLinks links={moreLinks} />
          </div>

          <div className="text-start lg:col-span-4">
            <FooterHeading>{t('footer.contact')}</FooterHeading>
            <ul className="mt-5 grid gap-3.5 text-sm text-(--ra-black)/80">
              <li className="flex items-start gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-(--ra-gold) shadow-sm ring-1 ring-(--ra-border)">
                  <Phone className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="flex flex-col gap-0.5 pt-1">
                  <a href={telHref(phone)} className="transition hover:text-(--ra-green)">
                    <LtrText>{phone}</LtrText>
                  </a>
                  <a href={telHref(phone2)} className="transition hover:text-(--ra-green)">
                    <LtrText>{phone2}</LtrText>
                  </a>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-(--ra-gold) shadow-sm ring-1 ring-(--ra-border)">
                  <Mail className="h-4 w-4" aria-hidden="true" />
                </span>
                <a href={`mailto:${email}`} className="transition hover:text-(--ra-green)">
                  <LtrText>{email}</LtrText>
                </a>
              </li>
              <li className="flex items-center gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-(--ra-gold) shadow-sm ring-1 ring-(--ra-border)">
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                </span>
                <span>{t('company.address2')}</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-(--ra-gold) shadow-sm ring-1 ring-(--ra-border)">
                  <Clock className="h-4 w-4" aria-hidden="true" />
                </span>
                <span>{t('company.hours')}</span>
              </li>
            </ul>
          </div>

          <div className="text-start lg:col-span-3">
            <FooterHeading>{t('footer.follow')}</FooterHeading>
            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <a
                href={`https://wa.me/${phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`${socialBaseClass} bg-[#25d366] text-white`}
                aria-label={siWhatsapp.title}
              >
                <BrandIcon icon={siWhatsapp} />
              </a>
              {SOCIAL_LINKS.map(({ icon, href, tone }) =>
                href ? (
                  <a
                    key={icon.slug}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${socialBaseClass} ${tone}`}
                    aria-label={icon.title}
                  >
                    <BrandIcon icon={icon} />
                  </a>
                ) : (
                  <span key={icon.slug} className={`${socialBaseClass} ${tone}`} title={icon.title}>
                    <BrandIcon icon={icon} />
                  </span>
                ),
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="relative border-t border-(--ra-border) bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs sm:flex-row sm:px-6">
          <span className="text-(--ra-muted)">
            © {year} {t('brand.name')} — {t('footer.rights')}
          </span>
          <span className="inline-flex items-center gap-2 font-semibold text-(--ra-gold)">
            <span className="h-1 w-1 rounded-full bg-(--ra-gold)" aria-hidden="true" />
            {t('footer.headline')}
          </span>
        </div>
      </div>
    </footer>
  )
}
