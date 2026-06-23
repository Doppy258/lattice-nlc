import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { UserRole } from '@/models'
import { useSession } from '@/app/SessionContext'
import { useDatabase } from '@/app/useDatabase'
import { Icon } from '@/components/common/Icon'
import { initials } from '@/utils/formatting'
import styles from './layout.module.css'

const ROLE_TEXT: Record<UserRole, string> = {
  customer: 'Customer',
  businessOwner: 'Business owner',
  admin: 'Admin · Demo',
}

/**
 * The mock "login" — switch between seeded profiles. Picking a business owner
 * jumps to the business dashboard; the admin profile jumps to Demo Controls.
 */
export function ProfileMenu() {
  const { user, mode, switchUser } = useSession()
  const db = useDatabase()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const handlePick = (id: string, role: UserRole) => {
    switchUser(id)
    setOpen(false)
    navigate(role === 'businessOwner' ? '/biz' : role === 'admin' ? '/demo' : '/')
  }

  const roleLabel = mode === 'business' ? 'Business' : mode === 'admin' ? 'Admin' : 'Customer'

  return (
    <div className={styles.profile} ref={ref}>
      <button
        className={styles.profileBtn}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={styles.avatar}>{initials(user.name)}</span>
        <span className={styles.profileMeta}>
          <span className={styles.profileName}>{user.name}</span>
          <span className={styles.profileRole}>{roleLabel}</span>
        </span>
        <Icon name="chevronDown" size={16} />
      </button>

      {open && (
        <div className={styles.menu} role="menu">
          <p className={styles.menuLabel}>Switch demo profile</p>
          {db.users.map((u) => (
            <button
              key={u.id}
              role="menuitem"
              className={
                u.id === user.id ? `${styles.menuItem} ${styles.menuItemActive}` : styles.menuItem
              }
              onClick={() => handlePick(u.id, u.role)}
            >
              <span className={styles.avatarSm}>{initials(u.name)}</span>
              <span className={styles.menuItemText}>
                <span>{u.name}</span>
                <span className={styles.menuRole}>{ROLE_TEXT[u.role]}</span>
              </span>
              {u.id === user.id && <Icon name="check" size={15} />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
