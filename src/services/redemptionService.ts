/**
 * redemptionService - Lattice Pass two-sided redemption logic.
 * Purpose: Manages the lifecycle of a redemptions pass — from validation
 * and minting (createRedemptionPass), through look-up (findPass), approval
 * checks (validateForApproval), and final approval (approveRedemption).
 * Also handles pass expiry and per-business pending queues.
 * Key exports: createRedemptionPass, validateForApproval, approveRedemption,
 *   findPass, generateBackupCode, generateToken, remainingRedemptions,
 *   getLivePendingForBusiness, expirePendingPasses
 */
import type { Claim, Offer } from "../models";
import { MAX_ACTIVE_CLAIMS } from "../utils/constants";
import { createId, randomInt } from "../utils/ids";
import { isPast } from "../utils/dateTime";

/**
 * Two-sided verified redemption ("Lattice Pass").
 *
 * Claiming an offer does NOT redeem it — it mints a `pending` pass carrying a
 * one-time QR token + 6-digit backup code that expires after the offer's
 * redemption window (~5 min). The offer is only `redeemed` once a business
 * verifies the code/token and approves it. A pending pass reserves an inventory
 * slot; expiry returns it automatically (expired passes stop counting as used).
 */

const BACKUP_CODE_PATTERN = /^\d{6}$/;

export type CreatePassResult = { ok: true; pass: Claim } | { ok: false; error: string };
export type ApprovalCheck = { ok: true } | { ok: false; error: string };

/** True if `value` looks like a 6-digit backup code. */
export function validateBackupCode(value: string): boolean {
  return BACKUP_CODE_PATTERN.test(value.trim());
}

/** Opaque, URL-safe one-time token encoded into the pass QR code. */
export function generateToken(): string {
  return `${createId("pass")}${randomInt(100000, 999999)}`;
}

/** A 6-digit code unique among the live (pending/redeemed) passes supplied. */
export function generateBackupCode(existing: Claim[]): string {
  const used = new Set(
    existing.filter((c) => c.status === "pending" || c.status === "redeemed").map((c) => c.backupCode),
  );
  let code = "";
  do {
    code = String(randomInt(100000, 999999));
  } while (used.has(code));
  return code;
}

/** Passes for an offer that currently count against its limit (redeemed + live pending). */
function usedSlots(offerId: string, passes: Claim[], now: Date): number {
  return passes.filter(
    (p) =>
      p.offerId === offerId &&
      (p.status === "redeemed" || (p.status === "pending" && !isPast(p.expiresAt, now))),
  ).length;
}

/** Redemptions still available on an offer (null limit is never used here — maxClaims is the cap). */
export function remainingRedemptions(offer: Offer, passes: Claim[], now = new Date()): number {
  return Math.max(0, offer.maxClaims - usedSlots(offer.id, passes, now));
}

/** Count of redemptions that were approved for an offer. */
export function redeemedCount(offerId: string, passes: Claim[]): number {
  return passes.filter((p) => p.offerId === offerId && p.status === "redeemed").length;
}

/**
 * Validates and mints a pending Lattice Pass. Does not persist; the caller
 * stores the returned pass and shows it to the customer.
 */
