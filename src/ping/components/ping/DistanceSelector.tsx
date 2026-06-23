import { DISTANCE_OPTIONS } from '@/data/pingConfig'
import styles from '@/pages/create.module.css'

export function DistanceSelector({
  value,
  onChange,
}: {
  value: number
  onChange: (km: number) => void
}) {
  return (
    <div className={styles.chips}>
      {DISTANCE_OPTIONS.map((d) => (
        <button
          key={d.km}
          type="button"
          className="chip"
          aria-pressed={value === d.km}
          onClick={() => onChange(d.km)}
        >
          {d.label}
        </button>
      ))}
    </div>
  )
}
