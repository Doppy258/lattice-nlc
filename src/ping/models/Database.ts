import type { User } from './User'
import type { Business } from './Business'
import type { Offer } from './Offer'
import type { PingRequest } from './PingRequest'
import type { Claim } from './Claim'
import type { Review } from './Review'
import type { SavedBusiness, SavedOffer } from './Saved'
import type { PersonalRanking } from './Ranking'
import type { Location } from './Location'

/**
 * The entire app state, persisted as one JSON blob in localStorage. Every
 * collection is a plain array of typed records — simple to seed, reset, and
 * reason about. `version` lets us invalidate stale shapes on schema changes.
 */
export type Database = {
  version: number
  users: User[]
  locations: Location[]
  businesses: Business[]
  offers: Offer[]
  pingRequests: PingRequest[]
  claims: Claim[]
  reviews: Review[]
  savedBusinesses: SavedBusiness[]
  savedOffers: SavedOffer[]
  rankings: PersonalRanking[]
}

/** Names of the array collections (everything in Database except `version`). */
export type CollectionName = Exclude<keyof Database, 'version'>

/** Which side of the app the current session is acting as. */
export type AppMode = 'customer' | 'business' | 'admin'

/**
 * The mock "logged-in" context. Persisted separately from the data so that
 * resetting demo data doesn't log you out. `verifiedHuman` mirrors the mock
 * anti-bot check completed before matching.
 */
export type Session = {
  userId: string
  mode: AppMode
  /** Active business context for owners (which business they're managing). */
  businessId?: string
  verifiedHuman: boolean
}
