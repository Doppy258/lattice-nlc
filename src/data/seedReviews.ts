import type { Review } from "../models";
import { MS_PER_DAY } from "../utils/dateTime";

/** Representative offer per business, used to attach historical reviews. */
const OFFER_BY_BUSINESS: Record<string, string> = {
  biz_mitierra: "offer_mitierra_lunch",
  biz_rosarios: "offer_rosarios_lunch",
  biz_bakerylorraine: "offer_bakerylorraine_study",
  biz_commonwealth: "offer_commonwealth_study",
  biz_smokeshack: "offer_smokeshack_lunch",
  biz_twig: "offer_twig_blinddate",
  biz_nowhere: "offer_nowhere_student",
  biz_feliz: "offer_feliz_gift",
  biz_buffalo: "offer_buffalo_student",
  biz_downtown_barber_shop: "offer_downtown_barber_student_cut",
  biz_drybar_quarry: "offer_drybar_student_blowout",
  biz_fedex_office_losoya: "offer_fedex_losoya_color",
  biz_goldscrossroads: "offer_golds_trial",
  biz_armadilloboulders: "offer_armadillo_daypass",
  biz_orangetheoryah: "offer_otf_firstfree",
  biz_central_library: "offer_central_library_study_room",
  biz_geekdom: "offer_geekdom_student_daypass",
  biz_mathnasium_alamo_heights: "offer_mathnasium_assessment",
  biz_ubreakifix_broadway: "offer_ubif_broadway_screen",
  biz_bikeworld_alamoheights: "offer_bikeworld_ah_tuneup",
  biz_escapegame: "offer_escapegame_student",
  biz_daveandbusters: "offer_daveandbusters_powercard",
  biz_topgolf: "offer_topgolf_student",
  biz_alamodrafthouse: "offer_alamodrafthouse_student",
};

// [businessId, rating, verified(1/0), text, tagsCsv]
type RSpec = [string, number, 0 | 1, string, string];

