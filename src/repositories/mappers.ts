/**
 * Row-to-model mapper functions and their companion TypeScript types for
 * every Supabase table used in the app. Each `rowTo*` function converts a
 * snake_case Supabase row into the corresponding camelCase domain model,
 * supplying sensible defaults for nullable columns (empty arrays, default
 * preferences, etc.) so the rest of the app never handles raw rows.
 */
import type { Business, Claim, Offer, PingRequest, Review, User, UserPreferences } from "@/models";

export type ProfileRow = {
  id: string; name: string; email: string; role: User["role"];
  verified: boolean; preferences: UserPreferences | null; onboarding_complete: boolean; created_at: string;
};
export type PublicProfileRow = { id: string; name: string; role: User["role"]; verified: boolean };
export type BusinessRow = {
  id: string; name: string; category: Business["category"]; description: string; address: string;
  location: Business["location"]; hours: Business["hours"] | null; rating_average: number; review_count: number;
  verified: boolean; price_level: Business["priceLevel"]; tags: string[] | null; accessibility_features: string[] | null;
  owner_user_id: string; created_at: string;
};
export type OfferRow = {
  id: string; business_id: string; title: string; description: string; category: Offer["category"];
  offer_type: Offer["offerType"]; price: number; original_price: number | null; valid_from: string; valid_until: string;
  max_claims: number; current_claims: number; views: number; tags: string[] | null; student_only: boolean;
  verification_required: boolean; active: boolean; created_at: string;
};
export type ClaimRow = {
  id: string; user_id: string; offer_id: string; business_id: string; claim_code: string;
  status: Claim["status"]; created_at: string; expires_at: string; redeemed_at: string | null;
};
export type ReviewRow = {
  id: string; user_id: string; business_id: string; offer_id: string; claim_id: string;
  rating: number; text: string; tags: string[] | null; verified: boolean; created_at: string;
};
export type RequestRow = {
  id: string; user_id: string; category: PingRequest["category"]; need_type: PingRequest["needType"];
  budget_min: number | null; budget_max: number | null; distance_km: number; time_start: string; time_end: string;
  preferences: string[] | null; optional_note: string | null; verified_human: boolean; status: PingRequest["status"]; created_at: string;
};

const DEFAULT_PREFS: UserPreferences = {
  preferredCategories: [], maxDefaultDistanceKm: 3, studentDiscountPreferred: false,
  accessibilityNeeds: [], savedBusinessIds: [], savedOfferIds: [],
};

export const rowToProfile = (r: ProfileRow): User => ({
  id: r.id, name: r.name, email: r.email, role: r.role,
  location: null, verified: r.verified, createdAt: r.created_at,
  preferences: r.preferences ?? DEFAULT_PREFS, onboarded: r.onboarding_complete,
});

export const publicRowToUser = (r: PublicProfileRow): User => ({
  id: r.id, name: r.name, email: "", role: r.role,
  location: null, verified: r.verified, createdAt: "", preferences: DEFAULT_PREFS, onboarded: true,
});

export const rowToBusiness = (r: BusinessRow): Business => ({
  id: r.id, name: r.name, category: r.category, description: r.description, address: r.address,
  location: r.location, hours: r.hours ?? [], ratingAverage: Number(r.rating_average), reviewCount: r.review_count,
  verified: r.verified, priceLevel: r.price_level, tags: r.tags ?? [], accessibilityFeatures: r.accessibility_features ?? [],
  ownerUserId: r.owner_user_id, createdAt: r.created_at,
});

export const rowToOffer = (r: OfferRow): Offer => ({
  id: r.id, businessId: r.business_id, title: r.title, description: r.description, category: r.category,
  offerType: r.offer_type, price: Number(r.price), originalPrice: r.original_price == null ? undefined : Number(r.original_price),
  validFrom: r.valid_from, validUntil: r.valid_until, maxClaims: r.max_claims, currentClaims: r.current_claims, views: r.views,
  tags: r.tags ?? [], studentOnly: r.student_only, verificationRequired: r.verification_required, active: r.active, createdAt: r.created_at,
  oneTimePerUser: true, redemptionWindowMinutes: 5,
});

export const rowToClaim = (r: ClaimRow): Claim => ({
  id: r.id, userId: r.user_id, offerId: r.offer_id, businessId: r.business_id, claimCode: r.claim_code,
  token: r.claim_code, backupCode: r.claim_code,
  status: r.status, createdAt: r.created_at, expiresAt: r.expires_at, redeemedAt: r.redeemed_at ?? undefined,
});

export const rowToReview = (r: ReviewRow): Review => ({
  id: r.id, userId: r.user_id, businessId: r.business_id, offerId: r.offer_id, claimId: r.claim_id,
  rating: r.rating, text: r.text, tags: r.tags ?? [], verified: r.verified, createdAt: r.created_at,
});

export const rowToRequest = (r: RequestRow): PingRequest => ({
  id: r.id, userId: r.user_id, category: r.category, needType: r.need_type,
  budgetMin: r.budget_min ?? undefined, budgetMax: r.budget_max ?? undefined, distanceKm: Number(r.distance_km),
  timeStart: r.time_start, timeEnd: r.time_end, preferences: r.preferences ?? [],
  optionalNote: r.optional_note ?? undefined, verifiedHuman: r.verified_human, status: r.status, createdAt: r.created_at,
});
