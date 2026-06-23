import { describe, it, expect } from 'vitest'
import { buildSeedDatabase } from '@/data/seedDatabase'
import {
  calculateCategoryScore,
  calculateBudgetScore,
  calculateRatingScore,
  calculateVerificationScore,
  distanceScoreFromKm,
  getMatchingOffers,
} from '@/services/offerMatchingService'
import type { Business, Offer, PingRequest, User } from '@/models'
import { isoFrom } from '@/utils/dateTime'

const db = buildSeedDatabase()
const lucas = db.users.find((u) => u.id === 'u_lucas') as User
const school = db.locations.find((l) => l.id === 'loc_school')!.point

const offer = (id: string) => db.offers.find((o) => o.id === id) as Offer
const business = (id: string) => db.businesses.find((b) => b.id === id) as Business

describe('subscores', () => {
  const lunchReq = { category: 'food' } as PingRequest

  it('category: exact 100, related 60, unrelated 0', () => {
    expect(calculateCategoryScore(lunchReq, offer('o_freshbowl_lunch'))).toBe(100) // food
    expect(calculateCategoryScore(lunchReq, offer('o_riddle_group'))).toBe(60) // entertainment ~ food
    expect(calculateCategoryScore(lunchReq, offer('o_sharp_studentcut'))).toBe(0) // services
  })

  it('budget: within 100, ~10% over 70, far over 0', () => {
    const biz = business('b_freshbowl')
    expect(calculateBudgetScore({ budgetMax: 15 } as PingRequest, offer('o_freshbowl_lunch'), biz)).toBe(100)
    expect(calculateBudgetScore({ budgetMax: 11 } as PingRequest, offer('o_freshbowl_lunch'), biz)).toBe(70)
    expect(calculateBudgetScore({ budgetMax: 5 } as PingRequest, offer('o_freshbowl_lunch'), biz)).toBe(30) // 4.7★ rescue
  })

  it('rating: 4.5 → 90', () => {
    expect(calculateRatingScore({ ratingAverage: 4.5 } as Business)).toBe(90)
  })

  it('distance: 0 km → 100, max → 50, beyond → 0', () => {
    expect(distanceScoreFromKm(0, 3)).toBe(100)
    expect(distanceScoreFromKm(3, 3)).toBe(50)
    expect(distanceScoreFromKm(4, 3)).toBe(0)
  })

  it('verification: verified+required 100, verified 70, unverified 40', () => {
    expect(calculateVerificationScore({ verified: true } as Business, { verificationRequired: true } as Offer)).toBe(100)
    expect(calculateVerificationScore({ verified: true } as Business, { verificationRequired: false } as Offer)).toBe(70)
    expect(calculateVerificationScore({ verified: false } as Business, { verificationRequired: false } as Offer)).toBe(40)
  })
})

describe('getMatchingOffers — the lunch demo Ping', () => {
  const now = new Date()
  const request: PingRequest = {
    id: 'req_test',
    userId: 'u_lucas',
    category: 'food',
    needType: 'lunch',
    budgetMin: 0,
    budgetMax: 15,
    distanceKm: 3,
    timeStart: isoFrom(now, { hours: 1 }),
    timeEnd: isoFrom(now, { hours: 3 }),
    preferences: ['studentDiscount', 'openNow'],
    verifiedHuman: true,
    status: 'submitted',
    createdAt: now.toISOString(),
  }

  const results = getMatchingOffers(request, db.offers, db.businesses, lucas, school, now)

  it('returns ranked matches, best first', () => {
    expect(results.length).toBeGreaterThan(0)
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score)
    }
  })

  it('top match is a nearby food offer with explanations', () => {
    const top = results[0]
    expect(business(top.businessId).category).toBe('food')
    expect(top.distanceKm).toBeLessThanOrEqual(3)
    expect(top.reasons.length).toBeGreaterThan(0)
    expect(top.score).toBeGreaterThan(60)
  })

  it('surfaces FreshBowl’s student lunch bowl among matches', () => {
    expect(results.some((r) => r.offerId === 'o_freshbowl_lunch')).toBe(true)
  })
})
