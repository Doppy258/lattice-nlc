import type { User } from '@/models'
import { getCollection, updateCollection } from './storageService'
import { nowIso } from '@/utils/dateTime'

/**
 * userService — profile lookups and bookmark toggling.
 *
 * Saves are stored in the SavedBusiness / SavedOffer tables (the source of
 * truth) and mirrored onto `user.preferences` so reads stay cheap. Both are
 * kept in sync on every toggle.
 */

export function getUserById(userId: string): User | undefined {
  return getCollection('users').find((u) => u.id === userId)
}

export function isBusinessSaved(userId: string, businessId: string): boolean {
  return getCollection('savedBusinesses').some(
    (s) => s.userId === userId && s.businessId === businessId,
  )
}

export function isOfferSaved(userId: string, offerId: string): boolean {
  return getCollection('savedOffers').some((s) => s.userId === userId && s.offerId === offerId)
}

/** Recompute the denormalised id arrays on the user from the save tables. */
function syncSavedArrays(userId: string): void {
  const savedBusinessIds = getCollection('savedBusinesses')
    .filter((s) => s.userId === userId)
    .map((s) => s.businessId)
  const savedOfferIds = getCollection('savedOffers')
    .filter((s) => s.userId === userId)
    .map((s) => s.offerId)

  updateCollection(
    'users',
    getCollection('users').map((u) =>
      u.id === userId
        ? { ...u, preferences: { ...u.preferences, savedBusinessIds, savedOfferIds } }
        : u,
    ),
  )
}

/** Toggle a saved business; returns the new saved state. */
export function toggleSavedBusiness(userId: string, businessId: string): boolean {
  const saved = getCollection('savedBusinesses')
  const exists = saved.some((s) => s.userId === userId && s.businessId === businessId)
  updateCollection(
    'savedBusinesses',
    exists
      ? saved.filter((s) => !(s.userId === userId && s.businessId === businessId))
      : [...saved, { userId, businessId, savedAt: nowIso(), tags: [] }],
  )
  syncSavedArrays(userId)
  return !exists
}

/** Toggle a saved offer; returns the new saved state. */
export function toggleSavedOffer(userId: string, offerId: string): boolean {
  const saved = getCollection('savedOffers')
  const exists = saved.some((s) => s.userId === userId && s.offerId === offerId)
  updateCollection(
    'savedOffers',
    exists
      ? saved.filter((s) => !(s.userId === userId && s.offerId === offerId))
      : [...saved, { userId, offerId, savedAt: nowIso() }],
  )
  syncSavedArrays(userId)
  return !exists
}
