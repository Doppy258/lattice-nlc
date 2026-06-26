/** Barrel export for all domain models, plus the persisted store shape. */
export type {
  UserRole,
  UserPreferences,
  User,
} from "./User";
export type {
  BusinessCategory,
  GeoPoint,
  BusinessHours,
  Business,
} from "./Business";
export type { OfferType, DiscountKind, Offer, ScoreBreakdown, MatchResult } from "./Offer";
export type { NeedType, PingRequestStatus, PingRequest } from "./PingRequest";
export type { ClaimStatus, Claim } from "./Claim";
export type { Review, ReviewTag } from "./Review";
export { REVIEW_TAGS } from "./Review";
export type { PersonalRanking } from "./Ranking";
export type { SavedBusiness, SavedOffer } from "./Saved";
export type {
  ReportFilters,
  SeriesPoint,
  UserReport,
  BusinessReport,
} from "./Report";

import type { User } from "./User";
import type { Business } from "./Business";
import type { Offer } from "./Offer";
import type { PingRequest } from "./PingRequest";
import type { Claim } from "./Claim";
import type { Review } from "./Review";
import type { PersonalRanking } from "./Ranking";
import type { SavedBusiness, SavedOffer } from "./Saved";

/**
 * The complete persisted application state. Every collection is an array of
 * typed objects, which keeps storage, seeding, and reset logic uniform.
 */
export type AppData = {
  users: User[];
  businesses: Business[];
  offers: Offer[];
  requests: PingRequest[];
  claims: Claim[];
  reviews: Review[];
  rankings: PersonalRanking[];
  savedBusinesses: SavedBusiness[];
  savedOffers: SavedOffer[];
  /** Name of the collections, used by getCollection/updateCollection. */
};

export type CollectionName = keyof AppData;
