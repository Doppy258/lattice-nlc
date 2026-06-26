import type {
  Business,
  BusinessCategory,
  Claim,
  Offer,
  Review,
  ReportFilters,
  SeriesPoint,
  UserReport,
  BusinessReport,
} from "../models";
import { CATEGORY_META } from "../data/catalog";
import { offerSavingsPerRedemption } from "../utils/offerPricing";

export type ReportData = {
  claims: Claim[];
  offers: Offer[];
  businesses: Business[];
  reviews: Review[];
};

function monthLabel(iso: string): string {
  return new Date(iso).toLocaleString("en-US", { month: "short", year: "2-digit" });
}

/** Date-range presets that customize how far back a report looks. */
export const RANGE_PRESETS = [
  { value: "all", label: "All time", days: null },
  { value: "30d", label: "Last 30 days", days: 30 },
  { value: "90d", label: "Last 90 days", days: 90 },
  { value: "12mo", label: "Last 12 months", days: 365 },
] as const;

export type RangePreset = (typeof RANGE_PRESETS)[number]["value"];

/** Converts a range preset to a `fromDate` ISO string (undefined for "all time"). */
export function rangeToFromDate(preset: RangePreset, now = new Date()): string | undefined {
  const found = RANGE_PRESETS.find((r) => r.value === preset);
  if (!found || found.days == null) return undefined;
  const from = new Date(now);
  from.setDate(from.getDate() - found.days);
  return from.toISOString();
}

/** Estimated savings summed over redeemed claims (percent offers contribute 0). */
export function calculateEstimatedSavings(claims: Claim[], offers: Offer[]): number {
  const byId = new Map(offers.map((o) => [o.id, o]));
  return claims
    .filter((c) => c.status === "redeemed")
    .reduce((sum, c) => {
      const offer = byId.get(c.offerId);
      return offer ? sum + offerSavingsPerRedemption(offer) : sum;
    }, 0);
}

/** Conversion rate = redeemed claims / offer views (0 when no views). */
export function calculateConversionRate(views: number, redemptions: number): number {
  return views === 0 ? 0 : redemptions / views;
}

export function groupClaimsByCategory(
  claims: Claim[],
  businesses: Business[]
): SeriesPoint[] {
  const catById = new Map(businesses.map((b) => [b.id, b.category]));
  const counts = new Map<BusinessCategory, number>();
  for (const c of claims) {
    const cat = catById.get(c.businessId);
    if (cat) counts.set(cat, (counts.get(cat) ?? 0) + 1);
  }
  return [...counts.entries()].map(([cat, value]) => ({
    label: CATEGORY_META[cat].label,
    value,
  }));
}

export function groupSavingsByMonth(claims: Claim[], offers: Offer[]): SeriesPoint[] {
  const byId = new Map(offers.map((o) => [o.id, o]));
  const months = new Map<string, number>();
  for (const c of claims) {
    if (c.status !== "redeemed") continue;
    const offer = byId.get(c.offerId);
    const saving = offer ? offerSavingsPerRedemption(offer) : 0;
    const label = monthLabel(c.redeemedAt ?? c.createdAt);
    months.set(label, (months.get(label) ?? 0) + saving);
  }
  return [...months.entries()].map(([label, value]) => ({ label, value }));
}

function withinFilters(
  claim: Claim,
  business: Business | undefined,
  filters: ReportFilters
): boolean {
  if (filters.fromDate && Date.parse(claim.createdAt) < Date.parse(filters.fromDate)) return false;
  if (filters.toDate && Date.parse(claim.createdAt) > Date.parse(filters.toDate)) return false;
  if (filters.category && business?.category !== filters.category) return false;
  if (filters.claimStatus && claim.status !== filters.claimStatus) return false;
  return true;
}

