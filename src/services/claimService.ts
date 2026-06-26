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

/** Flips any past-due pending passes to expired (also releases their reserved slot). */
export function expireOldClaims(claims: Claim[], now = new Date()): Claim[] {
  return expirePendingPasses(claims, now);
}
