import type { BusinessCategory, NeedType, PersonalRanking } from '@/models'
import { getCollection, updateCollection } from './storageService'
import { nowIso } from '@/utils/dateTime'

/**
 * rankingService — personal rankings via pairwise comparison + binary insertion.
 *
 * Placing a business into a ranked list of n takes ~log₂(n) comparisons instead
 * of n. The insertion is modelled as an immutable session the UI advances one
 * answer at a time, then commits — keeping the algorithm pure and testable.
 */

export type ComparisonAnswer = 'better' | 'worse' | 'same' | 'skip'

export type InsertionSession = {
  userId: string
  category: BusinessCategory
  needType?: NeedType
  newBusinessId: string
  /** The current ranked list (index 0 = favourite), excluding the new business. */
  ranked: string[]
  lo: number
  hi: number
  /** Business id to compare the new one against, or null when finished. */
  compareBusinessId: string | null
  done: boolean
  insertIndex: number | null
  comparisons: number
}

const mid = (lo: number, hi: number): number => Math.floor((lo + hi) / 2)

/** Find a user's ranking for a category (and optional need type). */
export function getRanking(
  userId: string,
  category: BusinessCategory,
  needType: NeedType | undefined,
  rankings: PersonalRanking[],
): PersonalRanking | undefined {
  return rankings.find(
    (r) => r.userId === userId && r.category === category && r.needType === needType,
  )
}

/**
 * Begin inserting a business. If the list is empty (or only holds the business
 * already), the session finishes immediately; otherwise it points at the
 * midpoint for the first "better or worse?" comparison.
 */
export function startBinaryInsertion(
  userId: string,
  newBusinessId: string,
  category: BusinessCategory,
  needType: NeedType | undefined,
  rankings: PersonalRanking[],
): InsertionSession {
  const existing = getRanking(userId, category, needType, rankings)
  const ranked = (existing?.rankedBusinessIds ?? []).filter((id) => id !== newBusinessId)

  const base: InsertionSession = {
    userId,
    category,
    needType,
    newBusinessId,
    ranked,
    lo: 0,
    hi: ranked.length,
    compareBusinessId: null,
    done: false,
    insertIndex: null,
    comparisons: 0,
  }

  if (ranked.length === 0) {
    return { ...base, done: true, insertIndex: 0 }
  }
  const m = mid(0, ranked.length)
  return { ...base, compareBusinessId: ranked[m] }
}

/**
 * Advance the binary search by one answer. "better" means the new business
 * beats the one shown (it belongs higher / nearer index 0).
 */
export function processComparison(session: InsertionSession, answer: ComparisonAnswer): InsertionSession {
  if (session.done) return session

  let { lo, hi } = session
  const m = mid(lo, hi)
  const comparisons = session.comparisons + 1

  if (answer === 'skip') {
    return { ...session, comparisons, done: true, insertIndex: lo, compareBusinessId: null }
  }
  if (answer === 'better') {
    hi = m
  } else {
    // "worse" and "same" both place the new business after the compared one.
    lo = m + 1
  }

  if (lo >= hi) {
    return { ...session, lo, hi, comparisons, done: true, insertIndex: lo, compareBusinessId: null }
  }
  return { ...session, lo, hi, comparisons, compareBusinessId: session.ranked[mid(lo, hi)] }
}

/** Insert a business id at an index, removing any prior occurrence (pure). */
export function insertBusinessAtIndex(ranked: string[], businessId: string, index: number): string[] {
  const without = ranked.filter((id) => id !== businessId)
  const clamped = Math.max(0, Math.min(index, without.length))
  return [...without.slice(0, clamped), businessId, ...without.slice(clamped)]
}

/** Persist the result of a finished insertion session (upserts the ranking). */
export function commitInsertion(session: InsertionSession): PersonalRanking | null {
  if (!session.done || session.insertIndex === null) return null

  const rankings = getCollection('rankings')
  const existing = getRanking(session.userId, session.category, session.needType, rankings)
  const nextIds = insertBusinessAtIndex(
    existing?.rankedBusinessIds ?? session.ranked,
    session.newBusinessId,
    session.insertIndex,
  )

  const updated: PersonalRanking = {
    userId: session.userId,
    category: session.category,
    needType: session.needType,
    rankedBusinessIds: nextIds,
    updatedAt: nowIso(),
  }

  const exists = rankings.some(
    (r) => r.userId === session.userId && r.category === session.category && r.needType === session.needType,
  )
  updateCollection(
    'rankings',
    exists
      ? rankings.map((r) =>
          r.userId === session.userId && r.category === session.category && r.needType === session.needType
            ? updated
            : r,
        )
      : [...rankings, updated],
  )
  return updated
}

/** Convenience: all of a user's rankings. */
export function getUserRankings(userId: string): PersonalRanking[] {
  return getCollection('rankings').filter((r) => r.userId === userId)
}
