import type { BusinessCategory } from "./Business";

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
  /** Seeded origin location used as the distance anchor for this user's Pings. */
  homeLocationId: string;
  verified: boolean;
  createdAt: string;
  preferences: UserPreferences;
  /** Whether the user has completed the post-signup onboarding flow. */
  onboarded: boolean;
};
