import { supabase, isSupabaseConfigured } from "./supabaseClient";
import type {
  AppData,
  User,
  Business,
  Offer,
  Claim,
  Review,
  PersonalRanking,
  SavedBusiness,
  SavedOffer,
  PingRequest,
} from "../models";

// ── Column mappers (camelCase ↔ snake_case) ──────────────────

function userRowToUser(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    role: row.role as User["role"],
    homeLocationId: row.home_location_id as string,
    verified: row.verified as boolean,
    createdAt: row.created_at as string,
    preferences: row.preferences as User["preferences"],
    onboardingComplete: row.onboarding_complete as boolean | undefined,
  };
}

function userToRow(u: User): Record<string, unknown> {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    home_location_id: u.homeLocationId,
    verified: u.verified,
    created_at: u.createdAt,
    preferences: u.preferences,
    onboarding_complete: u.onboardingComplete ?? false,
  };
}

function businessRowToBusiness(row: Record<string, unknown>): Business {
  return {
    id: row.id as string,
    name: row.name as string,
    category: row.category as Business["category"],
    description: row.description as string,
    address: row.address as string,
    location: row.location as Business["location"],
    hours: row.hours as Business["hours"],
    ratingAverage: row.rating_average as number,
    reviewCount: row.review_count as number,
    verified: row.verified as boolean,
    priceLevel: row.price_level as Business["priceLevel"],
    tags: row.tags as string[],
    accessibilityFeatures: row.accessibility_features as string[],
    ownerUserId: row.owner_user_id as string,
    createdAt: row.created_at as string,
  };
}

function businessToRow(b: Business): Record<string, unknown> {
  return {
    id: b.id,
    name: b.name,
    category: b.category,
    description: b.description,
    address: b.address,
    location: b.location,
    hours: b.hours,
    rating_average: b.ratingAverage,
    review_count: b.reviewCount,
    verified: b.verified,
    price_level: b.priceLevel,
    tags: b.tags,
    accessibility_features: b.accessibilityFeatures,
    owner_user_id: b.ownerUserId,
    created_at: b.createdAt,
  };
}

function offerRowToOffer(row: Record<string, unknown>): Offer {
  return {
    id: row.id as string,
    businessId: row.business_id as string,
    title: row.title as string,
    description: row.description as string,
    category: row.category as Offer["category"],
    offerType: row.offer_type as Offer["offerType"],
    price: row.price as number,
    originalPrice: row.original_price as number | undefined,
    validFrom: row.valid_from as string,
    validUntil: row.valid_until as string,
    maxClaims: row.max_claims as number,
    currentClaims: row.current_claims as number,
    views: row.views as number,
    tags: row.tags as string[],
    studentOnly: row.student_only as boolean,
    verificationRequired: row.verification_required as boolean,
    active: row.active as boolean,
    createdAt: row.created_at as string,
  };
}

function offerToRow(o: Offer): Record<string, unknown> {
  return {
    id: o.id,
    business_id: o.businessId,
    title: o.title,
    description: o.description,
    category: o.category,
    offer_type: o.offerType,
    price: o.price,
    original_price: o.originalPrice ?? null,
    valid_from: o.validFrom,
    valid_until: o.validUntil,
    max_claims: o.maxClaims,
    current_claims: o.currentClaims,
    views: o.views,
    tags: o.tags,
    student_only: o.studentOnly,
    verification_required: o.verificationRequired,
    active: o.active,
    created_at: o.createdAt,
  };
}

function claimRowToClaim(row: Record<string, unknown>): Claim {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    offerId: row.offer_id as string,
    businessId: row.business_id as string,
    claimCode: row.claim_code as string,
    status: row.status as Claim["status"],
    createdAt: row.created_at as string,
    expiresAt: row.expires_at as string,
    redeemedAt: row.redeemed_at as string | undefined,
  };
}

function claimToRow(c: Claim): Record<string, unknown> {
  return {
    id: c.id,
    user_id: c.userId,
    offer_id: c.offerId,
    business_id: c.businessId,
    claim_code: c.claimCode,
    status: c.status,
    created_at: c.createdAt,
    expires_at: c.expiresAt,
    redeemed_at: c.redeemedAt ?? null,
  };
}

