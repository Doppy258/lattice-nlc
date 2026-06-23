import type { Claim, Offer } from '@/models'
import { getCollection, updateCollection } from './storageService'
import { isValidClaimCodeFormat, makeClaimCode, makeId, normaliseClaimCode } from '@/utils/ids'

/**
 * claimService — claiming, code generation, and business redemption.
 *
 * Rules are pure functions (canClaim / validateRedemption) so they can be
 * unit-tested and reused by the UI for pre-flight checks; the orchestrators
 * (createClaim / redeemClaim …) read and write through storageService.
 */

export const MAX_ACTIVE_CLAIMS = 3

export type RuleCheck = { ok: true } | { ok: false; error: string }
export type ClaimAttempt = { ok: true; claim: Claim } | { ok: false; error: string }
export type CodeLookup = { valid: true; claim: Claim } | { valid: false; reason: string }

/* ── Pure rules ───────────────────────────────────────────────────────── */

/** Can `userClaims`' owner claim this offer? (PRD §10.5 claim rules.) */
export function canClaim(offer: Offer, userClaims: Claim[], now: Date = new Date()): RuleCheck {
  if (!offer.active || new Date(offer.validUntil) < now) {
    return { ok: false, error: 'This offer has expired.' }
  }
  if (offer.currentClaims >= offer.maxClaims) {
    return { ok: false, error: 'This offer has reached its claim limit.' }
  }
  if (userClaims.some((c) => c.offerId === offer.id && (c.status === 'active' || c.status === 'redeemed'))) {
    return { ok: false, error: 'You’ve already claimed this offer.' }
  }
  if (userClaims.filter((c) => c.status === 'active').length >= MAX_ACTIVE_CLAIMS) {
    return { ok: false, error: `You can have at most ${MAX_ACTIVE_CLAIMS} active claims at once.` }
  }
  return { ok: true }
}

/** Can a business redeem this claim against this offer? (PRD §11.4.) */
export function validateRedemption(
  claim: Claim,
  offer: Offer,
  businessId: string,
  now: Date = new Date(),
): RuleCheck {
  if (offer.businessId !== businessId) {
    return { ok: false, error: 'This claim belongs to another business.' }
  }
  if (claim.status === 'redeemed') return { ok: false, error: 'This claim has already been redeemed.' }
  if (claim.status === 'cancelled') return { ok: false, error: 'This claim was cancelled.' }
  if (claim.status === 'expired' || new Date(claim.expiresAt) < now) {
    return { ok: false, error: 'This claim has expired.' }
  }
  return { ok: true }
}

/** Build (but don't persist) a fresh active claim with a unique code. */
export function buildClaim(
  userId: string,
  offer: Offer,
  existingCodes: Iterable<string>,
  now: Date = new Date(),
): Claim {
  return {
    id: makeId('claim'),
    userId,
    offerId: offer.id,
    businessId: offer.businessId,
    claimCode: makeClaimCode(existingCodes),
    status: 'active',
    createdAt: now.toISOString(),
    // A claim expires with the offer it's for.
    expiresAt: offer.validUntil,
  }
}

/* ── Storage-bound orchestrators ──────────────────────────────────────── */

/** Generate a PING-#### code unique among existing claims. */
export function generateClaimCode(): string {
  return makeClaimCode(getCollection('claims').map((c) => c.claimCode))
}

export function getUserClaims(userId: string): Claim[] {
  return getCollection('claims').filter((c) => c.userId === userId)
}

export function getBusinessClaims(businessId: string): Claim[] {
  return getCollection('claims').filter((c) => c.businessId === businessId)
}

/** Claim an offer: enforces the rules, stores the claim, bumps the offer count. */
export function createClaim(userId: string, offerId: string): ClaimAttempt {
  const offers = getCollection('offers')
  const offer = offers.find((o) => o.id === offerId)
  if (!offer) return { ok: false, error: 'That offer could not be found.' }

  const claims = getCollection('claims')
  const rule = canClaim(offer, claims.filter((c) => c.userId === userId))
  if (!rule.ok) return { ok: false, error: rule.error }

  const claim = buildClaim(userId, offer, claims.map((c) => c.claimCode))
  updateCollection('claims', [...claims, claim])
  updateCollection(
    'offers',
    offers.map((o) => (o.id === offer.id ? { ...o, currentClaims: o.currentClaims + 1 } : o)),
  )
  return { ok: true, claim }
}

/** Look up a claim by code, validating the format and existence first. */
export function validateClaimCode(code: string): CodeLookup {
  if (!isValidClaimCodeFormat(code)) {
    return { valid: false, reason: 'Use the format PING-#### (four digits).' }
  }
  const normalised = normaliseClaimCode(code)
  const claim = getCollection('claims').find((c) => c.claimCode === normalised)
  if (!claim) return { valid: false, reason: 'This claim code does not exist or is not active.' }
  return { valid: true, claim }
}

/** Redeem a claim code on behalf of a business. */
export function redeemClaim(code: string, businessId: string): ClaimAttempt {
  const lookup = validateClaimCode(code)
  if (!lookup.valid) return { ok: false, error: lookup.reason }

  const offer = getCollection('offers').find((o) => o.id === lookup.claim.offerId)
  if (!offer) return { ok: false, error: 'That offer could not be found.' }

  const rule = validateRedemption(lookup.claim, offer, businessId)
  if (!rule.ok) return { ok: false, error: rule.error }

  const redeemed: Claim = {
    ...lookup.claim,
    status: 'redeemed',
    redeemedAt: new Date().toISOString(),
  }
  updateCollection(
    'claims',
    getCollection('claims').map((c) => (c.id === redeemed.id ? redeemed : c)),
  )
  return { ok: true, claim: redeemed }
}

/** Cancel an active claim and release its slot on the offer. */
export function cancelClaim(claimId: string): ClaimAttempt {
  const claims = getCollection('claims')
  const claim = claims.find((c) => c.id === claimId)
  if (!claim) return { ok: false, error: 'That claim could not be found.' }
  if (claim.status !== 'active') return { ok: false, error: 'Only active claims can be cancelled.' }

  const cancelled: Claim = { ...claim, status: 'cancelled' }
  updateCollection('claims', claims.map((c) => (c.id === claimId ? cancelled : c)))
  updateCollection(
    'offers',
    getCollection('offers').map((o) =>
      o.id === claim.offerId ? { ...o, currentClaims: Math.max(0, o.currentClaims - 1) } : o,
    ),
  )
  return { ok: true, claim: cancelled }
}

/** Sweep active claims whose expiry has passed into the expired state. */
export function expireOldClaims(now: Date = new Date()): number {
  const claims = getCollection('claims')
  let expiredCount = 0
  const next = claims.map((c) => {
    if (c.status === 'active' && new Date(c.expiresAt) < now) {
      expiredCount += 1
      return { ...c, status: 'expired' as const }
    }
    return c
  })
  if (expiredCount > 0) updateCollection('claims', next)
  return expiredCount
}
