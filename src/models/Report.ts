import type { BusinessCategory } from "./Business";
import type { ClaimStatus } from "./Claim";

/** Filters that customize a user report (section 10.12 / 13.6). */
export type ReportFilters = {
  fromDate?: string;
  toDate?: string;
  category?: BusinessCategory;
  claimStatus?: ClaimStatus;
};

/** A single labelled value for charts (claims by category, savings by month). */
export type SeriesPoint = {
  label: string;
  value: number;
};

export type UserReport = {
  totalClaimed: number;
  totalRedeemed: number;
  estimatedSavings: number;
  businessesSupported: number;
  reviewsSubmitted: number;
  favoriteCategory: BusinessCategory | null;
  averageRatingGiven: number;
  claimsByCategory: SeriesPoint[];
  savingsByMonth: SeriesPoint[];
  businessesByMonth: SeriesPoint[];
  ratingDistribution: SeriesPoint[];
};

export type BusinessReport = {
  offerViews: number;
  claims: number;
  redemptions: number;
  /** Passes currently awaiting business approval. */
  pending: number;
  /** Passes that timed out before approval. */
  expired: number;
  /** redeemed claims / offer views. */
  conversionRate: number;
  /** redeemed passes / (redeemed + expired) — how many claimed passes get approved. */
  passApprovalRate: number;
  averageRating: number;
  reviewCount: number;
  repeatCustomers: number;
  revenueInfluenced: number;
  /** Title of the offer with the most approved redemptions, if any. */
  topOfferTitle: string | null;
  commonTags: SeriesPoint[];
  claimsByMonth: SeriesPoint[];
};
