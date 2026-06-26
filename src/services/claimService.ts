import type { Claim } from "../models";
import { expirePendingPasses } from "./redemptionService";

/**
 * Claim/pass collection helpers. The redemption lifecycle (minting passes,
 * validating, approving) lives in `redemptionService`; this module keeps the
 * generic lookups used across the app.
 */

export function getUserClaims(userId: string, claims: Claim[]): Claim[] {
  return claims.filter((c) => c.userId === userId);
}

export function getBusinessClaims(businessId: string, claims: Claim[]): Claim[] {
  return claims.filter((c) => c.businessId === businessId);
}

/**
 * The set of business ids a user has claimed an offer from (any claim status).
 * Used to gate actions that require a real customer relationship — e.g. a user
 * may only rank a business once they've claimed one of its offers.
 */
export function getUserClaimedBusinessIds(userId: string, claims: Claim[]): Set<string> {
  return new Set(getUserClaims(userId, claims).map((c) => c.businessId));
}

/** Flips any past-due pending passes to expired (also releases their reserved slot). */
export function expireOldClaims(claims: Claim[], now = new Date()): Claim[] {
  return expirePendingPasses(claims, now);
}
