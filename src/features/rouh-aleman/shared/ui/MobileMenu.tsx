import { useEffect } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/auth-context'
import { CompanyLogo } from './CompanyLogo'
import { MainNavLinks } from './MainNavLinks'

type Props = {
  open: boolean
  onClose: () => void
}

export function MobileMenu({ open, onClose }: Props) {
  const { t } = useTranslation('shared')
  const { session } = useAuth()

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-60 md:hidden" role="dialog" aria-modal="true" aria-label={t('ui.menuTitle')}>
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-(--ra-green)/20 backdrop-blur-[3px] transition-opacity"
        aria-label={t('ui.closeMenu')}
      />
      <div className="absolute inset-x-0 top-0 mx-auto w-full max-w-md rounded-b-2xl border border-(--ra-border)/80 bg-white/98 p-4 shadow-[0_20px_48px_rgba(11,15,20,0.12)] backdrop-blur-md">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-6 top-0 h-px bg-linear-to-r from-transparent via-(--ra-gold)/40 to-transparent"
        />
        <div className="flex items-start justify-between gap-3">
          <CompanyLogo />
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-(--ra-border)/80 text-(--ra-green) transition-all duration-200 hover:border-(--ra-gold)/30 hover:bg-(--ra-gold-soft)/25"
            aria-label={t('ui.closeMenu')}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <nav
          className="mt-3 grid max-h-[min(70dvh,28rem)] gap-1 overflow-y-auto py-1"
          aria-label="Main"
        >
          <MainNavLinks onNavigate={onClose} />
          <Link
            to={session ? '/account' : '/login'}
            onClick={onClose}
            className="mt-2 rounded-xl px-3 py-3 text-sm font-semibold text-(--ra-green) hover:bg-(--ra-bg)"
          >
            {t('navbar.account')}
          </Link>
        </nav>
      </div>
    </div>
  )
}
