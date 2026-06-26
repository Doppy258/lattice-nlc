/**
 * Lucas's personal rankings (head-to-head leaderboards) for the 5 need types
 * called out in the PRD — lunch, cafes, haircuts, study spots, and gift shops.
 * Each ranking is a sorted list; index 0 is the top pick. Rankings are built
 * fresh from `now` so the `updatedAt` timestamp always reflects the demo time.
 */
import type { PersonalRanking } from "../models";

/**
 * Seeded personal rankings for the demo customer (Lucas) across the categories
 * called out in the PRD: lunch, cafes, haircuts, study spots, and gift shops.
 * Order is the ranking; index 0 is the top pick.
 */
export function buildSeedRankings(now: Date = new Date()): PersonalRanking[] {
  const updatedAt = now.toISOString();
  return [
    {
      userId: "user_lucas",
      category: "food",
      needType: "lunch",
      rankedBusinessIds: ["biz_freshbowl", "biz_rosas", "biz_maplenoodle"],
      updatedAt,
    },
    {
      userId: "user_lucas",
      category: "food",
      needType: "cafeStudySpot",
      rankedBusinessIds: ["biz_harbourroast", "biz_freshbowl"],
      updatedAt,
    },
    {
      userId: "user_lucas",
      category: "services",
      needType: "haircut",
      rankedBusinessIds: ["biz_sharpfade", "biz_glowroom"],
      updatedAt,
    },
    {
      userId: "user_lucas",
      category: "education",
      needType: "studySpace",
      rankedBusinessIds: ["biz_scholarspace", "biz_harbourroast"],
      updatedAt,
    },
    {
      userId: "user_lucas",
      category: "retail",
      needType: "gift",
      rankedBusinessIds: ["biz_inkwell", "biz_giftnook"],
      updatedAt,
    },
  ];
}
