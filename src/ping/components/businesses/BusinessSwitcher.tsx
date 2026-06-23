import { useBusinessContext } from '@/app/useBusinessContext'
import styles from '@/pages/business.module.css'

/** Lets an owner switch which of their businesses they're managing. */
export function BusinessSwitcher() {
  const { owned, current, setBusinessId } = useBusinessContext()
  if (owned.length <= 1) return null
  return (
    <select
      className={styles.switcher}
      value={current?.id}
      onChange={(e) => setBusinessId(e.target.value)}
      aria-label="Switch business"
    >
      {owned.map((b) => (
        <option key={b.id} value={b.id}>
          {b.name}
        </option>
      ))}
    </select>
  )
}
