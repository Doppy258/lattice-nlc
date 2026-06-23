/** A user's bookmark of a business. `tags` lets users annotate saves. */
export type SavedBusiness = {
  userId: string
  businessId: string
  savedAt: string
  tags: string[]
}

/** A user's bookmark of a specific offer. */
export type SavedOffer = {
  userId: string
  offerId: string
  savedAt: string
}
