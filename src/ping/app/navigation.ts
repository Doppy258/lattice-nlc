import type { IconName } from '@/components/common/Icon'

export type NavItem = {
  to: string
  label: string
  icon: IconName
  /** Match the path exactly (for index-style routes like "/" and "/biz"). */
  end?: boolean
}

/** Customer-side primary navigation (PRD §9). */
export const customerNav: NavItem[] = [
  { to: '/', label: 'Home', icon: 'home', end: true },
  { to: '/create', label: 'Create Ping', icon: 'ping' },
  { to: '/matches', label: 'Matches', icon: 'target' },
  { to: '/explore', label: 'Explore', icon: 'compass' },
  { to: '/saved', label: 'Saved', icon: 'bookmark' },
  { to: '/claims', label: 'Claims', icon: 'ticket' },
  { to: '/rankings', label: 'Rankings', icon: 'trophy' },
  { to: '/reports', label: 'Reports', icon: 'chart' },
  { to: '/help', label: 'Help', icon: 'help' },
]

/** Business-owner navigation (PRD §9 / §11). */
export const businessNav: NavItem[] = [
  { to: '/biz', label: 'Dashboard', icon: 'grid', end: true },
  { to: '/biz/create-offer', label: 'Create Offer', icon: 'tagPlus' },
  { to: '/biz/offers', label: 'Offers', icon: 'tag' },
  { to: '/biz/redeem', label: 'Redeem Claim', icon: 'scan' },
  { to: '/biz/reviews', label: 'Reviews', icon: 'star' },
  { to: '/biz/analytics', label: 'Analytics', icon: 'chart' },
]

/** Admin / demo navigation. */
export const adminNav: NavItem[] = [
  { to: '/demo', label: 'Demo Controls', icon: 'sliders' },
]

/** Items shown in the compact mobile bottom bar (max five). */
export const mobileCustomerNav: NavItem[] = customerNav.filter((n) =>
  ['/', '/create', '/matches', '/saved', '/claims'].includes(n.to),
)

export const mobileBusinessNav: NavItem[] = businessNav.filter((n) =>
  ['/biz', '/biz/offers', '/biz/redeem', '/biz/reviews', '/biz/analytics'].includes(n.to),
)