function reviewRowToReview(row: Record<string, unknown>): Review {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    businessId: row.business_id as string,
    offerId: row.offer_id as string,
    claimId: (row.claim_id as string) ?? undefined,
    rating: row.rating as number,
    text: row.text as string,
    tags: row.tags as string[],
    verified: row.verified as boolean,
    createdAt: row.created_at as string,
  };
}

function reviewToRow(r: Review): Record<string, unknown> {
  return {
    id: r.id,
    user_id: r.userId,
    business_id: r.businessId,
    offer_id: r.offerId,
    claim_id: r.claimId ?? null,
    rating: r.rating,
    text: r.text,
    tags: r.tags,
    verified: r.verified,
    created_at: r.createdAt,
  };
}

function rankingRowToRanking(row: Record<string, unknown>): PersonalRanking {
  return {
    userId: row.user_id as string,
    category: row.category as PersonalRanking["category"],
    needType: row.need_type as PersonalRanking["needType"],
    rankedBusinessIds: row.ranked_business_ids as string[],
    updatedAt: row.updated_at as string,
  };
}

function rankingToRow(r: PersonalRanking): Record<string, unknown> {
  return {
    user_id: r.userId,
    category: r.category,
    need_type: r.needType ?? null,
    ranked_business_ids: r.rankedBusinessIds,
    updated_at: r.updatedAt,
  };
}

function savedBusinessRowToSaved(row: Record<string, unknown>): SavedBusiness {
  return {
    userId: row.user_id as string,
    businessId: row.business_id as string,
    savedAt: row.saved_at as string,
    tags: row.tags as string[],
  };
}

function savedOfferRowToSaved(row: Record<string, unknown>): SavedOffer {
  return {
    userId: row.user_id as string,
    offerId: row.offer_id as string,
    savedAt: row.saved_at as string,
  };
}

function requestRowToRequest(row: Record<string, unknown>): PingRequest {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    category: row.category as PingRequest["category"],
    needType: row.need_type as PingRequest["needType"],
    budgetMin: row.budget_min as number | undefined,
    budgetMax: row.budget_max as number | undefined,
    distanceKm: row.distance_km as number,
    timeStart: row.time_start as string,
    timeEnd: row.time_end as string,
    preferences: row.preferences as string[],
    optionalNote: row.optional_note as string | undefined,
    verifiedHuman: row.verified_human as boolean,
    status: row.status as PingRequest["status"],
    createdAt: row.created_at as string,
  };
}

function requestToRow(r: PingRequest): Record<string, unknown> {
  return {
    id: r.id,
    user_id: r.userId,
    category: r.category,
    need_type: r.needType,
    budget_min: r.budgetMin ?? null,
    budget_max: r.budgetMax ?? null,
    distance_km: r.distanceKm,
    time_start: r.timeStart,
    time_end: r.timeEnd,
    preferences: r.preferences,
    optional_note: r.optionalNote ?? null,
    verified_human: r.verifiedHuman,
    status: r.status,
    created_at: r.createdAt,
  };
}

// ── Fetch all data ───────────────────────────────────────────

export async function fetchAllData(): Promise<AppData | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  const [usersRes, businessesRes, offersRes, claimsRes, reviewsRes, rankingsRes, requestsRes, savedBizRes, savedOffersRes] =
    await Promise.all([
      supabase.from("users").select("*"),
      supabase.from("businesses").select("*"),
      supabase.from("offers").select("*"),
      supabase.from("claims").select("*"),
      supabase.from("reviews").select("*"),
      supabase.from("rankings").select("*"),
      supabase.from("ping_requests").select("*"),
      supabase.from("saved_businesses").select("*"),
      supabase.from("saved_offers").select("*"),
    ]);

  if (usersRes.error || businessesRes.error || offersRes.error ||
      claimsRes.error || reviewsRes.error || rankingsRes.error ||
      requestsRes.error || savedBizRes.error || savedOffersRes.error) {
    return null;
  }

  return {
    users: (usersRes.data ?? []).map(userRowToUser),
    businesses: (businessesRes.data ?? []).map(businessRowToBusiness),
    offers: (offersRes.data ?? []).map(offerRowToOffer),
    claims: (claimsRes.data ?? []).map(claimRowToClaim),
    reviews: (reviewsRes.data ?? []).map(reviewRowToReview),
    rankings: (rankingsRes.data ?? []).map(rankingRowToRanking),
    requests: (requestsRes.data ?? []).map(requestRowToRequest),
    savedBusinesses: (savedBizRes.data ?? []).map(savedBusinessRowToSaved),
    savedOffers: (savedOffersRes.data ?? []).map(savedOfferRowToSaved),
  };
}

