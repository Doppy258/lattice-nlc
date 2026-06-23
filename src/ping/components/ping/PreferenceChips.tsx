import type { BusinessCategory } from '@/models'
import { preferencesForCategory } from '@/data/pingConfig'
import styles from '@/pages/create.module.css'

export function PreferenceChips({
  category,
  value,
  onToggle,
}: {
  category: BusinessCategory
  value: string[]
  onToggle: (key: string) => void
}) {
  return (
    <div className={styles.chips}>
      {preferencesForCategory(category).map((p) => (
        <button
          key={p.key}
          type="button"
          className="chip"
          aria-pressed={value.includes(p.key)}
          onClick={() => onToggle(p.key)}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}
