import type { BusinessCategory } from './Business'
import type { ClaimStatus } from './Claim'

/** Filters shared by the customer and business report screens. */
export type ReportFilters = {
  dateFrom?: string
  dateTo?: string
  category?: BusinessCategory | 'all'
  claimStatus?: ClaimStatus | 'all'
}

/** Aggregated, customizable analytics for a customer. */
export type UserReport = {
  totalClaimed: number
  totalRedeemed: number
  estimatedSavings: number
  businessesSupported: number
  reviewsSubmitted: number
  averageRatingGiven: number
  favoriteCategory: BusinessCategory | null
  claimsByCategory: { category: BusinessCategory; count: number }[]
  savingsByMonth: { month: string; savings: number }[]
  ratingDistribution: { rating: number; count: number }[]
  topBusinessIds: string[]
}

/** Aggregated performance analytics for a business. */
export type BusinessReport = {
  offerViews: number
  claims: number
  redemptions: number
  conversionRate: number
  averageRating: number
  reviewCount: number
  repeatCustomers: number
  revenueInfluenced: number
  commonTags: { tag: string; count: number }[]
  claimsOverTime: { date: string; claims: number }[]
  redemptionsByOffer: { offerId: string; redemptions: number }[]
}
