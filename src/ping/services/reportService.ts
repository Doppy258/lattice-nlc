import type {
  Business,
  BusinessCategory,
  BusinessReport,
  Claim,
  Database,
  Offer,
  ReportFilters,
  UserReport,
} from '@/models'
import { loadData } from './storageService'
import { monthKey, monthLabel } from '@/utils/dateTime'

/**
 * reportService — customizable analytics for customers and businesses.
 *
 * The maths lives in small pure helpers (savings, conversion, grouping) that
 * the report builders compose; the public getters just load the store and
 * delegate. Everything recomputes from the live data, so reports update after
 * every claim, redemption, review, or save.
 */

const round2 = (n: number): number => Math.round(n * 100) / 100
const round1 = (n: number): number => Math.round(n * 10) / 10

/* ── Pure calculations ────────────────────────────────────────────────── */

/** Σ (originalPrice − price) for redeemed claims whose offer had an original price. */
export function calculateEstimatedSavings(claims: Claim[], offers: Offer[]): number {
  const offerById = new Map(offers.map((o) => [o.id, o]))
  const total = claims
    .filter((c) => c.status === 'redeemed')
    .reduce((sum, c) => {
      const offer = offerById.get(c.offerId)
      if (offer?.originalPrice) return sum + (offer.originalPrice - offer.price)
      return sum
    }, 0)
  return round2(total)
}

/** Redeemed claims ÷ offer views (0–1; 0 when there are no views). */
export function calculateConversionRate(views: number, redemptions: number): number {
  return views > 0 ? round2(redemptions / views) : 0
}

export function groupClaimsByCategory(
  claims: Claim[],
  businesses: Business[],
): { category: BusinessCategory; count: number }[] {
  const categoryById = new Map(businesses.map((b) => [b.id, b.category]))
  const counts = new Map<BusinessCategory, number>()
  for (const claim of claims) {
    const cat = categoryById.get(claim.businessId)
    if (cat) counts.set(cat, (counts.get(cat) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
}

export function groupSavingsByMonth(
  claims: Claim[],
  offers: Offer[],
): { month: string; savings: number }[] {
  const offerById = new Map(offers.map((o) => [o.id, o]))
  const byMonth = new Map<string, number>()
  for (const claim of claims.filter((c) => c.status === 'redeemed')) {
    const offer = offerById.get(claim.offerId)
    if (!offer?.originalPrice) continue
    const key = monthKey(claim.redeemedAt ?? claim.createdAt)
    byMonth.set(key, (byMonth.get(key) ?? 0) + (offer.originalPrice - offer.price))
  }
  return [...byMonth.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, savings]) => ({ month: monthLabel(key), savings: round2(savings) }))
}

/* ── Filtering ────────────────────────────────────────────────────────── */

function applyClaimFilters(
  claims: Claim[],
  businesses: Business[],
  filters: ReportFilters | undefined,
): Claim[] {
  if (!filters) return claims
  const categoryById = new Map(businesses.map((b) => [b.id, b.category]))
  return claims.filter((c) => {
    if (filters.claimStatus && filters.claimStatus !== 'all' && c.status !== filters.claimStatus) {
      return false
    }
    if (filters.category && filters.category !== 'all' && categoryById.get(c.businessId) !== filters.category) {
      return false
    }
    const created = new Date(c.createdAt).getTime()
    if (filters.dateFrom && created < new Date(filters.dateFrom).getTime()) return false
    if (filters.dateTo && created > new Date(filters.dateTo).getTime()) return false
    return true
  })
}

/* ── Report builders (pure) ───────────────────────────────────────────── */

export function buildUserReport(db: Database, userId: string, filters?: ReportFilters): UserReport {
  const claims = applyClaimFilters(
    db.claims.filter((c) => c.userId === userId),
    db.businesses,
    filters,
  )
  const redeemed = claims.filter((c) => c.status === 'redeemed')
  const reviews = db.reviews.filter((r) => r.userId === userId)

  const categoryCounts = groupClaimsByCategory(claims, db.businesses)

  const ratingDistribution = [1, 2, 3, 4, 5].map((rating) => ({
    rating,
    count: reviews.filter((r) => r.rating === rating).length,
  }))

  const claimsByBusiness = new Map<string, number>()
  for (const c of claims) claimsByBusiness.set(c.businessId, (claimsByBusiness.get(c.businessId) ?? 0) + 1)
  const topBusinessIds = [...claimsByBusiness.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id)

  return {
    totalClaimed: claims.length,
    totalRedeemed: redeemed.length,
    estimatedSavings: calculateEstimatedSavings(redeemed, db.offers),
    businessesSupported: new Set(redeemed.map((c) => c.businessId)).size,
    reviewsSubmitted: reviews.length,
    averageRatingGiven: reviews.length
      ? round1(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length)
      : 0,
    favoriteCategory: categoryCounts[0]?.category ?? null,
    claimsByCategory: categoryCounts,
    savingsByMonth: groupSavingsByMonth(redeemed, db.offers),
    ratingDistribution,
    topBusinessIds,
  }
}

export function buildBusinessReport(
  db: Database,
  businessId: string,
  filters?: ReportFilters,
): BusinessReport {
  const business = db.businesses.find((b) => b.id === businessId)
  const offers = db.offers.filter((o) => o.businessId === businessId)
  const offerById = new Map(offers.map((o) => [o.id, o]))
  const claims = applyClaimFilters(
    db.claims.filter((c) => c.businessId === businessId),
    db.businesses,
    filters,
  )
  const redemptions = claims.filter((c) => c.status === 'redeemed')
  const reviews = db.reviews.filter((r) => r.businessId === businessId)

  const offerViews = offers.reduce((s, o) => s + o.views, 0)

  // Repeat customers = users with more than one redeemed claim here.
  const perUser = new Map<string, number>()
  for (const c of redemptions) perUser.set(c.userId, (perUser.get(c.userId) ?? 0) + 1)
  const repeatCustomers = [...perUser.values()].filter((n) => n > 1).length

  const revenueInfluenced = round2(
    redemptions.reduce((s, c) => s + (offerById.get(c.offerId)?.price ?? 0), 0),
  )

  const tagCounts = new Map<string, number>()
  for (const r of reviews) for (const t of r.tags) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1)
  const commonTags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([tag, count]) => ({ tag, count }))

  const dayCounts = new Map<string, number>()
  for (const c of claims) {
    const day = c.createdAt.slice(0, 10) // YYYY-MM-DD
    dayCounts.set(day, (dayCounts.get(day) ?? 0) + 1)
  }
  const claimsOverTime = [...dayCounts.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, claimsCount]) => ({ date, claims: claimsCount }))

  const redemptionsByOffer = offers.map((o) => ({
    offerId: o.id,
    redemptions: redemptions.filter((c) => c.offerId === o.id).length,
  }))

  return {
    offerViews,
    claims: claims.length,
    redemptions: redemptions.length,
    conversionRate: calculateConversionRate(offerViews, redemptions.length),
    averageRating: business?.ratingAverage ?? 0,
    reviewCount: business?.reviewCount ?? reviews.length,
    repeatCustomers,
    revenueInfluenced,
    commonTags,
    claimsOverTime,
    redemptionsByOffer,
  }
}

/* ── Storage-bound getters ────────────────────────────────────────────── */

export function getUserReport(userId: string, filters?: ReportFilters): UserReport {
  return buildUserReport(loadData(), userId, filters)
}

export function getBusinessReport(businessId: string, filters?: ReportFilters): BusinessReport {
  return buildBusinessReport(loadData(), businessId, filters)
}
