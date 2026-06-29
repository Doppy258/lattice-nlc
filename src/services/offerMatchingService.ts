/**
 * offerMatchingService — weighted match-scoring engine.
 * Filters offers through a hard eligibility gate (category, distance, budget,
 * time), then scores survivors across 6 weighted dimensions. The result is a
 * ranked list of MatchResults with per-dimension breakdowns and human-readable
 * reasons — the core intelligence behind "Why this match?".
 */
import type {
  Business,
  GeoPoint,
  MatchResult,
  Offer,
  PingRequest,
  ScoreBreakdown,
  User,
} from "../models";
import { MATCH_WEIGHTS, RELATED_CATEGORIES } from "../utils/constants";
import { distanceKm, roundKm } from "../utils/distance";
import { isBusinessOpenDuring } from "../utils/dateTime";

const FALLBACK_ORIGIN: GeoPoint = { lat: 29.4241, lng: -98.4936 };

/** Resolves the distance anchor for a user — uses their live geolocation or a fallback. */
export function getOriginPoint(user: User | undefined): GeoPoint {
  return user?.location ?? FALLBACK_ORIGIN;
}

/**
 * 100 exact category + exact need, 75 same category but a different need,
 * 60 related category, 0 unrelated. Offers without a declared need fall back to
 * a full category match (100) so legacy offers aren't penalized.
 */
export function calculateCategoryScore(request: PingRequest, offer: Offer): number {
  if (offer.category === request.category) {
    if (offer.needType === undefined) return 100; // legacy offer, no need declared
    return offer.needType === request.needType ? 100 : 75; // exact need vs other need in-category
  }
  if (RELATED_CATEGORIES[request.category]?.includes(offer.category)) return 60;
  return 0;
}

/** 100 within budget, 70 within +15%, 30 over but strongly rated, else 0. */
export function calculateBudgetScore(
  request: PingRequest,
  offer: Offer,
  business: Business
): number {
  if (request.budgetMax == null) return 100; // "No budget" selected.
  if (offer.price <= request.budgetMax) return 100;
  if (offer.price <= request.budgetMax * 1.15) return 70;
  if (business.ratingAverage >= 4.5) return 30;
  return 0;
}

/** 100 at the origin, scaling toward 80 at the chosen radius; 0 beyond it. */
export function calculateDistanceScore(
  request: PingRequest,
  business: Business,
  origin: GeoPoint
): number {
  const d = distanceKm(origin, business.location);
  if (d > request.distanceKm) return 0;
  const ratio = request.distanceKm === 0 ? 0 : d / request.distanceKm;
  return Math.round(100 - 20 * ratio);
}

/** Maps a 1–5 average rating to 0–100 (4.5 → 90). */
export function calculateRatingScore(business: Business): number {
  return Math.round((business.ratingAverage / 5) * 100);
}

/** Whether the offer is live at any point during the request's time window. */
export function offerOverlapsWindow(offer: Offer, request: PingRequest): boolean {
  return (
    Date.parse(offer.validUntil) >= Date.parse(request.timeStart) &&
    Date.parse(offer.validFrom) <= Date.parse(request.timeEnd)
  );
}

/**
 * A business that hasn't published any weekly hours has *unknown* availability,
 * not *zero* availability. Newly onboarded storefronts start with `hours: []`
 * (onboarding collects no hours), so treating empty hours as "closed" would
 * silently fail the time eligibility gate for every one of their offers — the
 * cause of "create a Lattice" returning zero matches for a freshly created
 * business. When hours are unknown we let the offer's own validity window do the
 * time-gating instead.
 */
export function hasPublishedHours(business: Business): boolean {
  return business.hours.length > 0;
}

/** 100 fully available, 50 partially, 0 unavailable during the window. */
export function calculateTimeScore(
  request: PingRequest,
  offer: Offer,
  business: Business
): number {
  if (!offerOverlapsWindow(offer, request)) return 0;
  if (!hasPublishedHours(business)) return 100; // hours unknown — rely on the offer's validity window
  const open = isBusinessOpenDuring(business.hours, request.timeStart, request.timeEnd);
  return open === "full" ? 100 : open === "partial" ? 50 : 0;
}

