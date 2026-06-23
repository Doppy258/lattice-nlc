import { describe, it, expect } from 'vitest'
import { buildSeedDatabase } from '@/data/seedDatabase'
import {
  validateReview,
  canUserReviewClaim,
  computeBusinessRating,
} from '@/services/reviewService'
import type { Review } from '@/models'

const db = buildSeedDatabase()

describe('validateReview', () => {
  it('requires a rating in 1–5', () => {
    expect(validateReview({ rating: 6, text: 'Great spot to study quietly' }).valid).toBe(false)
  })
  it('enforces a minimum text length', () => {
    expect(validateReview({ rating: 5, text: 'short' }).valid).toBe(false)
  })
  it('accepts a valid review', () => {
    expect(validateReview({ rating: 5, text: 'Great spot to study quietly' }).valid).toBe(true)
  })
})

describe('canUserReviewClaim (verification gate)', () => {
  it('allows a redeemed, owned, unreviewed claim', () => {
    // claim_bright is redeemed by Lucas and intentionally has no seed review.
    expect(canUserReviewClaim('u_lucas', 'claim_bright', db.claims, db.reviews).ok).toBe(true)
  })
  it('blocks a claim that is not yet redeemed', () => {
    expect(canUserReviewClaim('u_lucas', 'claim_freshbowl', db.claims, db.reviews).ok).toBe(false)
  })
  it('blocks reviewing someone else’s claim', () => {
    expect(canUserReviewClaim('u_maya', 'claim_bright', db.claims, db.reviews).ok).toBe(false)
  })
  it('blocks a duplicate review for the same claim', () => {
    expect(canUserReviewClaim('u_lucas', 'claim_bowlco', db.claims, db.reviews).ok).toBe(false)
  })
})

describe('computeBusinessRating', () => {
  it('averages ratings to one decimal', () => {
    const reviews = [{ rating: 4 }, { rating: 5 }] as Review[]
    expect(computeBusinessRating(reviews)).toEqual({ ratingAverage: 4.5, reviewCount: 2 })
  })
  it('handles no reviews', () => {
    expect(computeBusinessRating([])).toEqual({ ratingAverage: 0, reviewCount: 0 })
  })
})
