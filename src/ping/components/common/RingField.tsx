import styles from './radar.module.css'

/**
 * Decorative radar field for hero / panel backgrounds. Concentric distance
 * rings + a slow sweep + a few "blips" echoing the matching metaphor. Purely
 * atmospheric (aria-hidden, no pointer events).
 */
export function RingField() {
  return (
    <svg
      className={styles.field}
      viewBox="0 0 600 600"
      fill="none"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="field-sweep" x1="300" y1="300" x2="300" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--signal)" stopOpacity="0" />
          <stop offset="1" stopColor="var(--signal)" stopOpacity="0.16" />
        </linearGradient>
      </defs>

      {[70, 140, 210, 280, 350].map((r, i) => (
        <circle
          key={r}
          cx="300"
          cy="300"
          r={r}
          stroke="var(--on-ink-line-2)"
          strokeWidth="1.2"
          opacity={0.9 - i * 0.13}
        />
      ))}

      <line x1="300" y1="0" x2="300" y2="600" stroke="var(--on-ink-line)" strokeWidth="1" />
      <line x1="0" y1="300" x2="600" y2="300" stroke="var(--on-ink-line)" strokeWidth="1" />

      <g className={styles.fieldSweep}>
        <path d="M300 300 L300 20 A280 280 0 0 1 480 90 Z" fill="url(#field-sweep)" />
        <line x1="300" y1="300" x2="300" y2="20" stroke="var(--signal)" strokeWidth="1.4" opacity="0.5" />
      </g>

      {/* Match "blips" sitting on the rings */}
      <circle className={styles.blip} cx="402" cy="232" r="5" fill="var(--signal)" />
      <circle className={styles.blip2} cx="214" cy="392" r="4" fill="var(--signal)" />
      <circle className={styles.blip3} cx="368" cy="430" r="3.5" fill="var(--signal)" />
    </svg>
  )
}
