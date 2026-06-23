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
  updatedAt: string;
};
