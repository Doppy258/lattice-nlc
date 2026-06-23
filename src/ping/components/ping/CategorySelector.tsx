import type { BusinessCategory } from '@/models'
import { CATEGORIES } from '@/data/pingConfig'
import { Icon } from '@/components/common/Icon'
import styles from '@/pages/create.module.css'

export function CategorySelector({
  value,
  onChange,
}: {
  value?: BusinessCategory
  onChange: (category: BusinessCategory) => void
}) {
  return (
    <div className={styles.catGrid}>
      {CATEGORIES.map((c) => {
        const active = value === c.category
        return (
          <button
            key={c.category}
            type="button"
            aria-pressed={active}
            className={active ? `${styles.catCard} ${styles.catCardActive}` : styles.catCard}
            onClick={() => onChange(c.category)}
          >
            <span className={styles.catIcon}>
              <Icon name={c.icon} size={22} />
            </span>
            <span className={styles.catLabel}>{c.label}</span>
            <span className={styles.catDesc}>{c.description}</span>
          </button>
        )
      })}
    </div>
  )
}
