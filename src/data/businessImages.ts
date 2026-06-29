import type { BusinessCategory } from "@/models";

/**
 * Presentation-only imagery for businesses. The domain `Business` model has no
 * image field (and must not change), so storefront photos live here as a thin
<<<<<<< HEAD
 * lookup keyed by business id, with a per-category pool as a fallback for any id
 * not in the map. Photos are hotlinked from the Unsplash CDN (allowed) and every
 * id below was HTTP-verified to load; if the network is unavailable at runtime the
 * `BusinessImage` component degrades gracefully to a category-icon tile, so the
 * app never shows a broken image — online it is rich, offline it is still clean.
=======
 * lookup keyed by business id.
 *
 * Every one of the seeded businesses maps to its **own distinct** photo chosen to
 * suit what it sells (tacos for the taqueria, a climbing wall for the bouldering
 * gym, books for the tutoring center…). No two businesses share an image. Photos
 * are hot-linked from the Unsplash CDN under the Unsplash License; every id below
 * was HTTP-verified to load. `businessFallbackUrl` provides a second, different
 * category photo, and if the network is unavailable `BusinessImage` degrades to a
 * category-icon tile — so the app never shows a broken image. See
 * `docs/ATTRIBUTIONS.md` §4. These are generic representative stock photos, not
 * pictures of the real named businesses, and carry no logos or trademarks.
>>>>>>> de7766ac840f51fe3477c146fca301d5b923dbc9
 */

const CDN = "https://images.unsplash.com/photo-";

/** Builds a sized, auto-formatted Unsplash URL for a photo id. */
export function unsplash(id: string, width = 900, quality = 72): string {
  return `${CDN}${id}?auto=format&fit=crop&w=${width}&q=${quality}`;
}

