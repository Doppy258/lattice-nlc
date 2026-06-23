import { Icon } from './Icon'
import styles from './widgets.module.css'

type StarRatingProps = {
  value: number
  max?: number
  size?: number
  /** When set, stars become buttons that call back with the chosen rating. */
  onChange?: (rating: number) => void
}

/** Read-only star display, or an interactive 1–5 picker when `onChange` is given. */
export function StarRating({ value, max = 5, size = 16, onChange }: StarRatingProps) {
  if (onChange) {
    return (
      <div className={`${styles.stars} ${styles.starsInteractive}`} role="radiogroup" aria-label="Rating">
        {Array.from({ length: max }, (_, i) => {
          const rating = i + 1
          const on = rating <= value
          return (
            <button
              key={rating}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={`${rating} star${rating > 1 ? 's' : ''}`}
              className={on ? styles.starOn : styles.starOff}
              onClick={() => onChange(rating)}
            >
              <Icon name="star" size={size + 6} />
            </button>
          )
        })}
      </div>
    )
  }

  const rounded = Math.round(value)
  return (
    <span className={styles.stars} aria-label={`${value} out of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < rounded ? styles.starOn : styles.starOff}>
          <Icon name="star" size={size} />
        </span>
      ))}
    </span>
  )
}