// ── Users ────────────────────────────────────────────────────

export async function upsertUser(user: User): Promise<void> {
  if (!supabase) return;
  await supabase.from("users").upsert(userToRow(user), { onConflict: "id" });
}

export async function upsertUsers(users: User[]): Promise<void> {
  if (!supabase || users.length === 0) return;
  await supabase.from("users").upsert(users.map(userToRow), { onConflict: "id" });
}

// ── Businesses ───────────────────────────────────────────────

export async function upsertBusiness(business: Business): Promise<void> {
  if (!supabase) return;
  await supabase.from("businesses").upsert(businessToRow(business), { onConflict: "id" });
}

export async function upsertBusinesses(businesses: Business[]): Promise<void> {
  if (!supabase || businesses.length === 0) return;
  await supabase.from("businesses").upsert(businesses.map(businessToRow), { onConflict: "id" });
}

// ── Offers ───────────────────────────────────────────────────

export async function upsertOffer(offer: Offer): Promise<void> {
  if (!supabase) return;
  await supabase.from("offers").upsert(offerToRow(offer), { onConflict: "id" });
}

export async function upsertOffers(offers: Offer[]): Promise<void> {
  if (!supabase || offers.length === 0) return;
  await supabase.from("offers").upsert(offers.map(offerToRow), { onConflict: "id" });
}

export async function deleteOffer(offerId: string): Promise<void> {
  if (!supabase) return;
  await supabase.from("offers").delete().eq("id", offerId);
}

// ── Claims ───────────────────────────────────────────────────

export async function upsertClaim(claim: Claim): Promise<void> {
  if (!supabase) return;
  await supabase.from("claims").upsert(claimToRow(claim), { onConflict: "id" });
}

export async function upsertClaims(claims: Claim[]): Promise<void> {
  if (!supabase || claims.length === 0) return;
  await supabase.from("claims").upsert(claims.map(claimToRow), { onConflict: "id" });
}

// ── Reviews ──────────────────────────────────────────────────

export async function insertReview(review: Review): Promise<void> {
  if (!supabase) return;
  await supabase.from("reviews").insert(reviewToRow(review));
}

// ── Rankings ─────────────────────────────────────────────────

export async function upsertRanking(ranking: PersonalRanking): Promise<void> {
  if (!supabase) return;
  const row = rankingToRow(ranking);
  await supabase
    .from("rankings")
    .upsert(row, { onConflict: "user_id,category,need_type" });
}

// ── Saved items ──────────────────────────────────────────────

export async function insertSavedBusiness(saved: SavedBusiness): Promise<void> {
  if (!supabase) return;
  await supabase.from("saved_businesses").upsert(
    { user_id: saved.userId, business_id: saved.businessId, saved_at: saved.savedAt, tags: saved.tags },
    { onConflict: "user_id,business_id" }
  );
}

export async function deleteSavedBusiness(userId: string, businessId: string): Promise<void> {
  if (!supabase) return;
  await supabase
    .from("saved_businesses")
    .delete()
    .eq("user_id", userId)
    .eq("business_id", businessId);
}

export async function insertSavedOffer(saved: SavedOffer): Promise<void> {
  if (!supabase) return;
  await supabase.from("saved_offers").upsert(
    { user_id: saved.userId, offer_id: saved.offerId, saved_at: saved.savedAt },
    { onConflict: "user_id,offer_id" }
  );
}

export async function deleteSavedOffer(userId: string, offerId: string): Promise<void> {
  if (!supabase) return;
  await supabase
    .from("saved_offers")
    .delete()
    .eq("user_id", userId)
    .eq("offer_id", offerId);
}

// ── Ping Requests ────────────────────────────────────────────

export async function upsertRequest(request: PingRequest): Promise<void> {
  if (!supabase) return;
  await supabase.from("ping_requests").upsert(requestToRow(request), { onConflict: "id" });
}

export async function upsertRequests(requests: PingRequest[]): Promise<void> {
  if (!supabase || requests.length === 0) return;
  await supabase.from("ping_requests").upsert(requests.map(requestToRow), { onConflict: "id" });
}