export function createRedemptionPass(
  userId: string,
  offer: Offer,
  passes: Claim[],
  now = new Date(),
): CreatePassResult {
  if (!offer.active) {
    return { ok: false, error: "This offer is paused right now." };
  }
  if (isPast(offer.validUntil, now)) {
    return { ok: false, error: "This offer has expired. Browse similar active offers." };
  }
  if (Date.parse(offer.validFrom) > now.getTime()) {
    return { ok: false, error: "This offer hasn't started yet." };
  }

  const mineForOffer = passes.filter((p) => p.userId === userId && p.offerId === offer.id);
  if (offer.oneTimePerUser && mineForOffer.some((p) => p.status === "redeemed")) {
    return { ok: false, error: "You've already redeemed this one-time offer." };
  }
  if (mineForOffer.some((p) => p.status === "pending" && !isPast(p.expiresAt, now))) {
    return { ok: false, error: "You already have an active pass for this offer — open it from Claims." };
  }

  if (remainingRedemptions(offer, passes, now) <= 0) {
    return { ok: false, error: "This offer has no redemptions remaining." };
  }

  const myOpenPending = passes.filter(
    (p) => p.userId === userId && p.status === "pending" && !isPast(p.expiresAt, now),
  ).length;
  if (myOpenPending >= MAX_ACTIVE_CLAIMS) {
    return {
      ok: false,
      error: `You can hold up to ${MAX_ACTIVE_CLAIMS} active passes at once. Redeem or let one expire first.`,
    };
  }

  const createdAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + offer.redemptionWindowMinutes * 60_000).toISOString();
  const backupCode = generateBackupCode(passes);

  const pass: Claim = {
    id: createId("pass"),
    userId,
    offerId: offer.id,
    businessId: offer.businessId,
    claimCode: backupCode,
    token: generateToken(),
    backupCode,
    status: "pending",
    createdAt,
    expiresAt,
  };
  return { ok: true, pass };
}

/** Finds a pass by its 6-digit backup code or its QR token (case/whitespace tolerant). */
export function findPass(value: string, passes: Claim[]): Claim | undefined {
  const v = value.trim();
  const digits = v.toUpperCase();
  return passes.find((p) => p.backupCode === digits || p.token === v || p.claimCode === digits);
}

/**
 * Verifies a pass can be approved by `businessId`. Returns the precise,
 * demo-friendly reason when it can't.
 */
export function validateForApproval(
  pass: Claim | undefined,
  offer: Offer | undefined,
  businessId: string,
  passes: Claim[],
  now = new Date(),
): ApprovalCheck {
  if (!pass) return { ok: false, error: "No pass found for that code. Double-check the 6 digits." };
  if (pass.businessId !== businessId) {
    return { ok: false, error: "This pass belongs to another business." };
  }
  if (pass.status === "redeemed") return { ok: false, error: "This pass was already redeemed." };
  if (pass.status === "cancelled") return { ok: false, error: "This pass was cancelled." };
  if (pass.status === "expired" || isPast(pass.expiresAt, now)) {
    return { ok: false, error: "This pass has expired." };
  }
  if (!offer) return { ok: false, error: "The offer for this pass no longer exists." };
  if (!offer.active || isPast(offer.validUntil, now)) {
    return { ok: false, error: "This offer is no longer active." };
  }
  if (offer.oneTimePerUser) {
    const alreadyRedeemed = passes.some(
      (p) => p.id !== pass.id && p.userId === pass.userId && p.offerId === offer.id && p.status === "redeemed",
    );
    if (alreadyRedeemed) {
      return { ok: false, error: "This customer has already redeemed this offer." };
    }
  }
  if (redeemedCount(offer.id, passes) >= offer.maxClaims) {
    return { ok: false, error: "This offer has no redemptions remaining." };
  }
  return { ok: true };
}

/** Marks a pass redeemed and stamps who approved it. Does not persist. */
export function approveRedemption(pass: Claim, businessUserId: string, now = new Date()): Claim {
  return {
    ...pass,
    status: "redeemed",
    redeemedAt: now.toISOString(),
    approvedByBusinessUserId: businessUserId,
  };
}

/** Returns a new passes array with any past-due pending passes flipped to expired. */
export function expirePendingPasses(passes: Claim[], now = new Date()): Claim[] {
  return passes.map((p) =>
    p.status === "pending" && isPast(p.expiresAt, now) ? { ...p, status: "expired" as const } : p,
  );
}

/** Pending passes for a business that are still within their window. */
export function getLivePendingForBusiness(businessId: string, passes: Claim[], now = new Date()): Claim[] {
  return passes
    .filter((p) => p.businessId === businessId && p.status === "pending" && !isPast(p.expiresAt, now))
    .sort((a, b) => Date.parse(a.expiresAt) - Date.parse(b.expiresAt));
}
