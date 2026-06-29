/**
 * Supabase persistence layer: every read/write to the remote database flows
 * through this module. The row↔entity mappers centralize the camelCase ↔
 * snake_case translation so every other module (services, hooks, components)
 * works with the TypeScript models and never sees raw Postgres columns.
 */

import { supabase, isSupabaseConfigured } from "./supabaseClient";
import type {
  AppData,
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
    priceLevel: row.price_level as Business["priceLevel"],
    tags: row.tags as string[],
    accessibilityFeatures: row.accessibility_features as string[],
    imageUrl: (row.image_url as string | null) ?? undefined,
    bannerUrl: (row.banner_url as string | null) ?? undefined,
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
    verified: false, // legacy DB column — verification feature removed; written constant for compatibility
    price_level: b.priceLevel,
    tags: b.tags,
    accessibility_features: b.accessibilityFeatures,
    image_url: b.imageUrl ?? null,
    banner_url: b.bannerUrl ?? null,
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
    needType: (row.need_type as Offer["needType"]) ?? undefined,
    discountKind: (row.discount_kind as Offer["discountKind"]) ?? "fixedPrice",
    price: row.price as number,
    originalPrice: (row.original_price as number | null) ?? undefined,
    percentOff: (row.percent_off as number | null) ?? undefined,
    amountOff: (row.amount_off as number | null) ?? undefined,
    validFrom: row.valid_from as string,
    validUntil: row.valid_until as string,
    maxClaims: row.max_claims as number,
    currentClaims: row.current_claims as number,
    views: row.views as number,
    tags: row.tags as string[],
    studentOnly: row.student_only as boolean,
    oneTimePerUser: (row.one_time_per_user as boolean | null) ?? true,
    redemptionWindowMinutes: (row.redemption_window_minutes as number | null) ?? 5,
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
    need_type: o.needType ?? null,
    discount_kind: o.discountKind ?? "fixedPrice",
    price: o.price,
    original_price: o.originalPrice ?? null,
    percent_off: o.percentOff ?? null,
    amount_off: o.amountOff ?? null,
    valid_from: o.validFrom,
    valid_until: o.validUntil,
    max_claims: o.maxClaims,
    current_claims: o.currentClaims,
    views: o.views,
    tags: o.tags,
    student_only: o.studentOnly,
    verification_required: false, // legacy DB column — verification feature removed; written constant for compatibility
    one_time_per_user: o.oneTimePerUser,
    redemption_window_minutes: o.redemptionWindowMinutes,
    active: o.active,
    created_at: o.createdAt,
  };
}

function claimRowToClaim(row: Record<string, unknown>): Claim {
  const claimCode = (row.claim_code as string) ?? "";
  // Legacy rows used "active" for an un-redeemed claim; the pass model calls it "pending".
  const rawStatus = row.status as string;
  const status = (rawStatus === "active" ? "pending" : rawStatus) as Claim["status"];
  return {
    id: row.id as string,
    userId: row.user_id as string,
    offerId: row.offer_id as string,
    businessId: row.business_id as string,
    claimCode,
    token: (row.token as string | null) ?? claimCode,
    backupCode: (row.backup_code as string | null) ?? claimCode,
    status,
    createdAt: row.created_at as string,
    expiresAt: row.expires_at as string,
    redeemedAt: row.redeemed_at as string | undefined,
    approvedByBusinessUserId:
      (row.approved_by_business_user_id as string | null) ?? undefined,
  };
}

function claimToRow(c: Claim): Record<string, unknown> {
  return {
    id: c.id,
    user_id: c.userId,
    offer_id: c.offerId,
    business_id: c.businessId,
    claim_code: c.claimCode,
    token: c.token,
    backup_code: c.backupCode,
    status: c.status,
    created_at: c.createdAt,
    expires_at: c.expiresAt,
    redeemed_at: c.redeemedAt ?? null,
    approved_by_business_user_id: c.approvedByBusinessUserId ?? null,
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
    // Normalise NULL → undefined: rankings are keyed by needType with strict
    // equality (getRanking), and `null === undefined` is false, so a round-tripped
    // NULL would stop matching the page's `undefined` lookup and the list would
    // read as empty after a reload.
    needType: (row.need_type as PersonalRanking["needType"]) ?? undefined,
    rankedBusinessIds: row.ranked_business_ids as string[],
    tierOverrides: (row.tier_overrides as Record<string, string> | null) ?? undefined,
    updatedAt: row.updated_at as string,
  };
}

