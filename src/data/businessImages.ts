import type { BusinessCategory } from "@/models";

/**
 * Presentation-only imagery for businesses. The domain `Business` model has no
 * image field (and must not change), so storefront photos live here as a thin
 * lookup keyed by business id, with a per-category pool as a fallback for any id
 * not in the map. Photos are hotlinked from the Unsplash CDN (allowed) and every
 * id below was HTTP-verified to load; if the network is unavailable at runtime the
 * `BusinessImage` component degrades gracefully to a category-icon tile, so the
 * app never shows a broken image — online it is rich, offline it is still clean.
 */

const CDN = "https://images.unsplash.com/photo-";

/** Builds a sized, auto-formatted Unsplash URL for a photo id. */
export function unsplash(id: string, width = 900, quality = 72): string {
  return `${CDN}${id}?auto=format&fit=crop&w=${width}&q=${quality}`;
}

/** Subject-matched storefront photo per seeded business (one verified id each). */
const BY_BUSINESS: Record<string, string> = {
  biz_mitierra: "1565299624946-b28f40a0ae38",
  biz_lapanaderia: "1509440159596-0249088772ff",
  biz_rosarios: "1565299624946-b28f40a0ae38",
  biz_bakerylorraine: "1488477181946-6428a0291777",
  biz_guenther: "1533089860892-a7c6f0a88666",
  biz_schilos: "1528735602780-2552fd46c7af",
  biz_commonwealth: "1501339847302-ac426a4a7cbb",
  biz_rays: "1613514785940-daed07799d9b",
  biz_lick: "1488477181946-6428a0291777",
  biz_southerleigh: "1568901346375-23c9450c58cd",
  biz_halcyon: "1501339847302-ac426a4a7cbb",
  biz_smokeshack: "1529193591184-b1d58069ecdd",
  biz_kimura: "1569718212165-3a8278d5f624",
  biz_dough: "1513104890138-7c749659a591",
  biz_twig: "1507842217343-583bb7270b66",
  biz_nowhere: "1507842217343-583bb7270b66",
  biz_cheever: "1507842217343-583bb7270b66",
  biz_hpb: "1507842217343-583bb7270b66",
  biz_feliz: "1607344645866-009c320b63e0",
  biz_tinyfinch: "1556228453-efd6c1ff04f6",
  biz_niche: "1515562141207-7a88fb7ce338",
  biz_adelante: "1607344645866-009c320b63e0",
  biz_ragparlor: "1445205170230-053b83016050",
  biz_canela: "1445205170230-053b83016050",
  biz_buffalo: "1445205170230-053b83016050",
  biz_boysville: "1445205170230-053b83016050",
  biz_southtownvinyl: "1483412033650-1015ddeb83d1",
  biz_herwecks: "1456735190827-d1262f71b8a3",
  biz_asel: "1503676260728-1c00da094a0b",
  biz_downtown_barber_shop: "1503951914875-452162b0f3f1",
  biz_puro_handsome: "1503951914875-452162b0f3f1",
  biz_sport_clips_terrell_plaza: "1503951914875-452162b0f3f1",
  biz_great_clips_mccreless: "1503951914875-452162b0f3f1",
  biz_trevi_hair_studio: "1560066984-138dadb4c035",
  biz_drybar_quarry: "1560066984-138dadb4c035",
  biz_alamo_nails_lounge: "1604654894610-df63bc536371",
  biz_anns_nails: "1604654894610-df63bc536371",
  biz_fedex_office_losoya: "1612817159949-195b6eb9e31a",
  biz_fedex_office_market: "1612817159949-195b6eb9e31a",
  biz_ups_store_market: "1612817159949-195b6eb9e31a",
  biz_office_depot_loop410: "1612817159949-195b6eb9e31a",
  biz_alterations_to_go: "1556905055-8f358a7a47b2",
  biz_couture_alterations: "1612817159949-195b6eb9e31a",
  biz_sunnys_alterations: "1612817159949-195b6eb9e31a",
  biz_jack_brown_cleaners: "1545173168-9f1947eebb7f",
  biz_mcdougall_cleaners: "1604335399105-a0c585fd81a1",
  biz_merry_maids_sa: "1581578731548-c64695cc6952",
  biz_molly_maid_nw: "1581578731548-c64695cc6952",
  biz_club_z_tutoring: "1522202176988-66273c2fd55f",
  biz_tutor_doctor_nw: "1522202176988-66273c2fd55f",
  biz_grade_potential_sa: "1522202176988-66273c2fd55f",
  biz_varsity_tutors_sa: "1522202176988-66273c2fd55f",
  biz_goldscrossroads: "1517836357463-d25dfeac3438",
  biz_planetfitnessfburg: "1571902943202-507ec2618e8f",
  biz_lifetime281: "1534438327276-14e5300c3a48",
  biz_ymcatripoint: "1534438327276-14e5300c3a48",
  biz_orangetheoryah: "1518611012118-696072aa579a",
  biz_cyclebarstoneoak: "1534258936925-c58bed479fcb",
  biz_purebarreah: "1518310383802-640c2de311b2",
  biz_districtbouldering: "1522163182402-834f871fd851",
  biz_armadilloboulders: "1522163182402-834f871fd851",
  biz_mcfarlintennis: "1534438327276-14e5300c3a48",
  biz_missionconcepcion: "1546519638-68e109498ffc",
  biz_alamocitycrossfit: "1534367610401-9f5ed68180aa",
  biz_osocrossfit: "1534367610401-9f5ed68180aa",
  biz_mathnasium_alamo_heights: "1522202176988-66273c2fd55f",
  biz_sylvan_nw: "1522202176988-66273c2fd55f",
  biz_kumon_alamo_heights: "1427504494785-3a9ca7044f45",
  biz_huntington_stone_oak: "1434030216411-0b793f4b4173",
  biz_best_brains_de_zavala: "1522202176988-66273c2fd55f",
  biz_clubz_tutoring_edu: "1522202176988-66273c2fd55f",
  biz_princeton_review: "1434030216411-0b793f4b4173",
  biz_geekdom: "1497215728101-856f4ea42174",
  biz_southwest_school_art: "1513364776144-60967b0f800f",
  biz_doseum: "1581092160562-40aa08e78837",
  biz_codeup: "1517694712202-14dd9538aa97",
  biz_central_library: "1521587760476-6c12a4b040da",
  biz_venture_x: "1497215728101-856f4ea42174",
  biz_common_desk: "1497366811353-6870744d04b2",
  biz_ubreakifix_broadway: "1580894894513-541e068a3e2b",
  biz_ubreakifix_huebner: "1580894894513-541e068a3e2b",
  biz_cpr_northeast: "1580894894513-541e068a3e2b",
  biz_cpr_west: "1580894894513-541e068a3e2b",
  biz_geeksquad_410: "1591488320449-011701bb6704",
  biz_bikeworld_alamoheights: "1485965120184-e220f721d03e",
  biz_bikeworld_south: "1485965120184-e220f721d03e",
  biz_bluestar_bike: "1485965120184-e220f721d03e",
  biz_alamo_bike: "1485965120184-e220f721d03e",
  biz_sa_shoe_luggage: "1449505278894-297fdb3edbc1",
  biz_texas_shoe: "1449505278894-297fdb3edbc1",
  biz_imperial_boot: "1531310197839-ccf54634509e",
  biz_alterations_togo_repair: "1445205170230-053b83016050",
  biz_escapegame: "1597007030739-6d2e7172ee2a",
  biz_escaperoomsa: "1597007030739-6d2e7172ee2a",
  biz_escapetheroom: "1597007030739-6d2e7172ee2a",
  biz_escapology: "1597007030739-6d2e7172ee2a",
  biz_daveandbusters: "1511512578047-dfb367046420",
  biz_mainevent: "1511512578047-dfb367046420",
  biz_andretti: "1511512578047-dfb367046420",
  biz_kungfusaloon: "1511512578047-dfb367046420",
  biz_alamodrafthouse: "1489599849927-2ee91cede3ba",
  biz_santikospalladium: "1517604931442-7e0c8ed2963c",
  biz_amcrivercenter: "1489599849927-2ee91cede3ba",
  biz_santikosembassy: "1517604931442-7e0c8ed2963c",
  biz_tobincenter: "1501386761578-eac5c94b800a",
  biz_theespee: "1470229722913-7c0e2dbbafd3",
  biz_papertiger: "1470229722913-7c0e2dbbafd3",
  biz_aztectheatre: "1501386761578-eac5c94b800a",
  biz_topgolf: "1535131749006-b7f58c99034b",
  biz_coolcrest: "1535132011086-b8818f016104",
};

