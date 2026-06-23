import { Link } from 'react-router-dom'
import { useSession } from '@/app/SessionContext'
import { useDatabase } from '@/app/useDatabase'
import { Icon } from '@/components/common/Icon'
import { RadarMark } from '@/components/common/RadarMark'
import { ProfileMenu } from './ProfileMenu'
import styles from './layout.module.css'

/** Sticky top bar: location context + help + the profile selector. */
export function TopBar() {
  const { user } = useSession()
  const db = useDatabase()
  const location = db.locations.find((l) => l.id === user.homeLocationId)

  return (
    <header className={styles.topbar}>
      <div className={styles.topbarLeft}>
        <Link to="/" className={styles.topbarBrand}>
          <RadarMark size={26} />
          <span>Lattice</span>
        </Link>
        <span className={styles.location} title="Demo location">
          <Icon name="location" size={16} />
          {location?.label ?? 'Oakville, ON'}
        </span>
      </div>

      <div className={styles.topbarRight}>
        <Link to="/help" className={styles.iconBtn} aria-label="Help & how it works">
          <Icon name="help" size={19} />
        </Link>
        <ProfileMenu />
      </div>
    </header>
  )
}
