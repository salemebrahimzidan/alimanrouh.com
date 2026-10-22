export type MainNavItem = (typeof MAIN_NAV)[number]
export type MainNavTier = MainNavItem['tier']

/**
 * Header navigation.
 *
 * **primary** — main bar tabs (high-intent / core products)
 * **more** — secondary links in the “More” dropdown (supporting pages + info)
 *
 * Contact stays in “More” because “Book now” is already in the header.
 */
export const MAIN_NAV = [
  // —— Primary (desktop tabs) ——
  { to: '/', key: 'nav.home', shortKey: 'nav.home', tier: 'primary' },
  { to: '/umrah', key: 'nav.umrah', shortKey: 'nav.umrah', tier: 'primary' },
  { to: '/hajj', key: 'nav.hajj', shortKey: 'nav.hajj', tier: 'primary' },
  { to: '/tourism', key: 'nav.tourism', shortKey: 'nav.tourism', tier: 'primary' },
  { to: '/flights', key: 'nav.flights', shortKey: 'nav.flights', tier: 'primary' },
  // —— More dropdown ——
  { to: '/about', key: 'nav.about', shortKey: 'nav.about', tier: 'more' },
  { to: '/contact', key: 'nav.contact', shortKey: 'nav.contact', tier: 'more' },
] as const

export const MAIN_NAV_PRIMARY = MAIN_NAV.filter((item) => item.tier === 'primary')
export const MAIN_NAV_MORE = MAIN_NAV.filter((item) => item.tier === 'more')

export function resolveMainNavLabelKey(item: MainNavItem, compact?: boolean) {
  return compact && item.shortKey ? item.shortKey : item.key
}

export function isMainNavItemActive(pathname: string, to: string) {
  if (to === '/') return pathname === '/'
  return pathname === to || pathname.startsWith(`${to}/`)
}

export function isMainNavMoreActive(pathname: string) {
  return MAIN_NAV_MORE.some((item) => isMainNavItemActive(pathname, item.to))
}
