import type { BusinessCategory } from './Business'

/** Which side of the marketplace a person acts as. */
export type UserRole = 'customer' | 'businessOwner' | 'admin'

/**
 * Stored preferences that personalise matching and the home dashboard.
 * `savedBusinessIds` / `savedOfferIds` are denormalised here for fast reads;
 * the authoritative save records live in the SavedBusiness / SavedOffer tables.
 */
export type UserPreferences = {
  preferredCategories: BusinessCategory[]
  maxDefaultDistanceKm: number
  studentDiscountPreferred: boolean
  accessibilityNeeds: string[]
  savedBusinessIds: string[]
  savedOfferIds: string[]
}

export type User = {
  id: string
  name: string
  email: string
  role: UserRole
  /** References a seeded Location (home / school origin for distance math). */
  homeLocationId: string
  verified: boolean
  createdAt: string
  preferences: UserPreferences
}