<<<<<<< HEAD
/** Subject-matched storefront photo per seeded business (one verified id each). */
const BY_BUSINESS: Record<string, string> = {
  biz_mitierra: "1565299624946-b28f40a0ae38",
  biz_lapanaderia: "1509440159596-0249088772ff",
  biz_rosarios: "1565299624946-b28f40a0ae38",
=======
/** Subject-matched storefront photo per seeded business — every id is distinct. */
const BY_BUSINESS: Record<string, string> = {
  // Food & drink
  biz_mitierra: "1565299624946-b28f40a0ae38",
  biz_lapanaderia: "1509440159596-0249088772ff",
  biz_rosarios: "1565299585323-38d6b0865b47",
>>>>>>> de7766ac840f51fe3477c146fca301d5b923dbc9
  biz_bakerylorraine: "1488477181946-6428a0291777",
  biz_guenther: "1533089860892-a7c6f0a88666",
  biz_schilos: "1528735602780-2552fd46c7af",
  biz_commonwealth: "1501339847302-ac426a4a7cbb",
  biz_rays: "1613514785940-daed07799d9b",
<<<<<<< HEAD
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
=======
  biz_lick: "1559054663-e8d23213f55c",
  biz_southerleigh: "1568901346375-23c9450c58cd",
  biz_halcyon: "1541557435984-1c79685a082b",
  biz_smokeshack: "1529193591184-b1d58069ecdd",
  biz_kimura: "1569718212165-3a8278d5f624",
  biz_dough: "1513104890138-7c749659a591",
  // Retail
  biz_twig: "1507842217343-583bb7270b66",
  biz_nowhere: "1488459716781-31db52582fe9",
  biz_cheever: "1567696911980-2eed69a46042",
  biz_hpb: "1441986300917-64674bd600d8",
  biz_feliz: "1607344645866-009c320b63e0",
  biz_tinyfinch: "1556228453-efd6c1ff04f6",
  biz_niche: "1515562141207-7a88fb7ce338",
  biz_adelante: "1583744946564-b52ac1c389c8",
  biz_ragparlor: "1445205170230-053b83016050",
  biz_canela: "1472851294608-062f824d29cc",
  biz_buffalo: "1567401893414-76b7b1e5a7a5",
  biz_boysville: "1542838132-92c53300491e",
  biz_southtownvinyl: "1483412033650-1015ddeb83d1",
  biz_herwecks: "1456735190827-d1262f71b8a3",
  biz_asel: "1503676260728-1c00da094a0b",
  // Services
  biz_downtown_barber_shop: "1503951914875-452162b0f3f1",
  biz_puro_handsome: "1599351431202-1e0f0137899a",
  biz_sport_clips_terrell_plaza: "1585747860715-2ba37e788b70",
  biz_great_clips_mccreless: "1622286342621-4bd786c2447c",
  biz_trevi_hair_studio: "1560066984-138dadb4c035",
  biz_drybar_quarry: "1562322140-8baeececf3df",
  biz_alamo_nails_lounge: "1604654894610-df63bc536371",
  biz_anns_nails: "1519014816548-bf5fe059798b",
  biz_fedex_office_losoya: "1612817159949-195b6eb9e31a",
  biz_fedex_office_market: "1586528116311-ad8dd3c8310d",
  biz_ups_store_market: "1524995997946-a1c2e315a42f",
  biz_office_depot_loop410: "1456513080510-7bf3a84b82f8",
  biz_alterations_to_go: "1556905055-8f358a7a47b2",
  biz_couture_alterations: "1605518216938-7c31b7b14ad0",
  biz_sunnys_alterations: "1591047139829-d91aecb6caea",
  biz_jack_brown_cleaners: "1545173168-9f1947eebb7f",
  biz_mcdougall_cleaners: "1604335399105-a0c585fd81a1",
  biz_merry_maids_sa: "1581578731548-c64695cc6952",
  biz_molly_maid_nw: "1610557892470-55d9e80c0bce",
  biz_club_z_tutoring: "1427504494785-3a9ca7044f45",
  biz_tutor_doctor_nw: "1434030216411-0b793f4b4173",
  biz_grade_potential_sa: "1577896851231-70ef18881754",
  biz_varsity_tutors_sa: "1568667256549-094345857637",
  // Fitness
  biz_goldscrossroads: "1517836357463-d25dfeac3438",
  biz_planetfitnessfburg: "1571902943202-507ec2618e8f",
  biz_lifetime281: "1534438327276-14e5300c3a48",
  biz_ymcatripoint: "1599058917212-d750089bc07e",
>>>>>>> de7766ac840f51fe3477c146fca301d5b923dbc9
  biz_orangetheoryah: "1518611012118-696072aa579a",
  biz_cyclebarstoneoak: "1534258936925-c58bed479fcb",
  biz_purebarreah: "1518310383802-640c2de311b2",
  biz_districtbouldering: "1522163182402-834f871fd851",
<<<<<<< HEAD
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
=======
  biz_armadilloboulders: "1571019614242-c5c5dee9f50b",
  biz_mcfarlintennis: "1540497077202-7c8a3999166f",
  biz_missionconcepcion: "1546519638-68e109498ffc",
  biz_alamocitycrossfit: "1534367610401-9f5ed68180aa",
  biz_osocrossfit: "1581009146145-b5ef050c2e1e",
  // Education
  biz_mathnasium_alamo_heights: "1522202176988-66273c2fd55f",
  biz_sylvan_nw: "1524178232363-1fb2b075b655",
  biz_kumon_alamo_heights: "1497486751825-1233686d5d80",
  biz_huntington_stone_oak: "1497633762265-9d179a990aa6",
  biz_best_brains_de_zavala: "1546410531-bb4caa6b424d",
  biz_clubz_tutoring_edu: "1509062522246-3755977927d7",
  biz_princeton_review: "1541339907198-e08756dedf3f",
>>>>>>> de7766ac840f51fe3477c146fca301d5b923dbc9
  biz_geekdom: "1497215728101-856f4ea42174",
  biz_southwest_school_art: "1513364776144-60967b0f800f",
  biz_doseum: "1581092160562-40aa08e78837",
  biz_codeup: "1517694712202-14dd9538aa97",
  biz_central_library: "1521587760476-6c12a4b040da",
<<<<<<< HEAD
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
=======
  biz_venture_x: "1497366811353-6870744d04b2",
  biz_common_desk: "1503454537195-1dcabb73ffb9",
  // Repair
  biz_ubreakifix_broadway: "1580894894513-541e068a3e2b",
  biz_ubreakifix_huebner: "1542013936693-884638332954",
  biz_cpr_northeast: "1601524909162-ae8725290836",
  biz_cpr_west: "1572981779307-38b8cabb2407",
  biz_geeksquad_410: "1591488320449-011701bb6704",
  biz_bikeworld_alamoheights: "1485965120184-e220f721d03e",
  biz_bikeworld_south: "1532298229144-0ec0c57515c7",
  biz_bluestar_bike: "1571333250630-f0230c320b6d",
  biz_alamo_bike: "1530124566582-a618bc2615dc",
  biz_sa_shoe_luggage: "1449505278894-297fdb3edbc1",
  biz_texas_shoe: "1543163521-1bf539c55dd2",
  biz_imperial_boot: "1531310197839-ccf54634509e",
  biz_alterations_togo_repair: "1583394838336-acd977736f90",
  // Entertainment
  biz_escapegame: "1574680096145-d05b474e2155",
  biz_escaperoomsa: "1581235720704-06d3acfcb36f",
  biz_escapetheroom: "1611854779393-1b2da9d400fe",
  biz_escapology: "1593720213428-28a5b9e94613",
  biz_daveandbusters: "1511512578047-dfb367046420",
  biz_mainevent: "1572116469696-31de0f17cc34",
  biz_andretti: "1542204165-65bf26472b9b",
  biz_kungfusaloon: "1574391884720-bbc3740c59d1",
  biz_alamodrafthouse: "1489599849927-2ee91cede3ba",
  biz_amcrivercenter: "1533174072545-7a4b6ad7a6c3",
  biz_santikospalladium: "1517604931442-7e0c8ed2963c",
  biz_santikosembassy: "1516450360452-9312f5e86fc7",
  biz_tobincenter: "1501386761578-eac5c94b800a",
  biz_theespee: "1470229722913-7c0e2dbbafd3",
  biz_papertiger: "1453614512568-c4024d13c247",
  biz_aztectheatre: "1470225620780-dba8ba36b745",
>>>>>>> de7766ac840f51fe3477c146fca301d5b923dbc9
  biz_topgolf: "1535131749006-b7f58c99034b",
  biz_coolcrest: "1535132011086-b8818f016104",
};

/** Verified, on-theme fallbacks for any business id not explicitly mapped above. */
const BY_CATEGORY: Record<BusinessCategory, string[]> = {
  food: ["1565299624946-b28f40a0ae38", "1509440159596-0249088772ff", "1488477181946-6428a0291777", "1533089860892-a7c6f0a88666", "1528735602780-2552fd46c7af", "1501339847302-ac426a4a7cbb", "1613514785940-daed07799d9b", "1568901346375-23c9450c58cd", "1529193591184-b1d58069ecdd", "1569718212165-3a8278d5f624", "1513104890138-7c749659a591"],
  retail: ["1507842217343-583bb7270b66", "1607344645866-009c320b63e0", "1556228453-efd6c1ff04f6", "1515562141207-7a88fb7ce338", "1445205170230-053b83016050", "1483412033650-1015ddeb83d1", "1456735190827-d1262f71b8a3", "1503676260728-1c00da094a0b"],
<<<<<<< HEAD
  services: ["1503951914875-452162b0f3f1", "1560066984-138dadb4c035", "1604654894610-df63bc536371", "1612817159949-195b6eb9e31a", "1556905055-8f358a7a47b2", "1545173168-9f1947eebb7f", "1604335399105-a0c585fd81a1", "1581578731548-c64695cc6952", "1522202176988-66273c2fd55f"],
  fitness: ["1517836357463-d25dfeac3438", "1571902943202-507ec2618e8f", "1534438327276-14e5300c3a48", "1518611012118-696072aa579a", "1534258936925-c58bed479fcb", "1518310383802-640c2de311b2", "1522163182402-834f871fd851", "1546519638-68e109498ffc", "1534367610401-9f5ed68180aa"],
  education: ["1522202176988-66273c2fd55f", "1427504494785-3a9ca7044f45", "1434030216411-0b793f4b4173", "1497215728101-856f4ea42174", "1513364776144-60967b0f800f", "1581092160562-40aa08e78837", "1517694712202-14dd9538aa97", "1521587760476-6c12a4b040da", "1497366811353-6870744d04b2"],
  repair: ["1580894894513-541e068a3e2b", "1591488320449-011701bb6704", "1485965120184-e220f721d03e", "1449505278894-297fdb3edbc1", "1531310197839-ccf54634509e", "1445205170230-053b83016050"],
  entertainment: ["1597007030739-6d2e7172ee2a", "1511512578047-dfb367046420", "1489599849927-2ee91cede3ba", "1517604931442-7e0c8ed2963c", "1501386761578-eac5c94b800a", "1470229722913-7c0e2dbbafd3", "1535131749006-b7f58c99034b", "1535132011086-b8818f016104"],
=======
  services: ["1503951914875-452162b0f3f1", "1560066984-138dadb4c035", "1604654894610-df63bc536371", "1612817159949-195b6eb9e31a", "1556905055-8f358a7a47b2", "1545173168-9f1947eebb7f", "1604335399105-a0c585fd81a1", "1581578731548-c64695cc6952"],
  fitness: ["1517836357463-d25dfeac3438", "1571902943202-507ec2618e8f", "1534438327276-14e5300c3a48", "1518611012118-696072aa579a", "1534258936925-c58bed479fcb", "1518310383802-640c2de311b2", "1522163182402-834f871fd851", "1546519638-68e109498ffc", "1534367610401-9f5ed68180aa"],
  education: ["1522202176988-66273c2fd55f", "1427504494785-3a9ca7044f45", "1434030216411-0b793f4b4173", "1497215728101-856f4ea42174", "1513364776144-60967b0f800f", "1581092160562-40aa08e78837", "1517694712202-14dd9538aa97", "1521587760476-6c12a4b040da", "1497366811353-6870744d04b2"],
  repair: ["1580894894513-541e068a3e2b", "1591488320449-011701bb6704", "1485965120184-e220f721d03e", "1449505278894-297fdb3edbc1", "1531310197839-ccf54634509e", "1530124566582-a618bc2615dc"],
  entertainment: ["1511512578047-dfb367046420", "1489599849927-2ee91cede3ba", "1517604931442-7e0c8ed2963c", "1501386761578-eac5c94b800a", "1470229722913-7c0e2dbbafd3", "1535131749006-b7f58c99034b", "1535132011086-b8818f016104"],
>>>>>>> de7766ac840f51fe3477c146fca301d5b923dbc9
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

/** Primary storefront photo: the business's own distinct, subject-matched image. */
export function businessImageUrl(
  business: { id: string; category: BusinessCategory },
  width = 900,
): string {
  return unsplash(businessPhotoId(business), width);
}

/**
 * Fallback storefront photo: a *different* on-theme photo from the category pool,
 * used only when the primary image fails to load. Guaranteed to differ from
 * `businessImageUrl` so a failed primary never falls back to itself.
 */
export function businessFallbackUrl(
  business: { id: string; category: BusinessCategory },
  width = 900,
): string {
  const pool = BY_CATEGORY[business.category];
  const primary = businessPhotoId(business);
  const start = hash(business.id) % pool.length;
  // Walk the pool until we find an id that isn't the primary.
  let id = pool[start];
  for (let i = 1; i < pool.length && id === primary; i++) {
    id = pool[(start + i) % pool.length];
  }
  return unsplash(id, width);
}
