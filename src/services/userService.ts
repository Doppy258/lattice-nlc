import type { AppData, User } from "../models";

export function getUserById(id: string, users: User[]): User | undefined {
  return users.find((u) => u.id === id);
}

export function getCustomers(users: User[]): User[] {
  return users.filter((u) => u.role === "customer");
}

export function getBusinessOwners(users: User[]): User[] {
  return users.filter((u) => u.role === "businessOwner");
}

export function isBusinessSaved(user: User | undefined, businessId: string): boolean {
  return !!user?.preferences.savedBusinessIds.includes(businessId);
}

export function isOfferSaved(user: User | undefined, offerId: string): boolean {
  return !!user?.preferences.savedOfferIds.includes(offerId);
}

function replaceUser(users: User[], updated: User): User[] {
  return users.map((u) => (u.id === updated.id ? updated : u));
}

/**
 * Toggles a saved business for a user, keeping both the boolean id list (on
 * preferences) and the timestamped savedBusinesses collection in sync.
 */
export function toggleSavedBusiness(
  data: AppData,
  userId: string,
  businessId: string,
  now = new Date()
): AppData {
  const user = getUserById(userId, data.users);
  if (!user) return data;
  const saved = user.preferences.savedBusinessIds.includes(businessId);
  const savedBusinessIds = saved
    ? user.preferences.savedBusinessIds.filter((id) => id !== businessId)
    : [...user.preferences.savedBusinessIds, businessId];
  const updatedUser: User = {
    ...user,
    preferences: { ...user.preferences, savedBusinessIds },
  };
  const savedBusinesses = saved
    ? data.savedBusinesses.filter((s) => !(s.userId === userId && s.businessId === businessId))
    : [...data.savedBusinesses, { userId, businessId, savedAt: now.toISOString(), tags: [] }];
  return { ...data, users: replaceUser(data.users, updatedUser), savedBusinesses };
}

/** Toggles a saved offer for a user (mirrors toggleSavedBusiness). */
export function toggleSavedOffer(
  data: AppData,
  userId: string,
  offerId: string,
  now = new Date()
): AppData {
  const user = getUserById(userId, data.users);
  if (!user) return data;
  const saved = user.preferences.savedOfferIds.includes(offerId);
  const savedOfferIds = saved
    ? user.preferences.savedOfferIds.filter((id) => id !== offerId)
    : [...user.preferences.savedOfferIds, offerId];
  const updatedUser: User = {
    ...user,
    preferences: { ...user.preferences, savedOfferIds },
  };
  const savedOffers = saved
    ? data.savedOffers.filter((s) => !(s.userId === userId && s.offerId === offerId))
    : [...data.savedOffers, { userId, offerId, savedAt: now.toISOString() }];
  return { ...data, users: replaceUser(data.users, updatedUser), savedOffers };
}
