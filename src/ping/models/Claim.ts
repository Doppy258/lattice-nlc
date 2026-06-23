/** Lifecycle states a claim can be in. */
export type ClaimStatus = 'active' | 'redeemed' | 'expired' | 'cancelled'

export type Claim = {
  id: string
  userId: string
  offerId: string
  businessId: string
  /** Human-facing redemption code in the form PING-####. */
  claimCode: string
  status: ClaimStatus
  createdAt: string
  expiresAt: string
  redeemedAt?: string
}