/** Verified, on-theme fallbacks for any business id not explicitly mapped. */
const BY_CATEGORY: Record<BusinessCategory, string[]> = {
  food: ["1565299624946-b28f40a0ae38", "1509440159596-0249088772ff", "1488477181946-6428a0291777", "1533089860892-a7c6f0a88666", "1528735602780-2552fd46c7af", "1501339847302-ac426a4a7cbb", "1613514785940-daed07799d9b", "1568901346375-23c9450c58cd", "1529193591184-b1d58069ecdd", "1569718212165-3a8278d5f624", "1513104890138-7c749659a591"],
  retail: ["1507842217343-583bb7270b66", "1607344645866-009c320b63e0", "1556228453-efd6c1ff04f6", "1515562141207-7a88fb7ce338", "1445205170230-053b83016050", "1483412033650-1015ddeb83d1", "1456735190827-d1262f71b8a3", "1503676260728-1c00da094a0b"],
  services: ["1503951914875-452162b0f3f1", "1560066984-138dadb4c035", "1604654894610-df63bc536371", "1612817159949-195b6eb9e31a", "1556905055-8f358a7a47b2", "1545173168-9f1947eebb7f", "1604335399105-a0c585fd81a1", "1581578731548-c64695cc6952", "1522202176988-66273c2fd55f"],
  fitness: ["1517836357463-d25dfeac3438", "1571902943202-507ec2618e8f", "1534438327276-14e5300c3a48", "1518611012118-696072aa579a", "1534258936925-c58bed479fcb", "1518310383802-640c2de311b2", "1522163182402-834f871fd851", "1546519638-68e109498ffc", "1534367610401-9f5ed68180aa"],
  education: ["1522202176988-66273c2fd55f", "1427504494785-3a9ca7044f45", "1434030216411-0b793f4b4173", "1497215728101-856f4ea42174", "1513364776144-60967b0f800f", "1581092160562-40aa08e78837", "1517694712202-14dd9538aa97", "1521587760476-6c12a4b040da", "1497366811353-6870744d04b2"],
  repair: ["1580894894513-541e068a3e2b", "1591488320449-011701bb6704", "1485965120184-e220f721d03e", "1449505278894-297fdb3edbc1", "1531310197839-ccf54634509e", "1445205170230-053b83016050"],
  entertainment: ["1597007030739-6d2e7172ee2a", "1511512578047-dfb367046420", "1489599849927-2ee91cede3ba", "1517604931442-7e0c8ed2963c", "1501386761578-eac5c94b800a", "1470229722913-7c0e2dbbafd3", "1535131749006-b7f58c99034b", "1535132011086-b8818f016104"],
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