function rankingToRow(r: PersonalRanking): Record<string, unknown> {
  return {
    user_id: r.userId,
    category: r.category,
    need_type: r.needType ?? null,
    ranked_business_ids: r.rankedBusinessIds,
    tier_overrides: r.tierOverrides ?? {},
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

/** Fetches every entity table in parallel and returns a merged AppData snapshot. */
export async function fetchAllData(): Promise<AppData | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  const [businessesRes, offersRes, claimsRes, reviewsRes, rankingsRes, requestsRes, savedBizRes, savedOffersRes] =
    await Promise.all([
      supabase.from("businesses").select("*"),
      supabase.from("offers").select("*"),
      supabase.from("claims").select("*"),
      supabase.from("reviews").select("*"),
      supabase.from("rankings").select("*"),
      supabase.from("ping_requests").select("*"),
      supabase.from("saved_businesses").select("*"),
      supabase.from("saved_offers").select("*"),
    ]);

  if (businessesRes.error || offersRes.error ||
      claimsRes.error || reviewsRes.error || rankingsRes.error ||
      requestsRes.error || savedBizRes.error || savedOffersRes.error) {
    return null;
  }

  return {
    users: [],
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

// ── Businesses ───────────────────────────────────────────────

/** Creates or updates a single business row. Returns an error message or null on success. */
export async function upsertBusiness(business: Business): Promise<string | null> {
  if (!supabase) return null;
  const { error } = await supabase.from("businesses").upsert(businessToRow(business), { onConflict: "id" });
  return error?.message ?? null;
}

/** Batch upsert for seeding/migration — no per-row error reporting. */
export async function upsertBusinesses(businesses: Business[]): Promise<void> {
  if (!supabase || businesses.length === 0) return;
  await supabase.from("businesses").upsert(businesses.map(businessToRow), { onConflict: "id" });
}

// ── Offers ───────────────────────────────────────────────────

/** Creates or updates a single offer row. */
export async function upsertOffer(offer: Offer): Promise<void> {
  if (!supabase) return;
  await supabase.from("offers").upsert(offerToRow(offer), { onConflict: "id" });
}

/** Batch upsert for offers. */
export async function upsertOffers(offers: Offer[]): Promise<void> {
  if (!supabase || offers.length === 0) return;
  await supabase.from("offers").upsert(offers.map(offerToRow), { onConflict: "id" });
}

export async function deleteOffer(offerId: string): Promise<string | null> {
  if (!supabase) return null;
  // Remove dependents in FK order so an owner can delete an offer even after
  // customers have claimed/reviewed it. Reviews reference both offers
  // (reviews.offer_id) and claims (reviews.claim_id), so they must go first —
  // otherwise deleting the claims trips reviews_claim_id_fkey.
  const { error: reviewsError } = await supabase.from("reviews").delete().eq("offer_id", offerId);
  if (reviewsError) return reviewsError.message;
  // Saved-offer bookmarks (FK: saved_offers.offer_id -> offers.id).
  const { error: savedError } = await supabase.from("saved_offers").delete().eq("offer_id", offerId);
  if (savedError) return savedError.message;
  // Claims (FK: claims.offer_id -> offers.id).
  const { error: claimsError } = await supabase.from("claims").delete().eq("offer_id", offerId);
  if (claimsError) return claimsError.message;
  const { error } = await supabase.from("offers").delete().eq("id", offerId);
  return error?.message ?? null;
}

// ── Claims ───────────────────────────────────────────────────

/** Creates or updates a single claim/pass row. */
export async function upsertClaim(claim: Claim): Promise<void> {
  if (!supabase) return;
  await supabase.from("claims").upsert(claimToRow(claim), { onConflict: "id" });
}

/** Batch upsert for claims. */
export async function upsertClaims(claims: Claim[]): Promise<void> {
  if (!supabase || claims.length === 0) return;
  await supabase.from("claims").upsert(claims.map(claimToRow), { onConflict: "id" });
}

/** Fetches a single claim/pass by id — used to poll a pass's live status. */
export async function fetchClaimById(id: string): Promise<Claim | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("claims").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return claimRowToClaim(data as Record<string, unknown>);
}

/**
 * Looks up a pass by its 6-digit backup code or QR token — lets a business
 * verify a pass a customer created after the business already loaded its data.
 */
export async function fetchClaimByCode(value: string): Promise<Claim | null> {
  if (!supabase) return null;
  const safe = value.trim().replace(/[^A-Za-z0-9_-]/g, "");
  if (!safe) return null;
  const { data, error } = await supabase
    .from("claims")
    .select("*")
    .or(`backup_code.eq.${safe},token.eq.${safe}`)
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return claimRowToClaim(data as Record<string, unknown>);
}

// ── Reviews ──────────────────────────────────────────────────

/** Inserts a single review (reviews are append-only — no upsert). */
export async function insertReview(review: Review): Promise<void> {
  if (!supabase) return;
  await supabase.from("reviews").insert(reviewToRow(review));
}

// ── Rankings ─────────────────────────────────────────────────

/**
 * Saves a personal ranking — ranked order *and* manual tier overrides — keyed by
 * (user_id, category, need_type). These rankings always carry a NULL need_type,
 * and a NULL defeats Postgres' ON CONFLICT inference, so we look up the existing
 * row ourselves and update it (or insert) rather than relying on upsert. Keeps a
 * single row per key regardless of how the table's unique constraint treats NULLs.
 */
export async function upsertRanking(ranking: PersonalRanking): Promise<void> {
  if (!supabase) return;
  const row = rankingToRow(ranking);

  const sel = supabase
    .from("rankings")
    .select("user_id")
    .eq("user_id", ranking.userId)
    .eq("category", ranking.category);
  const { data: existing } = await (
    ranking.needType == null ? sel.is("need_type", null) : sel.eq("need_type", ranking.needType)
  ).maybeSingle();

  let error;
  if (existing) {
    const upd = supabase
      .from("rankings")
      .update(row)
      .eq("user_id", ranking.userId)
      .eq("category", ranking.category);
    ({ error } = await (ranking.needType == null ? upd.is("need_type", null) : upd.eq("need_type", ranking.needType)));
  } else {
    ({ error } = await supabase.from("rankings").insert(row));
  }
  // Surface write failures (e.g. RLS denials) — otherwise a blocked sync looks
  // identical to a working one until another device fails to see the change.
  if (error) console.warn("[rankings] sync write failed:", error.message);
}

// ── Saved items ──────────────────────────────────────────────

/** Bookmarks a business for quick access; idempotent via upsert. */
export async function insertSavedBusiness(saved: SavedBusiness): Promise<void> {
  if (!supabase) return;
  await supabase.from("saved_businesses").upsert(
    { user_id: saved.userId, business_id: saved.businessId, saved_at: saved.savedAt, tags: saved.tags },
    { onConflict: "user_id,business_id" }
  );
}

/** Removes a saved-business bookmark. */
export async function deleteSavedBusiness(userId: string, businessId: string): Promise<void> {
  if (!supabase) return;
  await supabase
    .from("saved_businesses")
    .delete()
    .eq("user_id", userId)
    .eq("business_id", businessId);
}

/** Bookmarks an offer for quick access; idempotent via upsert. */
export async function insertSavedOffer(saved: SavedOffer): Promise<void> {
  if (!supabase) return;
  await supabase.from("saved_offers").upsert(
    { user_id: saved.userId, offer_id: saved.offerId, saved_at: saved.savedAt },
    { onConflict: "user_id,offer_id" }
  );
}

/** Removes a saved-offer bookmark. */
export async function deleteSavedOffer(userId: string, offerId: string): Promise<void> {
  if (!supabase) return;
  await supabase
    .from("saved_offers")
    .delete()
    .eq("user_id", userId)
    .eq("offer_id", offerId);
}

// ── Ping Requests ────────────────────────────────────────────

/** Creates or updates a single ping request. */
export async function upsertRequest(request: PingRequest): Promise<void> {
  if (!supabase) return;
  await supabase.from("ping_requests").upsert(requestToRow(request), { onConflict: "id" });
}

/** Batch upsert for ping requests. */
export async function upsertRequests(requests: PingRequest[]): Promise<void> {
  if (!supabase || requests.length === 0) return;
  await supabase.from("ping_requests").upsert(requests.map(requestToRow), { onConflict: "id" });
}
