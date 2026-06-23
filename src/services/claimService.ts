import type { Claim, Offer } from "../models";
import { MAX_ACTIVE_CLAIMS } from "../utils/constants";
import { createId, randomInt } from "../utils/ids";
import { isPast } from "../utils/dateTime";

const CLAIM_CODE_PATTERN = /^PING-\d{4}$/;

export type CreateClaimResult =
  | { ok: true; claim: Claim }
  | { ok: false; error: string };

export type RedeemResult =
  | { ok: true; claim: Claim }
  | { ok: false; error: string };

/** True if `code` matches the PING-#### format. */
export function validateClaimCode(code: string): boolean {
  return CLAIM_CODE_PATTERN.test(code.trim().toUpperCase());
}

/** Generates a PING-#### code unique among the supplied claims. */
export function generateClaimCode(existing: Claim[]): string {
  const used = new Set(existing.map((c) => c.claimCode));
  let code = "";
  do {
    code = `PING-${randomInt(1000, 9999)}`;
  } while (used.has(code));
  return code;
}

export function getUserClaims(userId: string, claims: Claim[]): Claim[] {
  return claims.filter((c) => c.userId === userId);
}

export function getBusinessClaims(businessId: string, claims: Claim[]): Claim[] {
  return claims.filter((c) => c.businessId === businessId);
}

/**
 * Validates and constructs a new claim (section 10.5). Does not mutate inputs;
 * the caller persists the returned claim and increments the offer's claim count.
 */
export function createClaim(
  userId: string,
  offer: Offer,
  existingClaims: Claim[],
  now = new Date()
): CreateClaimResult {
  if (!offer.active || isPast(offer.validUntil, now)) {
    return { ok: false, error: "This offer has expired. View similar active offers." };
  }
  if (offer.currentClaims >= offer.maxClaims) {
    return { ok: false, error: "This offer has reached its claim limit." };
  }

  const mine = getUserClaims(userId, existingClaims);
  const alreadyClaimed = mine.some(
    (c) => c.offerId === offer.id && (c.status === "active" || c.status === "redeemed")
  );
  if (alreadyClaimed) {
    return { ok: false, error: "You've already claimed this offer." };
  }

  const activeCount = mine.filter((c) => c.status === "active").length;
  if (activeCount >= MAX_ACTIVE_CLAIMS) {
    return {
      ok: false,
      error: `You can only have ${MAX_ACTIVE_CLAIMS} active claims at once. Redeem or cancel one first.`,
    };
  }

  const claim: Claim = {
    id: createId("claim"),
    userId,
    offerId: offer.id,
    businessId: offer.businessId,
    claimCode: generateClaimCode(existingClaims),
    status: "active",
    createdAt: now.toISOString(),
    expiresAt: offer.validUntil,
  };
  return { ok: true, claim };
}

/**
 * Verifies a claim code for a business and returns the redeemed claim.
 * Caller persists the returned claim and updates analytics.
 */
export function redeemClaim(
  code: string,
  businessId: string,
  claims: Claim[],
  now = new Date()
): RedeemResult {
  const normalized = code.trim().toUpperCase();
  if (!validateClaimCode(normalized)) {
    return { ok: false, error: "Claim codes look like PING-1234." };
  }
  const claim = claims.find((c) => c.claimCode === normalized);
  if (!claim) {
    return { ok: false, error: "This claim code does not exist or is not active." };
  }
  if (claim.businessId !== businessId) {
    return { ok: false, error: "This claim belongs to another business." };
  }
  if (claim.status === "redeemed") {
    return { ok: false, error: "This claim was already redeemed." };
  }
  if (claim.status === "expired" || isPast(claim.expiresAt, now)) {
    return { ok: false, error: "This claim has expired." };
  }
  if (claim.status !== "active") {
    return { ok: false, error: "This claim is no longer active." };
  }
  return {
    ok: true,
    claim: { ...claim, status: "redeemed", redeemedAt: now.toISOString() },
  };
}

/** Returns a new claims array with any past-due active claims marked expired. */
export function expireOldClaims(claims: Claim[], now = new Date()): Claim[] {
  return claims.map((c) =>
    c.status === "active" && isPast(c.expiresAt, now) ? { ...c, status: "expired" } : c
  );
}
