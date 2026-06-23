import type {
  Business,
  BusinessCategory,
  GeoPoint,
  MatchResult,
  Offer,
  PingRequest,
  ScoreBreakdown,
  User,
} from '@/models'
import { haversineKm } from '@/utils/distance'
import { isoFrom, minutesOfDay } from '@/utils/dateTime'
import { formatCurrency, formatDistance, formatRating } from '@/utils/formatting'
import type { PingDraft } from './requestValidationService'
import { MAX_DISTANCE_KM } from './requestValidationService'

/**
 * offerMatchingService — "OfferRank", the intelligent feature.
 *
 * Ranks offers against a Ping with a weighted score (0–100) built from seven
 * explainable subscores, then turns the breakdown into plain-language reasons.
 * All scoring is pure; only the thin convenience wrappers read seed data.
 */

/** Weighted contribution of each subscore to the final 0–100 score (PRD §13.1). */
export const SCORE_WEIGHTS = {
  category: 0.25,
  budget: 0.2,
  distance: 0.15,
  rating: 0.15,
  time: 0.1,
  verification: 0.1,
  preference: 0.05,
} as const

/** Offers scoring below this are treated as non-matches. */
export const MATCH_THRESHOLD = 35
export const MAX_RESULTS = 24
const STRONG_RATING = 4.5

/** Loose "related category" map for the partial (60) category score. */
const RELATED_CATEGORIES: Record<BusinessCategory, BusinessCategory[]> = {
  food: ['entertainment'],
  retail: ['services'],
  services: ['retail', 'repair'],
  fitness: ['education'],
  education: ['fitness'],
  repair: ['services'],
  entertainment: ['food'],
}

/* ── Subscores ────────────────────────────────────────────────────────── */

export function calculateCategoryScore(request: PingRequest, offer: Offer): number {
  if (offer.category === request.category) return 100
  if (RELATED_CATEGORIES[request.category]?.includes(offer.category)) return 60
  return 0
}

export function calculateBudgetScore(request: PingRequest, offer: Offer, business: Business): number {
  const max = request.budgetMax
  if (max === undefined) return 100 // "No budget" — no constraint
  if (offer.price <= max) return 100
  if (offer.price <= max * 1.15) return 70
  if (business.ratingAverage >= STRONG_RATING) return 30
  return 0
}

/** Distance score from raw kilometres: 100 at the origin → 50 at the max, 0 beyond. */
export function distanceScoreFromKm(distanceKm: number, maxKm: number): number {
  if (distanceKm > maxKm) return 0
  return Math.round(Math.max(0, Math.min(100, 100 - (distanceKm / maxKm) * 50)))
}

export function calculateDistanceScore(
  request: PingRequest,
  business: Business,
  origin: GeoPoint,
): number {
  return distanceScoreFromKm(haversineKm(origin, business.location), request.distanceKm)
}

export function calculateRatingScore(business: Business): number {
  return Math.round((business.ratingAverage / 5) * 100)
}

/** Whether a business's hours cover a window: fully, partially, or not at all. */
function windowCoverage(business: Business, startIso: string, endIso: string): 'full' | 'partial' | 'none' {
  const start = new Date(startIso)
  const end = new Date(endIso)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 'none'

  const startMin = start.getHours() * 60 + start.getMinutes()
  // Clamp a multi-day window to the end of its start day for a simple comparison.
  let endMin = end.getHours() * 60 + end.getMinutes()
  if (end.toDateString() !== start.toDateString()) endMin = 24 * 60
  if (endMin <= startMin) endMin = startMin + 1

  const todays = business.hours.filter((h) => h.dayOfWeek === start.getDay())
  if (todays.length === 0) return 'none'

  let partial = false
  for (const h of todays) {
    const open = minutesOfDay(h.openTime)
    const close = minutesOfDay(h.closeTime)
    if (open <= startMin && close >= endMin) return 'full'
    if (Math.max(open, startMin) < Math.min(close, endMin)) partial = true
  }
  return partial ? 'partial' : 'none'
}

function isOpenNow(business: Business, now: Date): boolean {
  return windowCoverage(business, now.toISOString(), isoFrom(now, { minutes: 1 })) !== 'none'
}

/** Public helper: is the business open at a given moment? (Explore / Matches filters.) */
export function isBusinessOpenAt(business: Business, when: Date = new Date()): boolean {
  return isOpenNow(business, when)
}

