import { describe, it, expect } from 'vitest'
import { buildSeedDatabase } from '@/data/seedDatabase'
import { canClaim, validateRedemption, buildClaim } from '@/services/claimService'
import { isValidClaimCodeFormat } from '@/utils/ids'
import type { Claim, Offer } from '@/models'

const db = buildSeedDatabase()
const liveOffer = db.offers.find((o) => o.id === 'o_bowlco_build') as Offer
const now = new Date()

const activeClaim = (offerId: string): Claim => ({
  id: `c_${offerId}`,
  userId: 'u_test',
  offerId,
  businessId: 'b_x',
  claimCode: 'PING-0001',
  status: 'active',
  createdAt: now.toISOString(),
  expiresAt: new Date(now.getTime() + 86_400_000).toISOString(),
})

describe('canClaim', () => {
  it('allows claiming a fresh, available offer', () => {
    expect(canClaim(liveOffer, [], now).ok).toBe(true)
  })
  it('blocks an expired/inactive offer', () => {
    expect(canClaim({ ...liveOffer, active: false }, [], now).ok).toBe(false)
  })
  it('blocks a fully-claimed offer', () => {
    expect(canClaim({ ...liveOffer, currentClaims: liveOffer.maxClaims }, [], now).ok).toBe(false)
  })
  it('blocks claiming the same offer twice', () => {
    expect(canClaim(liveOffer, [activeClaim(liveOffer.id)], now).ok).toBe(false)
  })
  it('blocks more than 3 active claims', () => {
    const three = [activeClaim('o_a'), activeClaim('o_b'), activeClaim('o_c')]
    expect(canClaim(liveOffer, three, now).ok).toBe(false)
  })
})

describe('validateRedemption', () => {
  const claim = activeClaim(liveOffer.id)

  it('accepts an active claim at the right business', () => {
    expect(validateRedemption(claim, liveOffer, liveOffer.businessId, now).ok).toBe(true)
  })
  it('rejects a claim at another business', () => {
    expect(validateRedemption(claim, liveOffer, 'b_other', now).ok).toBe(false)
  })
  it('rejects an already-redeemed claim', () => {
    expect(validateRedemption({ ...claim, status: 'redeemed' }, liveOffer, liveOffer.businessId, now).ok).toBe(false)
  })
  it('rejects an expired claim', () => {
    const expired = { ...claim, expiresAt: new Date(now.getTime() - 1000).toISOString() }
    expect(validateRedemption(expired, liveOffer, liveOffer.businessId, now).ok).toBe(false)
  })
})

describe('buildClaim', () => {
  it('mints a PING-#### code and links to the offer’s business', () => {
    const claim = buildClaim('u_lucas', liveOffer, ['PING-0001'], now)
    expect(isValidClaimCodeFormat(claim.claimCode)).toBe(true)
    expect(claim.status).toBe('active')
    expect(claim.businessId).toBe(liveOffer.businessId)
  })
})
