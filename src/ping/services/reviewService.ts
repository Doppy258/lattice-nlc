import type { Claim, Review } from '@/models'
import { getCollection, updateCollection } from './storageService'
import { makeId } from '@/utils/ids'
import { nowIso } from '@/utils/dateTime'
import type { FieldError, ValidationResult } from './requestValidationService'
import type { RuleCheck } from './claimService'

/**
 * reviewService — verified reviews only.
 *
 * A review is "verified" because it can only be created against a redeemed
 * claim that belongs to the reviewer, with no prior review for that claim
 * (PRD §13.4). Ratings update the business's aggregate incrementally so the
 * curated seed counts stay intact.
 */

export const REVIEW_TEXT_MIN = 10
export const REVIEW_TEXT_MAX = 300
export const RATING_MIN = 1
export const RATING_MAX = 5

export type ReviewInput = {
  userId: string
  businessId: string
  offerId: string
  claimId: string
  rating: number
  text: string
  tags: string[]
  wouldRecommend?: boolean
}

export type ReviewResult = { ok: true; review: Review } | { ok: false; errors: FieldError[] }

/* ── Pure rules ───────────────────────────────────────────────────────── */

export function validateReview(input: Pick<ReviewInput, 'rating' | 'text'>): ValidationResult {
  const errors: FieldError[] = []

  if (input.rating === undefined || Number.isNaN(input.rating)) {
    errors.push({ field: 'rating', message: 'Select a rating.' })
  } else if (input.rating < RATING_MIN || input.rating > RATING_MAX) {
    errors.push({ field: 'rating', message: `Rating must be ${RATING_MIN}–${RATING_MAX}.` })
  }

  const text = input.text?.trim() ?? ''
  if (text.length < REVIEW_TEXT_MIN) {
    errors.push({ field: 'text', message: `Write at least ${REVIEW_TEXT_MIN} characters.` })
  } else if (text.length > REVIEW_TEXT_MAX) {
    errors.push({ field: 'text', message: `Keep your review under ${REVIEW_TEXT_MAX} characters.` })
  }

  return { valid: errors.length === 0, errors }
}

/** The verification gate: redeemed, owned, and not already reviewed. */
export function canUserReviewClaim(
  userId: string,
  claimId: string,
  claims: Claim[],
  reviews: Review[],
): RuleCheck {
  const claim = claims.find((c) => c.id === claimId)
  if (!claim) return { ok: false, error: 'That claim could not be found.' }
  if (claim.userId !== userId) return { ok: false, error: 'This claim isn’t yours.' }
  if (claim.status !== 'redeemed') {
    return { ok: false, error: 'Reviews unlock after the offer is redeemed.' }
  }
  if (reviews.some((r) => r.claimId === claimId)) {
    return { ok: false, error: 'You’ve already reviewed this claim.' }
  }
  return { ok: true }
}

/** Aggregate rating from a set of reviews (pure). */
export function computeBusinessRating(reviews: Review[]): { ratingAverage: number; reviewCount: number } {
  if (reviews.length === 0) return { ratingAverage: 0, reviewCount: 0 }
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0)
  return {
    ratingAverage: Math.round((sum / reviews.length) * 10) / 10,
    reviewCount: reviews.length,
  }
}

/* ── Storage-bound orchestrators ──────────────────────────────────────── */

/** Reviews for a business, verified first then newest first. */
export function getBusinessReviews(businessId: string): Review[] {
  return getCollection('reviews')
    .filter((r) => r.businessId === businessId)
    .sort((a, b) => {
      if (a.verified !== b.verified) return a.verified ? -1 : 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
}

/** Recompute a business's rating from its review records (PRD §16). */
export function updateBusinessRating(businessId: string): void {
  const reviews = getCollection('reviews').filter((r) => r.businessId === businessId)
  const { ratingAverage, reviewCount } = computeBusinessRating(reviews)
  updateCollection(
    'businesses',
    getCollection('businesses').map((b) =>
      b.id === businessId ? { ...b, ratingAverage, reviewCount } : b,
    ),
  )
}

/** Round to one decimal place. */
const round1 = (n: number): number => Math.round(n * 10) / 10

/**
 * Create a verified review. The business aggregate is updated *incrementally*
 * (old average + new rating) so the curated seed review counts are preserved
 * rather than collapsed to the handful of seeded review records.
 */
export function createReview(input: ReviewInput): ReviewResult {
  const validation = validateReview(input)
  if (!validation.valid) return { ok: false, errors: validation.errors }

  const claims = getCollection('claims')
  const reviews = getCollection('reviews')
  const rule = canUserReviewClaim(input.userId, input.claimId, claims, reviews)
  if (!rule.ok) return { ok: false, errors: [{ field: 'claim', message: rule.error }] }

  const review: Review = {
    id: makeId('r'),
    userId: input.userId,
    businessId: input.businessId,
    offerId: input.offerId,
    claimId: input.claimId,
    rating: input.rating,
    text: input.text.trim(),
    tags: input.tags,
    verified: true,
    createdAt: nowIso(),
  }
  updateCollection('reviews', [...reviews, review])

  updateCollection(
    'businesses',
    getCollection('businesses').map((b) => {
      if (b.id !== input.businessId) return b
      const count = b.reviewCount + 1
      const average = round1((b.ratingAverage * b.reviewCount + input.rating) / count)
      return { ...b, ratingAverage: average, reviewCount: count }
    }),
  )

  return { ok: true, review }
}
