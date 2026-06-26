/**
 * User — account model shared across customer, businessOwner, and admin roles.
 * Location is set via browser geolocation (user-initiated) and powers every
 * distance-based feature. Preferences control default filters, saved items, and
 * accessibility signals.
 */
import type { BusinessCategory, GeoPoint } from "./Business";

export type UserRole = "customer" | "businessOwner" | "admin";

export type UserPreferences = {
  preferredCategories: BusinessCategory[];
  maxDefaultDistanceKm: number;
  studentDiscountPreferred: boolean;
  accessibilityNeeds: string[];
  savedBusinessIds: string[];
  savedOfferIds: string[];
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  /** The user's actual geo coordinates, set by browser geolocation. */
  location: GeoPoint | null;
  verified: boolean;
  createdAt: string;
  preferences: UserPreferences;
  /** Whether the user has completed the post-signup onboarding flow. */
  onboarded: boolean;
};
