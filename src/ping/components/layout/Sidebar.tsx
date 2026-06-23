import { NavLink } from 'react-router-dom'
import { useSession } from '@/app/SessionContext'
import { adminNav, businessNav, customerNav, type NavItem } from '@/app/navigation'
import { Icon } from '@/components/common/Icon'
import { RadarMark } from '@/components/common/RadarMark'
import styles from './layout.module.css'

/** Desktop primary navigation — the deep-ink brand anchor on every screen. */
export function Sidebar() {
  const { mode } = useSession()
  const nav: NavItem[] =
    mode === 'business' ? businessNav : mode === 'admin' ? adminNav : customerNav

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <RadarMark size={34} />
        <div className={styles.brandText}>
          <span className={styles.brandName}>Lattice</span>
          <span className={styles.brandTag}>Local offers, matched</span>
        </div>
      </div>

      <nav className={styles.nav} aria-label="Primary">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              isActive ? `${styles.navItem} ${styles.navItemActive}` : styles.navItem
            }
          >
            <Icon name={item.icon} size={19} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className={styles.sideFoot}>
        <NavLink to="/demo" className={styles.demoLink}>
          <Icon name="sliders" size={16} />
          <span>Demo Controls</span>
        </NavLink>
        <p className={styles.offlineNote}>
          <Icon name="shield" size={13} />
          Runs offline · local data
        </p>
      </div>
    </aside>
  )
}
