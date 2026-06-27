/**
 * Assembles the complete bootstrapped demo dataset — users, businesses, offers,
 * claims, reviews, rankings, saves — all keyed off a single `now` timestamp so
 * relative dates (expiry, recency) stay consistent no matter when the demo runs.
 * The caller (`buildSeedData`) is invoked once at app startup to hydrate the
 * in-memory store when no Supabase backend is connected.
 */
import type { AppData, SavedBusiness, SavedOffer } from "../models";
import { MS_PER_DAY } from "../utils/dateTime";
import { seedUsers, DEFAULT_USER_ID } from "./seedUsers";
import { seedBusinesses } from "./seedBusinesses";
import { buildSeedOffers } from "./seedOffers";
import { buildSeedClaims } from "./seedClaims";
import { buildSeedReviews } from "./seedReviews";
import { buildSeedRankings } from "./seedRankings";

export { DEFAULT_USER_ID };

/** Saved/bookmarked items, mirroring the id lists on the seeded users. */
function buildSeedSaves(now: Date): {
  savedBusinesses: SavedBusiness[];
  savedOffers: SavedOffer[];
} {
  const at = (d: number) => new Date(now.getTime() - d * MS_PER_DAY).toISOString();
  return {
    savedBusinesses: [
      { userId: "user_lucas", businessId: "biz_mitierra", savedAt: at(3), tags: [] },
      { userId: "user_lucas", businessId: "biz_twig", savedAt: at(6), tags: ["gifts"] },
      { userId: "user_maya", businessId: "biz_rosarios", savedAt: at(1), tags: [] },
    ],
    savedOffers: [
      { userId: "user_lucas", offerId: "offer_mitierra_lunch", savedAt: at(2) },
    ],
  };
}

/**
 * Produces a complete, internally-consistent snapshot of seeded demo data.
 * All time-relative records are built from `now` so the app behaves correctly
 * whenever the demo is run.
 */
export function buildSeedData(now: Date = new Date()): AppData {
  const { savedBusinesses, savedOffers } = buildSeedSaves(now);
  return {
    users: seedUsers,
    businesses: seedBusinesses,
    offers: buildSeedOffers(now),
    requests: [],
    claims: buildSeedClaims(now),
    reviews: buildSeedReviews(now),
    rankings: buildSeedRankings(now),
    savedBusinesses,
    savedOffers,
  };
}
