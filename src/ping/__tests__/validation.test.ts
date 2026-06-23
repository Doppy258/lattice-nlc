import { describe, it, expect } from 'vitest'
import {
  validateBudgetForNeedType,
  validateTimeWindow,
  validateOptionalNote,
  getRequestQuality,
  type PingDraft,
} from '@/services/requestValidationService'
import { isoFrom } from '@/utils/dateTime'

const now = new Date()

describe('validateBudgetForNeedType', () => {
  it('blocks a budget below the need-type minimum', () => {
    expect(validateBudgetForNeedType('haircut', 5).valid).toBe(false)
  })
  it('accepts a realistic budget', () => {
    expect(validateBudgetForNeedType('haircut', 25).valid).toBe(true)
    expect(validateBudgetForNeedType('lunch', 12).valid).toBe(true)
  })
  it('treats "no budget" as always valid', () => {
    expect(validateBudgetForNeedType('lunch', undefined).valid).toBe(true)
  })
})

describe('validateTimeWindow', () => {
  it('rejects an end before the start', () => {
    const start = isoFrom(now, { hours: 3 })
    const end = isoFrom(now, { hours: 1 })
    expect(validateTimeWindow(start, end).valid).toBe(false)
  })
  it('rejects a window longer than 7 days', () => {
    expect(validateTimeWindow(isoFrom(now, { hours: 1 }), isoFrom(now, { days: 9 })).valid).toBe(false)
  })
  it('accepts a sensible upcoming window', () => {
    expect(validateTimeWindow(isoFrom(now, { hours: 1 }), isoFrom(now, { hours: 3 })).valid).toBe(true)
  })
})

describe('validateOptionalNote', () => {
  it('allows an empty note', () => {
    expect(validateOptionalNote(undefined).valid).toBe(true)
  })
  it('rejects links and spam', () => {
    expect(validateOptionalNote('see http://x.com').valid).toBe(false)
    expect(validateOptionalNote('aaaaaaaaaa spam').valid).toBe(false)
  })
  it('accepts a normal note', () => {
    expect(validateOptionalNote('Need outlets and a quiet table').valid).toBe(true)
  })
})

describe('getRequestQuality', () => {
  const strongDraft: PingDraft = {
    category: 'food',
    needType: 'lunch',
    budgetMax: 15,
    distanceKm: 3,
    timeStart: isoFrom(now, { hours: 1 }),
    timeEnd: isoFrom(now, { hours: 3 }),
    preferences: ['studentDiscount'],
  }

  it('rates a complete request as strong', () => {
    expect(getRequestQuality(strongDraft).quality).toBe('strong')
  })
  it('rates a request missing a budget as weak', () => {
    expect(getRequestQuality({ ...strongDraft, budgetMax: undefined }).quality).toBe('weak')
  })
  it('rates a request missing the category as invalid', () => {
    expect(getRequestQuality({ ...strongDraft, category: undefined }).quality).toBe('invalid')
  })
})
