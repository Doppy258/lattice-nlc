import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Business } from '@/models'
import { useSession } from '@/app/SessionContext'
import { useDatabase } from '@/app/useDatabase'
import { Modal } from '@/components/common/Modal'
import { Button } from '@/components/common/Button'
import { Icon } from '@/components/common/Icon'
import {
  commitInsertion,
  processComparison,
  startBinaryInsertion,
  type ComparisonAnswer,
  type InsertionSession,
} from '@/services/rankingService'
import styles from '@/pages/rankings.module.css'

/** Demo cap on comparison prompts (PRD §13.5). */
const MAX_COMPARISONS = 3

/**
 * Post-review pairwise ranking. Inserts the just-reviewed business into the
 * user's ranking for its category via binary insertion — one "better or worse?"
 * question at a time, then commits.
 */
export function PairwiseModal({
  open,
  onClose,
  business,
}: {
  open: boolean
  onClose: () => void
  business: Business
}) {
  const { user } = useSession()
  const db = useDatabase()
  const [session, setSession] = useState<InsertionSession | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!open) return
    // Reuse the existing ranking list for this category if there is one.
    const existing = db.rankings.find((r) => r.userId === user.id && r.category === business.category)
    const s = startBinaryInsertion(user.id, business.id, business.category, existing?.needType, db.rankings)
    setSession(s)
    setDone(false)
    if (s.done) {
      commitInsertion(s)
      setDone(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, business.id])

  const nameOf = (id: string) => db.businesses.find((b) => b.id === id)?.name ?? 'another spot'

  const answer = (a: ComparisonAnswer) => {
    if (!session) return
    let next = processComparison(session, a)
    // Keep the demo short: finalize after MAX_COMPARISONS prompts.
    if (!next.done && next.comparisons >= MAX_COMPARISONS) next = processComparison(next, 'skip')
    setSession(next)
    if (next.done) {
      commitInsertion(next)
      setDone(true)
    }
  }

  const comparing = session && !session.done && session.compareBusinessId

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow="Personal rankings"
      title={done ? 'Ranking updated' : 'Help us place this'}
      size="sm"
      footer={
        done ? (
          <>
            <Button variant="ghost" onClick={onClose}>
              Done
            </Button>
            <Link to="/rankings" className="btn btn--primary" onClick={onClose}>
              View rankings
            </Link>
          </>
        ) : (
          <Button variant="ghost" onClick={onClose}>
            Skip for now
          </Button>
        )
      }
    >
      {done ? (
        <div className={styles.done}>
          <div className={styles.doneIcon}>
            <Icon name="trophy" size={26} />
          </div>
          <p>
            <b>{business.name}</b> is now in your personal rankings.
          </p>
        </div>
      ) : comparing ? (
        <div>
          <p className={styles.pairIntro}>
            Was <b>{business.name}</b> better than <b>{nameOf(session!.compareBusinessId!)}</b>?
          </p>
          <div className={styles.pairBtns}>
            <button className={`${styles.pairBtn} ${styles.pairBetter}`} onClick={() => answer('better')}>
              <span className={styles.pairIcon}>
                <Icon name="check" size={20} />
              </span>
              Better
            </button>
            <button className={`${styles.pairBtn} ${styles.pairWorse}`} onClick={() => answer('worse')}>
              <span className={styles.pairIcon}>
                <Icon name="x" size={20} />
              </span>
              Worse
            </button>
          </div>
          <Button variant="secondary" block className={styles.same} onClick={() => answer('same')}>
            About the same
          </Button>
          <p className={styles.progress}>
            Comparison {Math.min(session!.comparisons + 1, MAX_COMPARISONS)} of up to {MAX_COMPARISONS}
          </p>
        </div>
      ) : null}
    </Modal>
  )
}
