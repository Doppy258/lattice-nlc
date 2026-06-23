import type { Database } from '@/models'
import { buildSeedLocations } from './seedLocations'
import { buildSeedUsers } from './seedUsers'
import { buildSeedBusinesses } from './seedBusinesses'
import { buildSeedOffers } from './seedOffers'
import { buildSeedReviews } from './seedReviews'
import { buildSeedClaims } from './seedClaims'
import { buildSeedRankings } from './seedRankings'
import { buildSeedSaved } from './seedSaved'
import { buildSeedPingRequests } from './seedPingRequests'

/**
 * Bump this when the Database shape changes — storageService will discard a
 * persisted blob whose version doesn't match and re-seed from scratch.
 */
export const DB_VERSION = 1

/**
 * Assemble a complete, internally-consistent seed database. All time-relative
 * data is anchored to `now` so the demo always looks fresh.
 */
export function buildSeedDatabase(now: Date = new Date()): Database {
  const saved = buildSeedSaved(now)
  return {
    version: DB_VERSION,
    users: buildSeedUsers(now),
    locations: buildSeedLocations(),
    businesses: buildSeedBusinesses(now),
    offers: buildSeedOffers(now),
    pingRequests: buildSeedPingRequests(now),
    claims: buildSeedClaims(now),
    reviews: buildSeedReviews(now),
    savedBusinesses: saved.savedBusinesses,
    savedOffers: saved.savedOffers,
    rankings: buildSeedRankings(now),
  }
}
