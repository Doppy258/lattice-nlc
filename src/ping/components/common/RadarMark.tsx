import styles from './radar.module.css'

/**
 * The Ping logo mark: concentric distance rings with a rotating radar sweep
 * and a bright centre blip. `currentColor` drives the rings, so it adapts to
 * light or dark surfaces; the sweep + centre use the signal accent.
 */
export function RadarMark({ size = 30, sweep = true }: { size?: number; sweep?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className={styles.mark}
    >
      <defs>
        <linearGradient id="ping-sweep" x1="24" y1="24" x2="24" y2="3" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--signal)" stopOpacity="0" />
          <stop offset="1" stopColor="var(--signal)" stopOpacity="0.55" />
        </linearGradient>
      </defs>

      <circle cx="24" cy="24" r="21" stroke="currentColor" strokeWidth="1.6" opacity="0.22" />
      <circle cx="24" cy="24" r="14" stroke="currentColor" strokeWidth="1.6" opacity="0.4" />
      <circle cx="24" cy="24" r="7.5" stroke="currentColor" strokeWidth="1.6" opacity="0.6" />

      {sweep && (
        <g className={styles.sweep}>
          <path d="M24 24 L24 3 A21 21 0 0 1 37.5 7.9 Z" fill="url(#ping-sweep)" />
          <line x1="24" y1="24" x2="24" y2="3" stroke="var(--signal)" strokeWidth="1.8" strokeLinecap="round" />
        </g>
      )}

      <circle cx="24" cy="24" r="3" fill="var(--signal)" />
    </svg>
  )
}
