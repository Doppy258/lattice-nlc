import { Card } from './Card'
import { Icon } from './Icon'
import { RadarMark } from './RadarMark'
import styles from './placeholder.module.css'

type PlaceholderProps = {
  /** Build-order phase this screen is delivered in (PRD §23). */
  phase: string
  blurb: string
  /** The screen's planned contents, lifted from the PRD spec. */
  features: string[]
  /** What already works behind this screen today (data, services, types). */
  ready?: string
}

/**
 * A deliberate "scaffolded, not broken" screen. Phase 1 wires every route and
 * the full data layer, so each not-yet-built page documents exactly what's
 * coming and confirms the supporting data already exists.
 */
export function Placeholder({ phase, blurb, features, ready }: PlaceholderProps) {
  return (
    <Card pad="lg" className={styles.panel}>
      <div className={styles.mark}>
        <RadarMark size={150} sweep={false} />
      </div>

      <span className={styles.phaseTag}>
        <Icon name="sparkle" size={13} />
        {phase}
      </span>

      <p className={styles.blurb}>{blurb}</p>

      <p className={styles.heading}>Planned for this screen</p>
      <ul className={styles.featureGrid}>
        {features.map((f) => (
          <li key={f} className={styles.feature}>
            <span className={styles.dot} aria-hidden="true" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <div className={styles.foot}>
        <Icon name="check" size={16} />
        <span>
          {ready ?? 'Typed models, seed data, and persistence for this screen are already in place.'}
        </span>
      </div>
    </Card>
  )
}
