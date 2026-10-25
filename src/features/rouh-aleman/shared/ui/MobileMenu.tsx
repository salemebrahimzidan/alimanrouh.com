import { useEffect } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { CompanyLogo } from './CompanyLogo'
import { MainNavLinks } from './MainNavLinks'

type Props = {
  open: boolean
  onClose: () => void
}

export function MobileMenu({ open, onClose }: Props) {
  const { t } = useTranslation('shared')

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
    <div className="fixed inset-0 z-60 flex bg-black/30 backdrop-blur-[2px] lg:hidden" role="presentation">
      <button
        type="button"
        className="absolute inset-0 h-full w-full cursor-default"
        onClick={onClose}
        aria-label={t('ui.closeMenu')}
      />
      <aside
        className="absolute inset-y-0 right-0 z-10 flex h-dvh w-[min(20rem,80vw)] flex-col border-s border-(--ra-border) bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label={t('ui.menuTitle')}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-6 top-0 h-px bg-linear-to-r from-transparent via-(--ra-gold)/40 to-transparent"
        />
        <div className="flex items-center justify-between gap-3 px-4 pt-4">
          <CompanyLogo mobileHeader />
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-(--ra-border)/80 text-(--ra-green) transition-all duration-200 hover:border-(--ra-gold)/30 hover:bg-(--ra-gold-soft)/25"
            aria-label={t('ui.closeMenu')}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <nav className="mt-4 grid flex-1 content-start gap-1 overflow-y-auto px-4" aria-label="Main">
          <MainNavLinks onNavigate={onClose} />
        </nav>
      </aside>
    </div>
  )
}
