import type { BusinessCategory } from "@/models";

/**
 * Presentation-only imagery for businesses. The domain `Business` model has no
 * image field (and must not change), so storefront photos live here as a thin
 * lookup keyed by business id, with a per-category pool as a fallback for any id
 * not in the map. Photos are hotlinked from the Unsplash CDN (allowed) and every
 * id below was verified to load; if the network is unavailable at runtime the
 * `BusinessImage` component degrades gracefully to a category-icon tile, so the
 * app never shows a broken image — online it is rich, offline it is still clean.
 */

const CDN = "https://images.unsplash.com/photo-";

/** Builds a sized, auto-formatted Unsplash URL for a photo id. */
export function unsplash(id: string, width = 900, quality = 72): string {
  return `${CDN}${id}?auto=format&fit=crop&w=${width}&q=${quality}`;
}

/** Hand-picked, verified storefront photo per seeded business (subject-matched). */
const BY_BUSINESS: Record<string, string> = {
  // Food
  biz_freshbowl: "1512621776951-a57141f2eefd", // build-your-own grain bowls
  biz_rosas: "1565299624946-b28f40a0ae38", // tacos / Mexican plates
  biz_harbourroast: "1501339847302-ac426a4a7cbb", // cafe storefront
  biz_sugarpine: "1488477181946-6428a0291777", // bakery desserts
  biz_maplenoodle: "1569718212165-3a8278d5f624", // noodle / ramen bowl
  // Retail
  biz_inkwell: "1507842217343-583bb7270b66", // bookshop shelves
  biz_threadtonic: "1445205170230-053b83016050", // vintage clothing rail
  biz_giftnook: "1607344645866-009c320b63e0", // wrapped gifts
  // Services
  biz_sharpfade: "1503951914875-452162b0f3f1", // barbershop cut
  biz_glowroom: "1560066984-138dadb4c035", // salon chairs / mirrors
  biz_printpoint: "1612817159949-195b6eb9e31a", // print shop machine
  biz_brightminds: "1522202176988-66273c2fd55f", // tutoring at a laptop
  // Fitness
  biz_pulse: "1534438327276-14e5300c3a48", // gym floor
  biz_summit: "1522163182402-834f871fd851", // climbing
  // Education
  biz_scholarspace: "1497366811353-6870744d04b2", // study lounge desks
  biz_examedge: "1427504494785-3a9ca7044f45", // lecture / classroom
  // Repair
  biz_fixly: "1580894894513-541e068a3e2b", // device / laptop repair
  biz_cyclewerks: "1485965120184-e220f721d03e", // bicycle
  // Entertainment
  biz_escapelab: "1597007030739-6d2e7172ee2a", // puzzle / game table
  biz_pixelarcade: "1511512578047-dfb367046420", // neon arcade
};

/** Verified, on-theme fallbacks for any business id not explicitly mapped. */
const BY_CATEGORY: Record<BusinessCategory, string[]> = {
  food: ["1512621776951-a57141f2eefd", "1501339847302-ac426a4a7cbb", "1569718212165-3a8278d5f624"],
  retail: ["1507842217343-583bb7270b66", "1445205170230-053b83016050", "1607344645866-009c320b63e0"],
  services: ["1503951914875-452162b0f3f1", "1560066984-138dadb4c035", "1522202176988-66273c2fd55f"],
  fitness: ["1534438327276-14e5300c3a48", "1522163182402-834f871fd851"],
  education: ["1497366811353-6870744d04b2", "1427504494785-3a9ca7044f45"],
  repair: ["1580894894513-541e068a3e2b", "1485965120184-e220f721d03e"],
  entertainment: ["1511512578047-dfb367046420", "1597007030739-6d2e7172ee2a"],
};

/** Stable string hash so an unmapped business always picks the same pool photo. */
function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** The chosen photo id for a business (explicit map first, else category pool). */
export function businessPhotoId(business: { id: string; category: BusinessCategory }): string {
  const direct = BY_BUSINESS[business.id];
  if (direct) return direct;
  const pool = BY_CATEGORY[business.category];
  return pool[hash(business.id) % pool.length];
}

/** Full sized image URL for a business storefront photo. */
export function businessImageUrl(
  business: { id: string; category: BusinessCategory },
  width = 900,
): string {
  return unsplash(businessPhotoId(business), width);
}
