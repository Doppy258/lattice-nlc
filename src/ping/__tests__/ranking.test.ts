import { describe, it, expect } from 'vitest'
import {
  startBinaryInsertion,
  processComparison,
  insertBusinessAtIndex,
} from '@/services/rankingService'
import type { PersonalRanking } from '@/models'

const ranked = ['a', 'b', 'c', 'd', 'e']
const rankings: PersonalRanking[] = [
  { userId: 'u', category: 'food', needType: 'lunch', rankedBusinessIds: ranked, updatedAt: '' },
]

describe('binary insertion', () => {
  it('finishes immediately for an empty list', () => {
    const s = startBinaryInsertion('u', 'z', 'food', 'dinner', [])
    expect(s.done).toBe(true)
    expect(s.insertIndex).toBe(0)
  })

  it('narrows to the correct index via comparisons', () => {
    let s = startBinaryInsertion('u', 'z', 'food', 'lunch', rankings)
    expect(s.compareBusinessId).toBe('c') // midpoint of 5 items

    s = processComparison(s, 'better') // z beats c → search upper half
    expect(s.compareBusinessId).toBe('b')

    s = processComparison(s, 'worse') // z worse than b → settle
    expect(s.done).toBe(true)
    expect(s.insertIndex).toBe(2)
    expect(s.comparisons).toBe(2)

    expect(insertBusinessAtIndex(ranked, 'z', s.insertIndex!)).toEqual(['a', 'b', 'z', 'c', 'd', 'e'])
  })

  it('inserting a business removes any prior occurrence', () => {
    expect(insertBusinessAtIndex(['a', 'b', 'c'], 'b', 0)).toEqual(['b', 'a', 'c'])
  })
})
