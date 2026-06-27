/**
 * Central configuration constants referenced across the app: ranking weights,
 * minimum budgets, related-category mappings, and per-feature guard rails.
 * Single source of truth so these magic numbers aren't scattered.
 */

import type { BusinessCategory, NeedType } from "../models";

/**
 * OfferRank weighting (section 13.1). Weights sum to 1.0; each subscore is 0–100,
 * so the final weighted score is also 0–100.
 */
export const OFFER_RANK_WEIGHTS = {
  category: 0.25,
  budget: 0.2,
  distance: 0.15,
  rating: 0.15,
  time: 0.1,
  verification: 0.1,
  preference: 0.05,
} as const;

/**
 * Minimum realistic budget per need type (section 13.2). Used by semantic
 * validation to block absurd requests like a $5 haircut. Values for need types
 * beyond the PRD's explicit table use category-consistent estimates.
 */
export const MINIMUM_BUDGET_BY_NEED_TYPE: Record<NeedType, number> = {
  lunch: 8,
  cafeStudySpot: 5,
  dessert: 5,
  dinner: 12,
  groupMeal: 15,
  quickSnack: 3,
  gift: 10,
  clothing: 10,
  books: 5,
  thrift: 5,
  schoolSupplies: 3,
  homeItem: 8,
  haircut: 20,
  salonService: 25,
  printing: 2,
  alterations: 8,
  tutoring: 15,
  cleaning: 20,
  gymTrial: 0,
  dropInClass: 5,
  sportsFacility: 10,
  personalTraining: 25,
  testPrep: 20,
  workshop: 15,
  studySpace: 0,
  phoneRepair: 40,
  laptopRepair: 50,
  bikeRepair: 15,
  clothingRepair: 8,
  escapeRoom: 20,
  arcade: 5,
  movieActivity: 10,
  localEvent: 0,
  groupHangout: 10,
};

/**
 * Categories considered "related" for the category subscore. A request in one
 * category still partially matches offers in a related category (score 60).
 */
export const RELATED_CATEGORIES: Record<BusinessCategory, BusinessCategory[]> = {
  food: ["entertainment"],
  retail: ["services"],
  services: ["retail", "repair"],
  fitness: ["education"],
  education: ["services", "fitness"],
  repair: ["services"],
  entertainment: ["food"],
};

/** Claim and request guard rails (sections 10.5, 13.2). */
export const MAX_ACTIVE_CLAIMS = 3;
export const MAX_REQUEST_WINDOW_DAYS = 7;

/** Review text bounds (section 10.7). */
export const REVIEW_TEXT_MIN = 10;
export const REVIEW_TEXT_MAX = 300;

/** Optional note bound (section 10.2). */
export const NOTE_MAX = 120;

/** Max attempts for the distorted-image human check (section 10.3). */
export const VERIFICATION_MAX_ATTEMPTS = 3;
