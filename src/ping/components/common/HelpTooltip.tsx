import { Icon } from './Icon'
import styles from './widgets.module.css'

/** A small "?" affordance with an accessible hover/focus tooltip. */
export function HelpTooltip({ label, size = 15 }: { label: string; size?: number }) {
  return (
    <span className={styles.help} tabIndex={0} role="note" aria-label={label}>
      <Icon name="help" size={size} />
      <span className={styles.helpBubble} aria-hidden="true">
        {label}
      </span>
    </span>
  )
}
