import { useState } from 'react'
import { CalendarDays, Menu, Phone, UserRound } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../auth/auth-context'
import { useScrolled } from '../hooks/useScrolled'
import { AccountMenuDrawer } from './AccountMenuDrawer'
import { LanguageDropdown } from './LanguageSwitcher'
import { MobileMenu } from './MobileMenu'
import { CompanyLogo } from './CompanyLogo'
import { MainNavTabs } from './MainNavTabs'
import {
  bookNowButtonClass,
  mainNavTabListClass,
  navPhoneButtonClass,
} from './main-nav-tab-styles'

function telHref(phone: string) {
  return `tel:${phone.replace(/\s/g, '')}`
}

function BrandLockup({ compactLogo }: { compactLogo?: boolean }) {
  const { t } = useTranslation('shared')

  return (
    <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
      <CompanyLogo compact={compactLogo} />
      <div className="hidden min-w-0 max-w-28 leading-tight lg:block xl:max-w-none">
        <p className="truncate text-sm font-semibold tracking-tight text-(--ra-green) xl:text-[15px]">
          {t('brand.nameShort')}
        </p>
        <p className="hidden truncate text-[10px] font-medium tracking-[0.18em] text-(--ra-gold) uppercase xl:block xl:text-[11px]">
          {t('brand.nameLatinUpper')}
        </p>
      </div>
    </div>
  )
}

function NavbarActions({ onAccountClick }: { onAccountClick: () => void }) {
  const { t } = useTranslation('shared')

  return (
    <div className="flex shrink-0 items-center gap-1.5 xl:gap-2.5">
      <LanguageDropdown tone="light" />
      <button
        type="button"
        onClick={onAccountClick}
        className={[navPhoneButtonClass, 'h-9 w-9'].join(' ')}
        aria-label={t('navbar.account')}
      >
        <UserRound className="h-4 w-4" aria-hidden="true" />
      </button>
      <Link
        to="/booking"
        className={[bookNowButtonClass, 'group h-9 px-2.5 text-sm xl:px-4'].join(' ')}
      >
        <CalendarDays
          className="h-4 w-4 shrink-0 opacity-90 transition-transform duration-400 ease-[cubic-bezier(0.33,1,0.68,1)] motion-safe:group-hover:scale-[1.04]"
          aria-hidden="true"
        />
        <span className="hidden truncate lg:inline">{t('navbar.bookNow')}</span>
      </Link>
    </div>
  )
}

function DesktopNavStrip({ compactLabels }: { compactLabels?: boolean }) {
  return (
    <nav className={mainNavTabListClass} aria-label="Main">
      <MainNavTabs compactLabels={compactLabels} />
    </nav>
  )
}

type NavbarProps = {
  /** When provided (e.g. from layout), avoids a second scroll listener. */
  scrolled?: boolean
}

export function Navbar({ scrolled: scrolledProp }: NavbarProps = {}) {
  const { t } = useTranslation('shared')
  const { session } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const scrolledDetected = useScrolled(10)
  const scrolled = scrolledProp ?? scrolledDetected
  const phone = t('company.phone')

  function openAccountMenu() {
    if (!session) {
      navigate('/login')
      return
    }
    setAccountMenuOpen(true)
  }

  return (
    <>
      <div
        data-scrolled={scrolled ? '' : undefined}
        className={[
          'relative shrink-0 border-b backdrop-blur-md transition-[background-color,box-shadow,backdrop-filter,border-color] duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] supports-backdrop-filter:backdrop-blur-xl',
          scrolled
            ? 'border-(--ra-border)/90 bg-white/72 shadow-[0_6px_28px_rgba(11,15,20,0.06)] supports-backdrop-filter:bg-white/65'
            : 'border-(--ra-border)/70 bg-white/95 shadow-[0_4px_24px_rgba(11,15,20,0.04)] supports-backdrop-filter:bg-white/90',
        ].join(' ')}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-(--ra-gold)/35 to-transparent"
        />

        {/* Mobile */}
        <div className="relative flex min-h-16 items-center justify-between gap-2 px-4 py-2.5 lg:hidden">
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className={[navPhoneButtonClass, 'h-10 w-10'].join(' ')}
              aria-label={t('ui.openMenu')}
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
            <div className="min-w-0">
              <CompanyLogo mobileHeader />
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <LanguageDropdown tone="light" />
            <button
              type="button"
              onClick={openAccountMenu}
              className={[navPhoneButtonClass, 'h-9 w-9'].join(' ')}
              aria-label={t('navbar.account')}
              aria-haspopup="dialog"
              aria-expanded={accountMenuOpen}
            >
              <UserRound className="h-4 w-4" aria-hidden="true" />
            </button>
            <a
              href={telHref(phone)}
              className={[navPhoneButtonClass, 'h-9 w-9'].join(' ')}
              aria-label={t('topBar.phoneLabel')}
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
            </a>
            <Link
              to="/booking"
              className={[bookNowButtonClass, 'h-9 max-w-32 gap-1.5 px-3 text-xs sm:max-w-none'].join(
                ' ',
              )}
            >
              <CalendarDays className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden="true" />
              <span className="truncate">{t('navbar.bookNow')}</span>
            </Link>
          </div>
        </div>

        {/* Desktop — brand, nav, and actions on one row */}
        <div className="mx-auto hidden w-full max-w-7xl px-4 lg:block xl:px-8">
          <div className="flex items-center gap-2 overflow-visible py-2 xl:gap-5 xl:py-2.5">
            <div className="shrink-0">
              <BrandLockup compactLogo />
            </div>
            <div className="flex min-w-0 flex-1 justify-center">
              <DesktopNavStrip compactLabels />
            </div>
            <NavbarActions onAccountClick={openAccountMenu} />
          </div>
        </div>
      </div>
      <MobileMenu open={open} onClose={() => setOpen(false)} />
      <AccountMenuDrawer open={accountMenuOpen} onClose={() => setAccountMenuOpen(false)} />
    </>
  )
}