export function calculateTimeScore(request: PingRequest, offer: Offer, business: Business): number {
  const offerLive =
    offer.active &&
    new Date(offer.validFrom).getTime() <= new Date(request.timeEnd).getTime() &&
    new Date(offer.validUntil).getTime() >= new Date(request.timeStart).getTime()
  if (!offerLive) return 0

  const coverage = windowCoverage(business, request.timeStart, request.timeEnd)
  if (coverage === 'full') return 100
  if (coverage === 'partial') return 50
  return 0
}

export function calculateVerificationScore(business: Business, offer: Offer): number {
  if (business.verified && offer.verificationRequired) return 100
  if (business.verified) return 70
  return 40
}

const hasTag = (item: { tags: string[] }, needle: string): boolean =>
  item.tags.some((t) => t.toLowerCase().includes(needle))

/** Predicate per preference key, used by both scoring and reason generation. */
const PREFERENCE_MATCHERS: Record<
  string,
  (offer: Offer, business: Business, now: Date) => boolean
> = {
  studentDiscount: (o) => o.studentOnly || o.offerType === 'studentOffer' || hasTag(o, 'student'),
  openNow: (_o, b, now) => isOpenNow(b, now),
  highlyRated: (_o, b) => b.ratingAverage >= STRONG_RATING,
  verifiedOnly: (_o, b) => b.verified,
  verifiedBusinesses: (_o, b) => b.verified,
  groupFriendly: (o, b) => o.offerType === 'groupOffer' || hasTag(o, 'group') || hasTag(b, 'group'),
  wheelchairAccessible: (_o, b) =>
    b.accessibilityFeatures.some((f) => f.toLowerCase().includes('wheelchair')),
  quiet: (_o, b) =>
    hasTag(b, 'quiet') || b.accessibilityFeatures.some((f) => f.toLowerCase().includes('quiet')),
  vegetarian: (o, b) => hasTag(o, 'vegetarian') || hasTag(b, 'vegetarian'),
  fastService: (o, b) => hasTag(o, 'fast') || hasTag(b, 'fast'),
  under30: (o, b) => hasTag(o, 'fast') || hasTag(b, 'fast'),
}

export function calculatePreferenceScore(
  request: PingRequest,
  offer: Offer,
  business: Business,
  _user: User,
  now: Date = new Date(),
): number {
  const prefs = request.preferences
  if (!prefs || prefs.length === 0) return 100 // neutral when nothing requested
  const matched = prefs.filter((p) => PREFERENCE_MATCHERS[p]?.(offer, business, now)).length
  return Math.round((matched / prefs.length) * 100)
}

/* ── Composite score + reasons ────────────────────────────────────────── */

export type ScoredOffer = MatchResult & { distanceKm: number }

export function calculateOfferScore(
  request: PingRequest,
  offer: Offer,
  business: Business,
  user: User,
  origin: GeoPoint,
  now: Date = new Date(),
): ScoredOffer {
  const distanceKm = haversineKm(origin, business.location)
  const breakdown: ScoreBreakdown = {
    categoryScore: calculateCategoryScore(request, offer),
    budgetScore: calculateBudgetScore(request, offer, business),
    distanceScore: distanceScoreFromKm(distanceKm, request.distanceKm),
    ratingScore: calculateRatingScore(business),
    timeScore: calculateTimeScore(request, offer, business),
    verificationScore: calculateVerificationScore(business, offer),
    preferenceScore: calculatePreferenceScore(request, offer, business, user, now),
  }

  const score = Math.round(
    breakdown.categoryScore * SCORE_WEIGHTS.category +
      breakdown.budgetScore * SCORE_WEIGHTS.budget +
      breakdown.distanceScore * SCORE_WEIGHTS.distance +
      breakdown.ratingScore * SCORE_WEIGHTS.rating +
      breakdown.timeScore * SCORE_WEIGHTS.time +
      breakdown.verificationScore * SCORE_WEIGHTS.verification +
      breakdown.preferenceScore * SCORE_WEIGHTS.preference,
  )

  return {
    offerId: offer.id,
    businessId: business.id,
    requestId: request.id,
    score: Math.max(0, Math.min(100, score)),
    scoreBreakdown: breakdown,
    reasons: generateMatchReasons(breakdown, request, offer, business, { distanceKm }),
    distanceKm,
  }
}

