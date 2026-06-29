import type { BusinessCategory } from "./Business";
import type { NeedType } from "./PingRequest";

/**
 * A user's personal ranking of businesses within a category (and optionally a
 * specific need type). The order of `rankedBusinessIds` is the ranking itself;
 * index 0 is the user's top pick. Built via binary insertion in rankingService.
 */
export type PersonalRanking = {
  userId: string;
  category: BusinessCategory;
  needType?: NeedType;
  rankedBusinessIds: string[];
  /**
   * Manual tier placements (businessId → tier id such as "SSS" or "F") set by
   * dragging a tile in the tier-list view. When present, an entry overrides the
   * rating-derived band for that business. Persisted in the local snapshot only;
   * the Supabase `rankings` row mapper ignores it, so it never reaches the DB.
   */
  tierOverrides?: Record<string, string>;
  updatedAt: string;
};
