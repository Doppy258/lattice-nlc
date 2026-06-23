import { Icon } from './Icon'
import styles from './widgets.module.css'

/** Inline field error, linkable to an input via `id` + aria-describedby. */
export function FormError({ id, children }: { id?: string; children: React.ReactNode }) {
  if (!children) return null
  return (
    <p id={id} className={styles.formError} role="alert">
      <Icon name="x" size={14} />
      <span>{children}</span>
    </p>
  )
}
