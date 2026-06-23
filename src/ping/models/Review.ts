export type Review = {
  id: string
  userId: string
  businessId: string
  offerId: string
  /** The redeemed claim this review is tied to — the basis of "verified". */
  claimId: string
  /** 1–5 stars. */
  rating: number
  text: string
  tags: string[]
  /** True only when backed by a redeemed claim (see reviewService). */
  verified: boolean
  createdAt: string
}