/** Share of the user's requested preferences this offer/business satisfies. */
export function calculatePreferenceScore(
  request: PingRequest,
  offer: Offer,
  business: Business,
  _user: User
): number {
  const prefs = request.preferences ?? [];
  if (prefs.length === 0) return 100; // Nothing requested → no penalty.

  const tags = new Set([...offer.tags, ...business.tags]);
  const access = new Set(business.accessibilityFeatures);
  const open =
    !hasPublishedHours(business) ||
    isBusinessOpenDuring(business.hours, request.timeStart, request.timeEnd) !== "none";

  const satisfied = (pref: string): boolean => {
    switch (pref) {
      case "studentDiscount":
        return offer.studentOnly || tags.has("student-friendly");
      case "openNow":
        return open;
      case "highlyRated":
        return business.ratingAverage >= 4.5;
      case "groupFriendly":
        return tags.has("group-friendly");
      case "wheelchairAccessible":
        return access.has("wheelchairAccessible");
      case "quiet":
        return access.has("quiet") || tags.has("quiet");
      case "vegetarian":
        return tags.has("vegetarian");
      case "fastService":
      case "under30":
        return tags.has("fast");
      default:
        return false;
    }
  };

  const matched = prefs.filter(satisfied).length;
  return Math.round((matched / prefs.length) * 100);
}

/** Computes the full weighted score (0–100) and its breakdown. */
export function calculateOfferScore(
  request: PingRequest,
  offer: Offer,
  business: Business,
  user: User,
  origin: GeoPoint
): { score: number; breakdown: ScoreBreakdown } {
  const breakdown: ScoreBreakdown = {
    categoryScore: calculateCategoryScore(request, offer),
    budgetScore: calculateBudgetScore(request, offer, business),
    distanceScore: calculateDistanceScore(request, business, origin),
    ratingScore: calculateRatingScore(business),
    timeScore: calculateTimeScore(request, offer, business),
    preferenceScore: calculatePreferenceScore(request, offer, business, user),
  };
  const w = MATCH_WEIGHTS;
  const score =
    breakdown.categoryScore * w.category +
    breakdown.budgetScore * w.budget +
    breakdown.distanceScore * w.distance +
    breakdown.ratingScore * w.rating +
    breakdown.timeScore * w.time +
    breakdown.preferenceScore * w.preference;
  return { score: Math.round(score), breakdown };
}

/** Turns the score breakdown into a short list of human-readable reasons. */
export function generateMatchReasons(
  breakdown: ScoreBreakdown,
  request: PingRequest,
  offer: Offer,
  business: Business,
  origin: GeoPoint
): string[] {
  const reasons: string[] = [];
  if (offer.needType && offer.needType === request.needType) {
    reasons.push("Exactly what you're looking for");
  }
  if (breakdown.budgetScore >= 70) reasons.push("Fits your budget");
  if (hasPublishedHours(business)) {
    if (breakdown.timeScore >= 100) reasons.push("Open during your requested time");
    else if (breakdown.timeScore >= 50) reasons.push("Partly open during your window");
  } else if (breakdown.timeScore > 0) {
    reasons.push("Available during your window");
  }
  if (breakdown.distanceScore > 0) {
    reasons.push(`${roundKm(distanceKm(origin, business.location))} km away`);
  }
  if (breakdown.ratingScore >= 90) reasons.push("Highly rated by verified reviews");
  if (offer.studentOnly) reasons.push("Has a student discount");
  return reasons.slice(0, 4);
}

/**
 * Hard eligibility gate: an offer must satisfy every spec the user set before it
 * can be ranked. The matching engine then orders the survivors — this is what makes the
 * Create-a-Lattice specs actually constrain the result set rather than just
 * reorder the whole catalog. Each clause reuses the corresponding subscore.
 */
export function isOfferEligible(
  request: PingRequest,
  offer: Offer,
  business: Business,
  origin: GeoPoint
): boolean {
  if (calculateCategoryScore(request, offer) <= 0) return false; // right category (exact/related)
  if (calculateDistanceScore(request, business, origin) <= 0) return false; // within the radius
  if (calculateBudgetScore(request, offer, business) <= 0) return false; // within (or near) budget
  if (calculateTimeScore(request, offer, business) <= 0) return false; // business open + offer valid in-window
  return true;
}

/**
 * Ranks active offers for a request, best match first. Each result carries its
 * score, breakdown, and reasons (the match-scoring intelligent feature). Offers that
 * fail the hard eligibility gate (isOfferEligible) are excluded before ranking.
 */
export function getMatchingOffers(
  request: PingRequest,
  offers: Offer[],
  businesses: Business[],
  user: User,
  originOverride?: GeoPoint
): MatchResult[] {
  const origin = originOverride ?? getOriginPoint(user);
  const byId = new Map(businesses.map((b) => [b.id, b]));

  const results: MatchResult[] = [];
  for (const offer of offers) {
    if (!offer.active) continue;
    const business = byId.get(offer.businessId);
    if (!business) continue;
    if (!isOfferEligible(request, offer, business, origin)) continue;
    const { score, breakdown } = calculateOfferScore(request, offer, business, user, origin);
    if (score <= 0) continue;
    results.push({
      offerId: offer.id,
      businessId: business.id,
      requestId: request.id,
      score,
      scoreBreakdown: breakdown,
      reasons: generateMatchReasons(breakdown, request, offer, business, origin),
    });
  }
  return results.sort((a, b) => b.score - a.score);
}
