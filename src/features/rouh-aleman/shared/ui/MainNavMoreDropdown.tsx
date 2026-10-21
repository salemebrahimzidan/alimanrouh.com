import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Info, Mail, type LucideIcon } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { isMainNavMoreActive, MAIN_NAV_MORE, resolveMainNavLabelKey } from '../nav-items'
import { mainNavDropdownLinkClass, mainNavTabLinkClass } from './main-nav-tab-styles'

type Props = {
  compactLabels?: boolean
}

type MenuPosition = {
  top: number
  left?: number
  right?: number
}

const MENU_MIN_WIDTH = 200
const VIEWPORT_PAD = 8
const MENU_GAP = 8

const MORE_NAV_ICONS: Record<string, LucideIcon> = {
  '/about': Info,
  '/contact': Mail,
}

function computeMenuPosition(button: HTMLElement, menuWidth: number): MenuPosition {
  const rect = button.getBoundingClientRect()
  const top = rect.bottom + MENU_GAP
  const isRtl = document.documentElement.dir === 'rtl'

  if (isRtl) {
    let right: number | undefined = window.innerWidth - rect.right
    let left: number | undefined

    if (rect.left + menuWidth > window.innerWidth - VIEWPORT_PAD) {
      left = Math.max(VIEWPORT_PAD, rect.right - menuWidth)
      right = undefined
    }

    return { top, left, right }
  }

  let right: number | undefined = window.innerWidth - rect.right
  let left: number | undefined

  if (rect.right - menuWidth < VIEWPORT_PAD) {
    left = VIEWPORT_PAD
    right = undefined
  }

  return { top, left, right }
}

export function MainNavMoreDropdown({ compactLabels }: Props) {
  const { t } = useTranslation('shared')
  const { pathname } = useLocation()
  const [openPath, setOpenPath] = useState<string | null>(null)
  const open = openPath === pathname
  const setOpen = useCallback((next: boolean | ((value: boolean) => boolean)) => {
    setOpenPath((current) => {
      const isOpen = current === pathname
      const value = typeof next === 'function' ? next(isOpen) : next
      return value ? pathname : null
    })
  }, [pathname])
  const [menuPos, setMenuPos] = useState<MenuPosition | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLUListElement>(null)
  const menuId = useId()
  const groupActive = isMainNavMoreActive(pathname)

  const updateMenuPosition = () => {
    const button = buttonRef.current
    if (!button) return
    const menuWidth = menuRef.current?.offsetWidth ?? MENU_MIN_WIDTH
    setMenuPos(computeMenuPosition(button, menuWidth))
  }

  useLayoutEffect(() => {
    if (!open) return

    updateMenuPosition()
    const raf = requestAnimationFrame(updateMenuPosition)
    window.addEventListener('resize', updateMenuPosition)
    window.addEventListener('scroll', updateMenuPosition, true)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', updateMenuPosition)
      window.removeEventListener('scroll', updateMenuPosition, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    let removeListeners: (() => void) | undefined

    const timer = window.setTimeout(() => {
      const onPointerDown = (event: PointerEvent) => {
        const target = event.target as Node
        if (buttonRef.current?.contains(target)) return
        if (menuRef.current?.contains(target)) return
        setOpen(false)
      }
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') setOpen(false)
      }

      document.addEventListener('pointerdown', onPointerDown)
      document.addEventListener('keydown', onKeyDown)
      removeListeners = () => {
        document.removeEventListener('pointerdown', onPointerDown)
        document.removeEventListener('keydown', onKeyDown)
      }
    }, 0)

    return () => {
      window.clearTimeout(timer)
      removeListeners?.()
    }
  }, [open, setOpen])

  const menu =
    open && menuPos
      ? createPortal(
          <ul
            ref={menuRef}
            id={menuId}
            role="menu"
            dir={document.documentElement.dir}
            style={{
              position: 'fixed',
              top: menuPos.top,
              left: menuPos.left,
              right: menuPos.right,
              zIndex: 100,
            }}
            className="min-w-50 overflow-hidden rounded-xl border border-(--ra-border)/80 bg-white/98 py-1.5 text-start shadow-[0_12px_36px_rgba(11,15,20,0.09),0_2px_6px_rgba(11,15,20,0.04)] backdrop-blur-sm"
          >
            {MAIN_NAV_MORE.map((item) => {
              const Icon = MORE_NAV_ICONS[item.to]
              return (
                <li key={item.to} role="none">
                  <NavLink
                    to={item.to}
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className={({ isActive }) => mainNavDropdownLinkClass(isActive)}
                  >
                    {Icon ? (
                      <Icon
                        className="h-4 w-4 shrink-0 text-(--ra-green)/70"
                        aria-hidden="true"
                      />
                    ) : null}
                    {t(resolveMainNavLabelKey(item, compactLabels))}
                  </NavLink>
                </li>
              )
            })}
          </ul>,
          document.body,
        )
      : null

  return (
    <div className="relative flex flex-auto">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className={mainNavTabLinkClass(groupActive || open)}
      >
        {t('nav.more')}
        <ChevronDown
          className={[
            'h-3.5 w-3.5 shrink-0 opacity-75 transition-transform duration-400 ease-[cubic-bezier(0.33,1,0.68,1)]',
            open ? 'rotate-180' : '',
          ].join(' ')}
          aria-hidden="true"
        />
      </button>
      {menu}
    </div>
  )
}