const SPECS: RSpec[] = [
  ["biz_mitierra", 5, 1, "The enchilada lunch plate is huge and the price is unbeatable downtown.", "Good value,Good quality"],
  ["biz_mitierra", 4, 1, "Classic Market Square spot, busy but the mariachi makes the wait fun.", "Group-friendly"],
  ["biz_rosarios", 5, 1, "Student taco combo is a steal and the salsa is incredible.", "Good value,Student-friendly"],
  ["biz_rosarios", 4, 0, "Lively Southtown vibe, great for a group dinner.", "Group-friendly"],
  ["biz_bakerylorraine", 5, 1, "Perfect quiet corner to study with a latte and a croissant.", "Quiet,Student-friendly"],
  ["biz_bakerylorraine", 5, 0, "The macarons are the best in town, great little gift box too.", "Good quality"],
  ["biz_commonwealth", 5, 1, "Bottomless drip coffee got me through finals week.", "Good value,Student-friendly"],
  ["biz_commonwealth", 4, 1, "Roomy, quiet, and the pastries are fresh.", "Quiet,Friendly staff"],
  ["biz_smokeshack", 5, 1, "Brisket sandwich combo is a perfect lunch, melts in your mouth.", "Good quality,Good value"],
  ["biz_smokeshack", 4, 0, "Family pack fed our whole crew. Worth the line.", "Group-friendly"],
  ["biz_twig", 5, 1, "Blind date with a book was such a fun surprise pick.", "Friendly staff,Good quality"],
  ["biz_twig", 5, 0, "Best indie bookstore at the Pearl, staff recs are spot on.", "Friendly staff"],
  ["biz_nowhere", 5, 1, "Quirky, cozy, and the student discount is a nice touch.", "Student-friendly,Friendly staff"],
  ["biz_nowhere", 4, 0, "Great events and a fun gift selection.", "Good quality"],
  ["biz_feliz", 5, 1, "Found a perfect local gift in ten minutes. Colorful shop.", "Good quality,Friendly staff"],
  ["biz_feliz", 4, 0, "A little pricey but the curation is lovely.", "Good quality"],
  ["biz_buffalo", 4, 1, "Scored great resale denim with the student discount.", "Good value,Student-friendly"],
  ["biz_buffalo", 4, 0, "Selection rotates often, worth checking back.", "Good quality"],
  ["biz_downtown_barber_shop", 5, 1, "Clean classic cut and the student rate is clutch.", "Good value,Student-friendly"],
  ["biz_downtown_barber_shop", 4, 1, "Old-school barbershop in the Gunter, friendly barbers.", "Friendly staff"],
  ["biz_drybar_quarry", 4, 1, "Student blowout left my hair perfect for the event.", "Good quality,Student-friendly"],
  ["biz_drybar_quarry", 4, 0, "Relaxing and the staff are great. Booking was easy.", "Friendly staff"],
  ["biz_fedex_office_losoya", 5, 1, "25% off color prints saved my project budget.", "Good value,Student-friendly"],
  ["biz_fedex_office_losoya", 4, 1, "Quick self-serve and helpful staff near the River Walk.", "Fast service"],
  ["biz_goldscrossroads", 4, 1, "Free week trial let me test everything, no pressure.", "Good value,Group-friendly"],
  ["biz_goldscrossroads", 4, 0, "Solid equipment, gets busy in the evenings.", "Good quality"],
  ["biz_armadilloboulders", 5, 1, "Student first-visit-free got me hooked on climbing.", "Student-friendly,Friendly staff"],
  ["biz_armadilloboulders", 5, 0, "Well-set walls and an encouraging community.", "Good quality,Group-friendly"],
  ["biz_orangetheoryah", 4, 1, "First class free was a great way to try the workout.", "Good value,Group-friendly"],
  ["biz_orangetheoryah", 5, 0, "Coaches push you and the energy is contagious.", "Friendly staff"],
  ["biz_central_library", 5, 1, "Free study rooms downtown are a student lifesaver.", "Quiet,Student-friendly"],
  ["biz_central_library", 4, 1, "Six floors of quiet space and fast Wi-Fi.", "Quiet"],
  ["biz_geekdom", 5, 1, "Student day pass is perfect for a focused work session.", "Student-friendly,Quiet"],
  ["biz_geekdom", 4, 0, "Great community and the coding workshops are fun.", "Good quality"],
  ["biz_mathnasium_alamo_heights", 5, 1, "Free assessment pinpointed exactly where I needed help.", "Student-friendly,Good quality"],
  ["biz_mathnasium_alamo_heights", 5, 0, "Patient tutors and a real improvement in my grade.", "Friendly staff"],
  ["biz_ubreakifix_broadway", 5, 1, "Same-day screen fix, looked brand new.", "Fast service,Good quality"],
  ["biz_ubreakifix_broadway", 4, 0, "Fair price and honest diagnosis on my laptop.", "Good value"],
  ["biz_bikeworld_alamoheights", 5, 1, "Student tune-up discount and my bike rides like new.", "Good value,Student-friendly"],
  ["biz_bikeworld_alamoheights", 4, 1, "Knowledgeable mechanics, quick turnaround.", "Fast service,Friendly staff"],
  ["biz_escapegame", 5, 1, "Student night made the escape room an easy group hangout.", "Group-friendly,Good value"],
  ["biz_escapegame", 5, 0, "Clever puzzles and immersive theming. Loved it.", "Good quality,Group-friendly"],
  ["biz_daveandbusters", 4, 1, "Student power card is great value for a night out.", "Good value,Group-friendly"],
  ["biz_daveandbusters", 4, 0, "Tons of games and a fun group atmosphere.", "Group-friendly"],
  ["biz_topgolf", 5, 1, "Student bay hour split between friends was a blast.", "Group-friendly,Good value"],
  ["biz_topgolf", 4, 0, "Always a fun group hangout, food is decent too.", "Group-friendly"],
  ["biz_alamodrafthouse", 5, 1, "$8 student matinee plus dine-in service is unbeatable.", "Good value,Student-friendly"],
  ["biz_alamodrafthouse", 4, 1, "Great seats and the food-at-your-seat is a treat.", "Good quality"],
];

const AUTHORS = ["user_lucas", "user_maya", "user_ethan"];

/** Builds historical community reviews relative to `now`. */
export function buildSeedReviews(now: Date = new Date()): Review[] {
  return SPECS.map((spec, i) => {
    const [businessId, rating, verified, text, tagsCsv] = spec;
    return {
      id: `review_seed_${i + 1}`,
      userId: AUTHORS[i % AUTHORS.length],
      businessId,
      offerId: OFFER_BY_BUSINESS[businessId],
      // Historical reviews reference archived claims (not in the active set).
      claimId: `claim_archive_${i + 1}`,
      rating,
      text,
      tags: tagsCsv.split(","),
      verified: verified === 1,
      createdAt: new Date(now.getTime() - (i + 3) * MS_PER_DAY).toISOString(),
    };
  });
}
