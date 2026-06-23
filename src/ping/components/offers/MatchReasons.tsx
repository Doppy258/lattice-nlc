import { Icon } from '@/components/common/Icon'
import styles from './offers.module.css'

/** "Why this matched" — the explainable side of OfferRank. */
export function MatchReasons({ reasons }: { reasons: string[] }) {
  if (reasons.length === 0) return null
  return (
    <div className={styles.reasons}>
      <span className={styles.reasonsLabel}>Why this matched</span>
      {reasons.map((r) => (
        <span key={r} className={styles.reason}>
          <Icon name="check" size={14} />
          {r}
        </span>
      ))}
    </div>
  )
}
