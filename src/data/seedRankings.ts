import type { PersonalRanking } from "../models";

/**
 * Seeded personal rankings for the demo customer (Lucas) across common needs:
 * lunch, cafes, haircuts, study spots, and gift shops. Index 0 is the top pick.
 */
export function buildSeedRankings(now: Date = new Date()): PersonalRanking[] {
  const updatedAt = now.toISOString();
  return [
    { userId: "user_lucas", category: "food", needType: "lunch", rankedBusinessIds: ["biz_mitierra", "biz_rosarios", "biz_smokeshack"], updatedAt },
    { userId: "user_lucas", category: "food", needType: "cafeStudySpot", rankedBusinessIds: ["biz_bakerylorraine", "biz_commonwealth"], updatedAt },
    { userId: "user_lucas", category: "services", needType: "haircut", rankedBusinessIds: ["biz_downtown_barber_shop", "biz_puro_handsome"], updatedAt },
    { userId: "user_lucas", category: "education", needType: "studySpace", rankedBusinessIds: ["biz_central_library", "biz_geekdom"], updatedAt },
    { userId: "user_lucas", category: "retail", needType: "gift", rankedBusinessIds: ["biz_feliz", "biz_twig"], updatedAt },
  ];
}
