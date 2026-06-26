/**
 * rankingService - binary insertion ranking system.
 * Purpose: Enables pairwise preference comparisons to build a personalised
 * ranked list of businesses per category (and optional need type). Uses
 * binary insertion so each new business requires O(log n) comparisons.
 * Rankings are stored as PersonalRanking records and merged immutably.
 * Key exports: startBinaryInsertion, processComparison, insertBusinessAtIndex, upsertRanking, getRanking
 */
import type { BusinessCategory, NeedType, PersonalRanking } from "../models";

export type ComparisonAnswer = "better" | "worse" | "same" | "skip";

/**
 * Tracks an in-progress binary insertion of one business into a user's ranked
 * list for a category. `lo`/`hi` bound the candidate insertion range; the user
 * compares the new business against `compareToId` until the range collapses.
 */
export type InsertionSession = {
  userId: string;
  category: BusinessCategory;
  needType?: NeedType;
  list: string[];
  newBusinessId: string;
  lo: number;
  hi: number;
  comparisons: number;
  /** Id to compare against next, or null when the insertion point is known. */
  compareToId: string | null;
  /** Final insertion index, set once the session is done. */
  insertIndex: number | null;
};

export function getRanking(
  userId: string,
  category: BusinessCategory,
  needType: NeedType | undefined,
  rankings: PersonalRanking[]
): PersonalRanking {
  const found = rankings.find(
    (r) => r.userId === userId && r.category === category && r.needType === needType
  );
  return (
    found ?? {
      userId,
      category,
      needType,
      rankedBusinessIds: [],
      updatedAt: new Date().toISOString(),
    }
  );
}

function nextStep(session: InsertionSession): InsertionSession {
  if (session.lo >= session.hi) {
    return { ...session, compareToId: null, insertIndex: session.lo };
  }
  const mid = (session.lo + session.hi) >> 1;
  return { ...session, compareToId: session.list[mid], insertIndex: null };
}

/** Begins inserting `newBusinessId` into the user's ranking for a category. */
export function startBinaryInsertion(
  userId: string,
  newBusinessId: string,
  category: BusinessCategory,
  needType: NeedType | undefined,
  rankings: PersonalRanking[]
): InsertionSession {
  const ranking = getRanking(userId, category, needType, rankings);
  // Compare against the existing order, excluding the business itself.
  const list = ranking.rankedBusinessIds.filter((id) => id !== newBusinessId);
  const base: InsertionSession = {
    userId,
    category,
    needType,
    list,
    newBusinessId,
    lo: 0,
    hi: list.length,
    comparisons: 0,
    compareToId: null,
    insertIndex: null,
  };
  return nextStep(base);
}

/**
 * Applies a comparison answer (binary insertion). "Better" searches the upper
 * half, "worse" the lower half, "same" anchors just below the pivot, and
 * "skip" stops and inserts at the current best-guess index.
 */
export function processComparison(
  session: InsertionSession,
  answer: ComparisonAnswer
): InsertionSession {
  if (session.compareToId === null) return session;
  const mid = (session.lo + session.hi) >> 1;
  let next: InsertionSession = { ...session, comparisons: session.comparisons + 1 };

  switch (answer) {
    case "better":
      next = { ...next, hi: mid };
      break;
    case "worse":
      next = { ...next, lo: mid + 1 };
      break;
    case "same":
      return { ...next, lo: mid + 1, hi: mid + 1, compareToId: null, insertIndex: mid + 1 };
    case "skip":
      return { ...next, compareToId: null, insertIndex: session.lo };
  }
  return nextStep(next);
}

/** Returns a new ranking with `businessId` inserted at `index` (deduped). */
export function insertBusinessAtIndex(
  ranking: PersonalRanking,
  businessId: string,
  index: number
): PersonalRanking {
  const without = ranking.rankedBusinessIds.filter((id) => id !== businessId);
  const clamped = Math.max(0, Math.min(index, without.length));
  const next = [...without.slice(0, clamped), businessId, ...without.slice(clamped)];
  return { ...ranking, rankedBusinessIds: next, updatedAt: new Date().toISOString() };
}

/** Inserts or replaces a ranking within the collection (immutable). */
export function upsertRanking(
  rankings: PersonalRanking[],
  ranking: PersonalRanking
): PersonalRanking[] {
  const idx = rankings.findIndex(
    (r) => r.userId === ranking.userId && r.category === ranking.category && r.needType === ranking.needType
  );
  if (idx === -1) return [...rankings, ranking];
  const copy = rankings.slice();
  copy[idx] = ranking;
  return copy;
}
