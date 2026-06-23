import { useSession } from '@/app/SessionContext'
import { useDatabase } from '@/app/useDatabase'
import { toggleSavedBusiness, toggleSavedOffer } from '@/services/userService'
import { Icon } from './Icon'
import styles from './widgets.module.css'

type SaveButtonProps = {
  kind: 'business' | 'offer'
  id: string
  /** Show a text label beside the icon. */
  withLabel?: boolean
}

/** Bookmark toggle wired to userService; reflects live saved state. */
export function SaveButton({ kind, id, withLabel = false }: SaveButtonProps) {
  const { user } = useSession()
  const db = useDatabase()

  const saved =
    kind === 'business'
      ? db.savedBusinesses.some((s) => s.userId === user.id && s.businessId === id)
      : db.savedOffers.some((s) => s.userId === user.id && s.offerId === id)

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (kind === 'business') toggleSavedBusiness(user.id, id)
    else toggleSavedOffer(user.id, id)
  }

  return (
    <button
      type="button"
      className={`${styles.save} ${saved ? styles.saveActive : ''} ${withLabel ? styles.saveWide : ''}`}
      aria-pressed={saved}
      aria-label={saved ? 'Remove from saved' : 'Save'}
      onClick={toggle}
      title={saved ? 'Saved' : 'Save'}
    >
      <Icon name="bookmark" size={17} />
      {withLabel && <span>{saved ? 'Saved' : 'Save'}</span>}
    </button>
  )
}
