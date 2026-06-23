import { NavLink } from 'react-router-dom'
import { useSession } from '@/app/SessionContext'
import { mobileBusinessNav, mobileCustomerNav, type NavItem } from '@/app/navigation'
import { Icon } from '@/components/common/Icon'
import styles from './layout.module.css'

/** Bottom tab bar for small screens (max five primary destinations). */
export function MobileNav() {
  const { mode } = useSession()
  const nav: NavItem[] = mode === 'business' ? mobileBusinessNav : mobileCustomerNav

  return (
    <nav className={styles.mobileNav} aria-label="Primary">
      {nav.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            isActive ? `${styles.mobileItem} ${styles.mobileItemActive}` : styles.mobileItem
          }
        >
          <Icon name={item.icon} size={20} />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
