import styles from './offers.module.css'

/** Radial gauge for an OfferRank score (0–100), colour-tiered by strength. */
export function MatchScoreBadge({ score, size = 50 }: { score: number; size?: number }) {
  const stroke = 4
  const r = (size - stroke) / 2
  const circumference = 2 * Math.PI * r
  const dash = (Math.max(0, Math.min(100, score)) / 100) * circumference

  const color =
    score >= 85
      ? 'var(--signal)'
      : score >= 70
        ? 'var(--signal-strong)'
        : score >= 50
          ? 'var(--amber)'
          : 'var(--ink-3)'

  return (
    <div className={styles.score}>
      <div className={styles.scoreRing} style={{ width: size, height: size }}>
        <svg width={size} height={size} aria-hidden="true">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--paper-sunken)" strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
        <span className={styles.scoreNum}>{score}</span>
      </div>
      <span className={styles.scoreLabel}>match</span>
    </div>
  )
}
