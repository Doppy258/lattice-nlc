import type { BusinessCategory, NeedType } from '@/models'
import { categoryMeta } from '@/data/pingConfig'
import { needTypeLabel } from '@/utils/formatting'
import styles from '@/pages/create.module.css'

export function NeedTypeSelector({
  category,
  value,
  onChange,
}: {
  category: BusinessCategory
  value?: NeedType
  onChange: (need: NeedType) => void
}) {
  return (
    <div className={styles.chips}>
      {categoryMeta(category).needTypes.map((need) => (
        <button
          key={need}
          type="button"
          className="chip"
          aria-pressed={value === need}
          onClick={() => onChange(need)}
        >
          {needTypeLabel(need)}
        </button>
      ))}
    </div>
  )
}
