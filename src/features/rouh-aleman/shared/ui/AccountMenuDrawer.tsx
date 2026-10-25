import { useEffect, useState } from 'react'
import {
  CalendarDays,
  FileText,
  LogOut,
  Mail,
  Phone,
  Stamp,
  UserRound,
  X,
} from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../auth/auth-context'
import { accountStatusLabel } from '../../../../lib/customer-contract'
import { getOwnProfile, type OwnProfile } from '../../../../lib/customer-data'
import { LtrText } from './LtrText'
import { mainNavDrawerLinkClass } from './main-nav-tab-styles'

const links = [
  { to: '/account/bookings', key: 'nav.bookings', icon: CalendarDays },
  { to: '/account/visas', key: 'nav.visas', icon: Stamp },
  { to: '/account/documents', key: 'nav.documents', icon: FileText },
] as const

type Props = {
  open: boolean
  onClose: () => void
}

type ProfileState =
  | { userId: string; status: 'loaded'; profile: OwnProfile | null }
  | { userId: string; status: 'error' }

export function AccountMenuDrawer({ open, onClose }: Props) {
  const { t, i18n } = useTranslation('account')
  const { t: tShared } = useTranslation('shared')
  const { session, signOut } = useAuth()
  const navigate = useNavigate()
  const userId = session?.user.id
  const [profileState, setProfileState] = useState<ProfileState | null>(null)
  const [profileDetailsOpen, setProfileDetailsOpen] = useState(true)

  useEffect(() => {
    if (!open || !userId) return
    let active = true
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    void getOwnProfile(userId)
      .then((result) => {
        if (active) setProfileState({ userId, status: 'loaded', profile: result })
      })
      .catch(() => {
        if (active) setProfileState({ userId, status: 'error' })
      })
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      active = false
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose, userId])

  if (!open) return null
  const currentProfileState = profileState?.userId === userId ? profileState : null
  const profile = currentProfileState?.status === 'loaded' ? currentProfileState.profile : null
  const language = i18n.language === 'ar' ? 'ar' : 'en'

  return (
    <div className="fixed inset-0 z-60 flex bg-black/30 backdrop-blur-[2px]" role="presentation">
      <button
        type="button"
        className="absolute inset-0 h-full w-full cursor-default"
        onClick={onClose}
        aria-label={tShared('ui.closeMenu')}
      />
      <aside
        className="absolute inset-y-0 left-0 right-auto z-10 flex h-full w-[min(20rem,80vw)] flex-col border-s border-(--ra-border) bg-white p-5 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label={t('overview.title')}
      >
        <div className="mb-6 flex items-center justify-between gap-3 border-b border-(--ra-border) pb-4">
          <h2 className="text-base font-bold text-(--ra-green)">{t('overview.title')}</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-(--ra-border) text-(--ra-green) transition hover:bg-(--ra-bg)"
            aria-label={tShared('ui.closeMenu')}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => setProfileDetailsOpen((isOpen) => !isOpen)}
          className={mainNavDrawerLinkClass(profileDetailsOpen)}
          aria-expanded={profileDetailsOpen}
          aria-controls="account-profile-details"
        >
          <span className="flex items-center gap-3">
            <UserRound className="h-4 w-4 shrink-0" aria-hidden="true" />
            {t('nav.profile')}
          </span>
        </button>
        {profileDetailsOpen ? (
        <section id="account-profile-details" className="mb-5 mt-2 rounded-2xl border border-(--ra-border) bg-linear-to-br from-white to-(--ra-bg) p-4 shadow-[0_8px_24px_rgba(11,15,20,0.05)]" aria-label={t('profile.title')}>
          {!currentProfileState ? (
            <p className="text-sm text-(--ra-muted)" role="status">{t('drawer.loading')}</p>
          ) : currentProfileState.status === 'error' ? (
            <p className="text-sm text-red-700" role="alert">{t('drawer.loadError')}</p>
          ) : profile ? (
            <>
              <div className="mb-4 flex items-center gap-3">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-(--ra-green) to-(--ra-green-2) text-base font-bold text-white shadow-sm" aria-hidden="true">
                  {(profile.full_name || '—').trim().charAt(0)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-(--ra-green)">{profile.full_name || '—'}</p>
                  <p className="text-xs text-(--ra-muted)">{t('profile.title')}</p>
                </div>
              </div>
              <dl className="grid gap-2">
                <div className="flex min-w-0 items-center gap-2.5 rounded-xl border border-(--ra-border)/70 bg-white/80 px-3 py-2.5">
                  <Mail className="h-4 w-4 shrink-0 text-(--ra-muted)" aria-hidden="true" />
                  <div className="min-w-0">
                    <dt className="text-[10px] font-semibold text-(--ra-muted)">{t('fields.email')}</dt>
                    <dd className="break-all text-xs text-(--ra-black)"><LtrText>{profile.email ?? '—'}</LtrText></dd>
                  </div>
                </div>
                <div className="flex min-w-0 items-center gap-2.5 rounded-xl border border-(--ra-border)/70 bg-white/80 px-3 py-2.5">
                  <Phone className="h-4 w-4 shrink-0 text-(--ra-muted)" aria-hidden="true" />
                  <div className="min-w-0">
                    <dt className="text-[10px] font-semibold text-(--ra-muted)">{t('fields.mobile')}</dt>
                    <dd className="text-xs text-(--ra-black)"><LtrText>{profile.mobile || '—'}</LtrText></dd>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 px-1 pt-1">
                  <dt className="text-xs font-medium text-(--ra-muted)">{t('overview.status')}</dt>
                  <dd className="rounded-full bg-(--ra-gold-soft) px-2.5 py-1 text-[11px] font-bold text-(--ra-green)">
                    {accountStatusLabel(profile.account_status, language)}
                  </dd>
                </div>
              </dl>
            </>
          ) : (
            <p className="text-sm text-(--ra-muted)" role="status">{t('drawer.profileUnavailable')}</p>
          )}
        </section>
        ) : null}
        <nav className="grid content-start gap-1" aria-label={t('overview.title')}>
          {links.map(({ to, key, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) => mainNavDrawerLinkClass(isActive)}
            >
              <span className="flex items-center gap-3">
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {t(key)}
              </span>
            </NavLink>
          ))}
        </nav>
        <button
          type="button"
          onClick={() => {
            onClose()
            void signOut().then(() => navigate('/'))
          }}
          className="mt-auto inline-flex items-center gap-3 rounded-xl border border-(--ra-border) px-3.5 py-3 text-sm font-medium text-(--ra-muted) transition hover:bg-(--ra-bg) hover:text-(--ra-green)"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          {t('signOut')}
        </button>
      </aside>
    </div>
  )
}