/** Customizable user report (sections 10.12 / 13.6). */
export function getUserReport(
  userId: string,
  filters: ReportFilters,
  data: ReportData
): UserReport {
  const bizById = new Map(data.businesses.map((b) => [b.id, b]));
  const claims = data.claims.filter(
    (c) => c.userId === userId && withinFilters(c, bizById.get(c.businessId), filters)
  );
  const redeemed = claims.filter((c) => c.status === "redeemed");
  const myReviews = data.reviews.filter((r) => r.userId === userId);

  const claimsByCategory = groupClaimsByCategory(claims, data.businesses);
  const favoriteCategory =
    claimsByCategory.length > 0
      ? (Object.keys(CATEGORY_META) as BusinessCategory[]).find(
          (cat) => CATEGORY_META[cat].label === [...claimsByCategory].sort((a, b) => b.value - a.value)[0].label
        ) ?? null
      : null;

  const ratingCounts = [1, 2, 3, 4, 5].map((star) => ({
    label: `${star}★`,
    value: myReviews.filter((r) => r.rating === star).length,
  }));

  const businessesByMonth = monthSeries(
    redeemed.map((c) => ({ key: c.businessId, when: c.redeemedAt ?? c.createdAt })),
    true
  );

  const avgRating =
    myReviews.length > 0
      ? Math.round((myReviews.reduce((s, r) => s + r.rating, 0) / myReviews.length) * 10) / 10
      : 0;

  return {
    totalClaimed: claims.length,
    totalRedeemed: redeemed.length,
    estimatedSavings: calculateEstimatedSavings(claims, data.offers),
    businessesSupported: new Set(redeemed.map((c) => c.businessId)).size,
    reviewsSubmitted: myReviews.length,
    favoriteCategory,
    averageRatingGiven: avgRating,
    claimsByCategory,
    savingsByMonth: groupSavingsByMonth(claims, data.offers),
    businessesByMonth,
    ratingDistribution: ratingCounts,
  };
}

/** Counts items per month; when `distinct`, counts unique keys per month. */
function monthSeries(items: { key: string; when: string }[], distinct = false): SeriesPoint[] {
  const months = new Map<string, Set<string> | number>();
  for (const it of items) {
    const label = monthLabel(it.when);
    if (distinct) {
      const set = (months.get(label) as Set<string>) ?? new Set<string>();
      set.add(it.key);
      months.set(label, set);
    } else {
      months.set(label, ((months.get(label) as number) ?? 0) + 1);
    }
  }
  return [...months.entries()].map(([label, value]) => ({
    label,
    value: distinct ? (value as Set<string>).size : (value as number),
  }));
}

/** Business analytics report (sections 11.6 / 13.6). */
export function getBusinessReport(
  businessId: string,
  filters: ReportFilters,
  data: ReportData
): BusinessReport {
  const offers = data.offers.filter((o) => o.businessId === businessId);
  const bizClaims = data.claims.filter(
    (c) => c.businessId === businessId && withinFilters(c, undefined, filters)
  );
  const redeemed = bizClaims.filter((c) => c.status === "redeemed");
  const pending = bizClaims.filter((c) => c.status === "pending");
  const expired = bizClaims.filter((c) => c.status === "expired" || c.status === "cancelled");
  const reviews = data.reviews.filter((r) => r.businessId === businessId);
  const offerById = new Map(offers.map((o) => [o.id, o]));

  // Most-redeemed offer (by approved redemptions).
  const redeemedByOffer = new Map<string, number>();
  for (const c of redeemed) redeemedByOffer.set(c.offerId, (redeemedByOffer.get(c.offerId) ?? 0) + 1);
  let topOfferTitle: string | null = null;
  let topCount = 0;
  for (const [offerId, count] of redeemedByOffer) {
    if (count > topCount) {
      topCount = count;
      topOfferTitle = offerById.get(offerId)?.title ?? null;
    }
  }

  const decided = redeemed.length + expired.length;
  const passApprovalRate = decided === 0 ? 0 : redeemed.length / decided;

  const offerViews = offers.reduce((s, o) => s + o.views, 0);
  const revenueInfluenced = redeemed.reduce(
    (s, c) => s + (offerById.get(c.offerId)?.price ?? 0),
    0
  );
  const userCounts = new Map<string, number>();
  for (const c of redeemed) userCounts.set(c.userId, (userCounts.get(c.userId) ?? 0) + 1);
  const repeatCustomers = [...userCounts.values()].filter((n) => n > 1).length;

  const tagCounts = new Map<string, number>();
  for (const r of reviews) for (const t of r.tags) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
  const commonTags = [...tagCounts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const avgRating =
    reviews.length > 0
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
      : 0;

  return {
    offerViews,
    claims: bizClaims.length,
    redemptions: redeemed.length,
    pending: pending.length,
    expired: expired.length,
    conversionRate: calculateConversionRate(offerViews, redeemed.length),
    passApprovalRate,
    averageRating: avgRating,
    reviewCount: reviews.length,
    repeatCustomers,
    revenueInfluenced,
    topOfferTitle,
    commonTags,
    claimsByMonth: monthSeries(bizClaims.map((c) => ({ key: c.id, when: c.createdAt }))),
  };
}
