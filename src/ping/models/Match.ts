/**
 * Per-component breakdown of an OfferRank score. Each subscore is 0–100; the
 * final weighted score (also 0–100) is what users see as the "match %".
 * Kept as an explicit object so the UI can explain *why* an offer ranked well.
 */
export type ScoreBreakdown = {
  categoryScore: number
  budgetScore: number
  distanceScore: number
  ratingScore: number
  timeScore: number
  verificationScore: number
  preferenceScore: number
}

export type MatchResult = {
  offerId: string
  businessId: string
  requestId: string
  /** Final weighted OfferRank score, 0–100. */
  score: number
  scoreBreakdown: ScoreBreakdown
  /** Human-readable reasons generated from the breakdown. */
  reasons: string[]
}