/** Turn a score breakdown into a short list of human-readable reasons. */
export function generateMatchReasons(
  breakdown: ScoreBreakdown,
  request: PingRequest,
  offer: Offer,
  business: Business,
  ctx: { distanceKm: number; now?: Date } = { distanceKm: 0 },
): string[] {
  const reasons: string[] = []
  const now = ctx.now ?? new Date()

  if (breakdown.budgetScore >= 100 && request.budgetMax !== undefined) {
    reasons.push(`Fits your ${formatCurrency(request.budgetMax)} budget`)
  } else if (breakdown.budgetScore >= 70) {
    reasons.push('Just within reach of your budget')
  }

  if (breakdown.distanceScore > 0) reasons.push(`Within ${formatDistance(ctx.distanceKm)}`)

  if (breakdown.timeScore >= 100) reasons.push('Open during your requested time')
  else if (breakdown.timeScore >= 50) reasons.push('Partly open during your window')

  if (business.ratingAverage >= STRONG_RATING) {
    reasons.push(`Highly rated (${formatRating(business.ratingAverage)}★) by verified reviews`)
  }

  // Preference-specific call-outs the user explicitly asked for.
  const prefLabels: Record<string, string> = {
    studentDiscount: 'Has a student discount',
    openNow: 'Open right now',
    groupFriendly: 'Group-friendly',
    wheelchairAccessible: 'Wheelchair accessible',
    quiet: 'Quiet space to settle in',
    vegetarian: 'Vegetarian options',
    fastService: 'Fast service',
  }
  for (const pref of request.preferences ?? []) {
    if (prefLabels[pref] && PREFERENCE_MATCHERS[pref]?.(offer, business, now)) {
      reasons.push(prefLabels[pref])
    }
  }

  if (business.verified && reasons.length < 3) reasons.push('Verified business')

  // De-duplicate and keep it digestible.
  return [...new Set(reasons)].slice(0, 5)
}

/* ── Query helpers ────────────────────────────────────────────────────── */

function isCurrentlyLive(offer: Offer, now: Date): boolean {
  return (
    offer.active &&
    new Date(offer.validFrom).getTime() <= now.getTime() &&
    new Date(offer.validUntil).getTime() >= now.getTime()
  )
}

/**
 * Rank every live offer against a request and return matches above the
 * threshold, best first.
 */
export function getMatchingOffers(
  request: PingRequest,
  offers: Offer[],
  businesses: Business[],
  user: User,
  origin: GeoPoint,
  now: Date = new Date(),
): ScoredOffer[] {
  const byId = new Map(businesses.map((b) => [b.id, b]))
  return offers
    .filter((o) => isCurrentlyLive(o, now))
    .map((offer) => {
      const business = byId.get(offer.businessId)
      return business ? calculateOfferScore(request, offer, business, user, origin, now) : null
    })
    .filter((r): r is ScoredOffer => r !== null && r.score >= MATCH_THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RESULTS)
}

/** Top near-miss offers for the empty state when nothing clears the threshold. */
export function getNearMissOffers(
  request: PingRequest,
  offers: Offer[],
  businesses: Business[],
  user: User,
  origin: GeoPoint,
  limit = 3,
  now: Date = new Date(),
): ScoredOffer[] {
  const byId = new Map(businesses.map((b) => [b.id, b]))
  return offers
    .filter((o) => isCurrentlyLive(o, now))
    .map((offer) => {
      const business = byId.get(offer.businessId)
      return business ? calculateOfferScore(request, offer, business, user, origin, now) : null
    })
    .filter((r): r is ScoredOffer => r !== null && r.score < MATCH_THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

/** Build a throwaway request from a draft so the live preview can count matches. */
function draftToRequest(draft: PingDraft, now: Date): PingRequest | null {
  if (!draft.category || !draft.needType) return null
  return {
    id: 'draft',
    userId: 'draft',
    category: draft.category,
    needType: draft.needType,
    budgetMin: draft.budgetMin,
    budgetMax: draft.budgetMax,
    distanceKm: draft.distanceKm ?? MAX_DISTANCE_KM,
    timeStart: draft.timeStart ?? now.toISOString(),
    timeEnd: draft.timeEnd ?? isoFrom(now, { hours: 2 }),
    preferences: draft.preferences ?? [],
    optionalNote: draft.optionalNote,
    verifiedHuman: false,
    status: 'draft',
    createdAt: now.toISOString(),
  }
}

/** Estimated match count for the Create Ping live preview. */
export function estimateMatchCount(
  draft: PingDraft,
  offers: Offer[],
  businesses: Business[],
  user: User,
  origin: GeoPoint,
  now: Date = new Date(),
): number {
  const request = draftToRequest(draft, now)
  if (!request) return 0
  return getMatchingOffers(request, offers, businesses, user, origin, now).length
}
