import { describe, it, expect } from 'vitest'
import { buildSeedDatabase } from '@/data/seedDatabase'
import {
  buildUserReport,
  calculateConversionRate,
  calculateEstimatedSavings,
  groupClaimsByCategory,
} from '@/services/reportService'

const db = buildSeedDatabase()

describe('report calculations', () => {
  it('conversion rate = redemptions ÷ views (guards divide-by-zero)', () => {
    expect(calculateConversionRate(100, 25)).toBe(0.25)
    expect(calculateConversionRate(0, 5)).toBe(0)
  })

  it('estimated savings sums originalPrice − price for redeemed claims', () => {
    const lucasClaims = db.claims.filter((c) => c.userId === 'u_lucas')
    expect(calculateEstimatedSavings(lucasClaims, db.offers)).toBe(28.5)
  })
})

describe('buildUserReport for the demo customer', () => {
  const report = buildUserReport(db, 'u_lucas')

  it('counts all of Lucas’ claims and redemptions', () => {
    expect(report.totalClaimed).toBe(8)
    expect(report.totalRedeemed).toBe(3)
  })
  it('matches the $28.50 saved shown on the home dashboard', () => {
    expect(report.estimatedSavings).toBe(28.5)
  })
  it('counts distinct supported businesses from redemptions', () => {
    expect(report.businessesSupported).toBe(3)
  })
  it('identifies Food as the favourite category', () => {
    expect(report.favoriteCategory).toBe('food')
    expect(groupClaimsByCategory(db.claims.filter((c) => c.userId === 'u_lucas'), db.businesses)[0].category).toBe('food')
  })
})
