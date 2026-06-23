import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Icon, type IconName } from '@/components/common/Icon'
import { SCORE_WEIGHTS } from '@/services/offerMatchingService'
import { loadPreferences, setReducedMotion } from '@/services/preferencesService'
import styles from './help.module.css'

const STEPS: { icon: IconName; title: string; text: string }[] = [
  { icon: 'ping', title: 'Create a Ping', text: 'Describe what you need with a few structured choices — category, budget, distance, and timing.' },
  { icon: 'target', title: 'Get matched', text: 'OfferRank scores nearby offers and explains why each one fits your request.' },
  { icon: 'ticket', title: 'Claim it', text: 'Claim an offer to get a PING-#### code, saved to your Claims for later.' },
  { icon: 'scan', title: 'Redeem & review', text: 'The business redeems your code in store, which unlocks a verified review.' },
  { icon: 'trophy', title: 'Build rankings', text: 'A couple of quick comparisons place each spot in your personal rankings.' },
]

const WEIGHT_LABELS: Record<keyof typeof SCORE_WEIGHTS, string> = {
  category: 'Category',
  budget: 'Budget',
  distance: 'Distance',
  rating: 'Rating',
  time: 'Timing',
  verification: 'Verification',
  preference: 'Preferences',
}

const ACCESSIBILITY = [
  'Keyboard-navigable controls with visible focus rings',
  'Text labels alongside icons, never icons alone',
  'Form errors linked to their fields',
  'Considered colour contrast on a warm, low-glare palette',
  'A reduced-motion option (above) plus OS-setting support',
]

const FAQ: { q: string; a: string }[] = [
  {
    q: 'How is this different from a maps app?',
    a: 'Maps apps are built around searching for places. Ping is built around structured demand — you describe a specific need and the app ranks claimable offers by fit: budget, distance, timing, ratings, verification, and preferences.',
  },
  {
    q: 'What is the intelligent feature?',
    a: 'OfferRank. It scores each offer 0–100 from seven weighted factors and generates plain-language reasons, so a “91% match” always comes with the why behind it.',
  },
  {
    q: 'How do you prevent absurd requests?',
    a: 'Structured inputs plus semantic validation. Each need type has a realistic minimum budget, time windows must make sense, distance is bounded, and duplicate requests are blocked within a cooldown.',
  },
  {
    q: 'How do you prevent bot activity?',
    a: 'A quick verification step before matching, generated claim codes, redemption-gated reviews, and blocks on duplicate or excessive claims.',
  },
  {
    q: 'Why binary insertion for rankings?',
    a: 'Placing a business into a list of n with binary insertion takes about log₂(n) comparisons instead of n — so you answer far fewer “better or worse?” questions.',
  },
  {
    q: 'Where is my data stored?',
    a: 'Entirely in your browser (localStorage). Ping runs fully offline with seeded demo data — no servers, accounts, or external APIs. Reset anytime from Demo Controls.',
  },
]

export function HelpPage() {
  const [reduced, setReduced] = useState(loadPreferences().reducedMotion)

  const toggleMotion = () => {
    const next = !reduced
    setReduced(next)
    setReducedMotion(next)
  }

  return (
    <div>
      <PageHeader eyebrow="Help" title="How Ping works" />
      <p className={styles.intro}>
        Ping turns a specific local need into a short, ranked list of nearby offers you can claim —
        then verifies redemptions and turns them into trusted reviews and personal rankings.
      </p>

      <section className={styles.section}>
        <h2 className="section-title">The five steps</h2>
        <div className={styles.steps}>
          {STEPS.map((s, i) => (
            <div key={s.title} className={styles.step}>
              <div className={styles.stepNum}>{i + 1}</div>
              <div className={styles.stepTitle}>
                <Icon name={s.icon} size={18} /> {s.title}
              </div>
              <p className={styles.stepText}>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className="section-title">The intelligent bits</h2>
        <div className={styles.featureGrid}>
          <div className={styles.feature}>
            <div className={styles.featureTitle}>
              <Icon name="target" size={18} /> OfferRank scoring
            </div>
            <p className={styles.featureText}>
              Every offer gets a 0–100 score from seven weighted factors. Higher weight means more
              influence on the final match.
            </p>
            <div className={styles.weights}>
              {(Object.keys(SCORE_WEIGHTS) as (keyof typeof SCORE_WEIGHTS)[]).map((k) => (
                <div key={k} className={styles.weightRow}>
                  <span className={styles.weightLabel}>{WEIGHT_LABELS[k]}</span>
                  <span className={styles.weightTrack}>
                    <span className={styles.weightFill} style={{ width: `${(SCORE_WEIGHTS[k] / 0.25) * 100}%` }} />
                  </span>
                  <span className={styles.weightVal}>{Math.round(SCORE_WEIGHTS[k] * 100)}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.feature}>
            <div className={styles.featureTitle}>
              <Icon name="trophy" size={18} /> Binary-insertion ranking
            </div>
            <p className={styles.featureText}>
              After a review, Ping asks a few head-to-head questions and slots the business into your
              list with binary search — about log₂(n) comparisons instead of n. With 64 ranked spots
              that’s roughly 6 questions, not 64.
            </p>
            <p className={styles.featureText}>
              Your rankings are personal, ordered lists — distinct from raw star ratings — so the
              places you actually prefer rise to the top.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className="section-title">Accessibility</h2>
        <div className={styles.accCard}>
          <div className={styles.toggleRow}>
            <div>
              <div style={{ fontWeight: 600 }}>Reduce motion</div>
              <div className="muted" style={{ fontSize: 'var(--fs-sm)' }}>
                Turn off the radar sweep, pulses, and transitions.
              </div>
            </div>
            <button
              className={styles.switch}
              data-on={reduced}
              role="switch"
              aria-checked={reduced}
              aria-label="Reduce motion"
              onClick={toggleMotion}
            >
              <span className={styles.switchKnob} />
            </button>
          </div>
          <div className={styles.accList}>
            {ACCESSIBILITY.map((a) => (
              <div key={a} className={styles.accItem}>
                <Icon name="check" size={15} /> {a}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className="section-title">Questions & answers</h2>
        <div className={styles.faq}>
          {FAQ.map((item) => (
            <details key={item.q} className={styles.faqItem}>
              <summary>
                {item.q}
                <Icon name="chevronRight" size={16} className={styles.chev} />
              </summary>
              <p className={styles.faqAnswer}>{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  )
}
