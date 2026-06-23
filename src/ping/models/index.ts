/**
 * Barrel export for every domain type. Import from `@/models` everywhere so
 * call sites stay tidy: `import type { Offer, Business } from '@/models'`.
 */
export type { User, UserRole, UserPreferences } from './User'
export type {
  Business,
  BusinessCategory,
  GeoPoint,
  BusinessHours,
} from './Business'
export type { Offer, OfferType } from './Offer'
export type { PingRequest, NeedType, PingStatus } from './PingRequest'
export type { MatchResult, ScoreBreakdown } from './Match'
export type { Claim, ClaimStatus } from './Claim'
export type { Review } from './Review'
export type { SavedBusiness, SavedOffer } from './Saved'
export type { PersonalRanking } from './Ranking'
export type { Location } from './Location'
export type {
  ReportFilters,
  UserReport,
  BusinessReport,
} from './Report'
export type {
  Database,
  CollectionName,
  AppMode,
  Session,
} from './Database'
