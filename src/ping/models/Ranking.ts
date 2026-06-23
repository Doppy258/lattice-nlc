import type { BusinessCategory } from './Business'
import type { NeedType } from './PingRequest'

/**
 * A user's personal ranking of businesses within a category (and optionally a
 * specific need type). Stored as an ordered array — index 0 is the favourite.
 * Built up via pairwise comparison + binary insertion (see rankingService).
 */
export type PersonalRanking = {
  userId: string
  category: BusinessCategory
  needType?: NeedType
  rankedBusinessIds: string[]
  updatedAt: string
}
