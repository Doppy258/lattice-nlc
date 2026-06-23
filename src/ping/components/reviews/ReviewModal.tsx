import { useEffect, useState } from 'react'
import type { Business, Claim, Offer } from '@/models'
import { Modal } from '@/components/common/Modal'
import { Button } from '@/components/common/Button'
import { StarRating } from '@/components/common/StarRating'
import { FormError } from '@/components/common/FormError'
import { Icon } from '@/components/common/Icon'
import { createReview, validateReview, REVIEW_TEXT_MAX } from '@/services/reviewService'
import styles from './reviews.module.css'

const REVIEW_TAGS = [
  'Good value',
  'Friendly staff',
  'Fast service',
  'Student-friendly',
  'Clean',
  'Good quality',
  'Quiet',
  'Group-friendly',
]

/**
 * Verified review form. Only reachable from a redeemed claim, so submission
 * goes straight through reviewService (which re-checks the verification gate).
 * Pairwise ranking is triggered from here in Phase 5.
 */
export function ReviewModal({
  open,
  onClose,
  claim,
  offer,
  business,
  onSubmitted,
}: {
  open: boolean
  onClose: () => void
  claim: Claim
  offer: Offer
  business: Business
  onSubmitted?: () => void
}) {
  const [rating, setRating] = useState(0)
  const [text, setText] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [recommend, setRecommend] = useState<boolean | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) {
      setRating(0)
      setText('')
      setTags([])
      setRecommend(null)
      setErrors({})
    }
  }, [open])

  const toggleTag = (t: string) =>
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))

  const submit = () => {
    const v = validateReview({ rating, text })
    if (!v.valid) {
      setErrors(Object.fromEntries(v.errors.map((e) => [e.field, e.message])))
      return
    }
    const res = createReview({
      userId: claim.userId,
      businessId: business.id,
      offerId: offer.id,
      claimId: claim.id,
      rating,
      text,
      tags,
      wouldRecommend: recommend ?? undefined,
    })
    if (res.ok) {
      onSubmitted?.()
      onClose()
    } else {
      setErrors(Object.fromEntries(res.errors.map((e) => [e.field, e.message])))
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow={business.name}
      title="Leave a verified review"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} iconLeft={<Icon name="check" size={16} />}>
            Submit review
          </Button>
        </>
      }
    >
      <div className={styles.group}>
        <span className={styles.label}>Your rating</span>
        <StarRating value={rating} onChange={setRating} size={20} />
        <FormError>{errors.rating}</FormError>
      </div>

      <div className={styles.group}>
        <label className={styles.label} htmlFor="review-text">
          Your review
        </label>
        <textarea
          id="review-text"
          className={styles.textarea}
          maxLength={REVIEW_TEXT_MAX}
          placeholder="What stood out? Was it good value, fast, student-friendly?"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className={styles.counter}>
          {text.length}/{REVIEW_TEXT_MAX}
        </div>
        <FormError>{errors.text}</FormError>
        {errors.claim && <FormError>{errors.claim}</FormError>}
      </div>

      <div className={styles.group}>
        <span className={styles.label}>Tags (optional)</span>
        <div className={styles.tags}>
          {REVIEW_TAGS.map((t) => (
            <button
              key={t}
              type="button"
              className="chip"
              aria-pressed={tags.includes(t)}
              onClick={() => toggleTag(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.group}>
        <span className={styles.label}>Would you recommend it?</span>
        <div className={styles.recommend}>
          <button type="button" className="chip" aria-pressed={recommend === true} onClick={() => setRecommend(true)}>
            Yes, recommend
          </button>
          <button type="button" className="chip" aria-pressed={recommend === false} onClick={() => setRecommend(false)}>
            Not really
          </button>
        </div>
      </div>

      <p className={styles.note}>
        <Icon name="shield" size={13} /> Verified because you redeemed this offer.
      </p>
    </Modal>
  )
}
