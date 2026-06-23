import type { BusinessCategory } from './Business'

/**
 * The specific need a user expresses. Need types are scoped to a category in
 * the UI (e.g. "Food" surfaces lunch / dessert / dinner …) and each one has a
 * realistic minimum budget used by semantic validation.
 */
export type NeedType =
  | 'lunch'
  | 'cafeStudySpot'
  | 'dessert'
  | 'dinner'
  | 'groupMeal'
  | 'gift'
  | 'clothing'
  | 'books'
  | 'thrift'
  | 'schoolSupplies'
  | 'haircut'
  | 'printing'
  | 'alterations'
  | 'tutoring'
  | 'gymTrial'
  | 'phoneRepair'
  | 'laptopRepair'
  | 'escapeRoom'
  | 'localEvent'
  | 'groupHangout'

/** Lifecycle of a request as it moves from builder → matched results. */
export type PingStatus = 'draft' | 'submitted' | 'matched' | 'expired'

export type PingRequest = {
  id: string
  userId: string
  category: BusinessCategory
  needType: NeedType
  budgetMin?: number
  budgetMax?: number
  distanceKm: number
  /** ISO timestamps bounding the window the user wants to redeem in. */
  timeStart: string
  timeEnd: string
  /** Free-form preference keys (e.g. "studentDiscount", "openNow"). */
  preferences: string[]
  optionalNote?: string
  /** True once the mock anti-bot verification has been completed. */
  verifiedHuman: boolean
  status: PingStatus
  createdAt: string
}
