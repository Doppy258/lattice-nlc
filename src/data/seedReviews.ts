/**
 * 40 historical community reviews (2 per seeded business) authored by the 3
 * demo customers. Every review is tied to a representative offer and references
 * an archived claim ID, making them "verified" in the Lattice sense — they
 * appear on business profiles and in the explore feed as trusted feedback.
 */
import type { Review } from "../models";
import { MS_PER_DAY } from "../utils/dateTime";

/** Representative offer per business, used to attach historical reviews. */
const OFFER_BY_BUSINESS: Record<string, string> = {
  biz_freshbowl: "offer_freshbowl_bowl",
  biz_rosas: "offer_rosas_taco",
  biz_harbourroast: "offer_harbour_latte",
  biz_sugarpine: "offer_sugarpine_slice",
  biz_maplenoodle: "offer_maple_bowl",
  biz_inkwell: "offer_inkwell_blind",
  biz_threadtonic: "offer_thread_hoodie",
  biz_giftnook: "offer_gift_set",
  biz_sharpfade: "offer_sharp_student",
  biz_glowroom: "offer_glow_color",
  biz_printpoint: "offer_print_student",
  biz_brightminds: "offer_bright_intro",
  biz_pulse: "offer_pulse_trial",
  biz_summit: "offer_summit_intro",
  biz_scholarspace: "offer_scholar_day",
  biz_examedge: "offer_exam_workshop",
  biz_fixly: "offer_fixly_protector",
  biz_cyclewerks: "offer_cycle_tune",
  biz_escapelab: "offer_escape_group",
  biz_pixelarcade: "offer_pixel_night",
};

// [businessId, rating, verified(1/0), text, tagsCsv]
type RSpec = [string, number, 0 | 1, string, string];

const SPECS: RSpec[] = [
  ["biz_freshbowl", 5, 1, "Bowl was huge and the student price made it an easy weekday lunch.", "Good value,Student-friendly"],
  ["biz_freshbowl", 4, 1, "Quick line and friendly staff, smoothie could be colder though.", "Fast service,Friendly staff"],
  ["biz_rosas", 5, 1, "Tacos taste fresh and the combo is a steal at lunch.", "Good value,Good quality"],
  ["biz_rosas", 4, 0, "Group platter fed five of us easily. Loud at peak hours.", "Group-friendly"],
  ["biz_harbourroast", 5, 1, "Best study cafe nearby, outlets everywhere and quiet corners.", "Quiet,Student-friendly"],
  ["biz_harbourroast", 4, 1, "Three dollar latte deal is unbeatable after school.", "Good value,Fast service"],
  ["biz_sugarpine", 5, 1, "The cake slice and coffee combo is the perfect treat.", "Good quality,Good value"],
  ["biz_sugarpine", 5, 0, "Pastry box made a great gift, everything was fresh.", "Good quality"],
  ["biz_maplenoodle", 4, 1, "Noodles were springy and portions generous for dinner.", "Good quality,Group-friendly"],
  ["biz_maplenoodle", 3, 0, "Tasty but the wait was long on a Friday night.", "Group-friendly"],
  ["biz_inkwell", 5, 1, "Blind date with a book was such a fun surprise pick.", "Friendly staff,Good quality"],
  ["biz_inkwell", 5, 0, "Staff recommendations are always spot on. Cozy shop.", "Quiet,Friendly staff"],
  ["biz_threadtonic", 4, 1, "Scored a vintage hoodie at a great price during the drop.", "Good value"],
  ["biz_threadtonic", 4, 0, "Solid selection that rotates weekly, worth checking often.", "Good quality"],
  ["biz_giftnook", 5, 1, "Found a thoughtful local gift set in under ten minutes.", "Friendly staff,Good quality"],
  ["biz_giftnook", 4, 0, "Lovely curation, a little pricey but worth it.", "Good quality"],
  ["biz_sharpfade", 5, 1, "Clean fade and the student rate after three is clutch.", "Good value,Student-friendly"],
  ["biz_sharpfade", 4, 1, "In and out fast with a sharp result. Friendly barber.", "Fast service,Friendly staff"],
  ["biz_glowroom", 4, 0, "Color came out exactly how I wanted, relaxing space.", "Quiet,Good quality"],
  ["biz_glowroom", 3, 0, "Nice work but booking took a couple tries.", "Friendly staff"],
  ["biz_printpoint", 5, 1, "Saved me before a deadline, prints were ready instantly.", "Fast service,Student-friendly"],
  ["biz_printpoint", 4, 1, "Cheap student pack and easy self-serve kiosks.", "Good value,Fast service"],
  ["biz_brightminds", 5, 1, "Intro tutoring session actually helped my calc grade.", "Good quality,Student-friendly"],
  ["biz_brightminds", 5, 0, "Patient tutors and a quiet, focused setup.", "Quiet,Friendly staff"],
  ["biz_pulse", 4, 1, "Free trial class was a great way to test the gym.", "Group-friendly,Good value"],
  ["biz_pulse", 4, 0, "Good equipment, busy in the evenings though.", "Good quality"],
  ["biz_summit", 5, 1, "Intro climb with gear included was beginner-friendly.", "Friendly staff,Group-friendly"],
  ["biz_summit", 5, 0, "Walls are well set and staff are encouraging.", "Good quality,Friendly staff"],
  ["biz_scholarspace", 5, 1, "All-day pass plus refills is perfect for exam week.", "Quiet,Student-friendly"],
  ["biz_scholarspace", 4, 1, "Group room was great for a project sprint.", "Group-friendly,Quiet"],
  ["biz_examedge", 4, 0, "Crash workshop covered real strategies, not filler.", "Good quality,Student-friendly"],
  ["biz_examedge", 4, 0, "Helpful clinic, wish it ran a bit longer.", "Good quality"],
  ["biz_fixly", 5, 1, "Screen protector installed clean with no bubbles, fast.", "Fast service,Good quality"],
  ["biz_fixly", 5, 0, "Same-day phone screen fix saved my week.", "Fast service"],
  ["biz_cyclewerks", 5, 0, "Tune-up made my bike feel brand new. Honest pricing.", "Good value,Good quality"],
  ["biz_cyclewerks", 4, 0, "Quick turnaround on a flat fix, friendly mechanic.", "Fast service,Friendly staff"],
  ["biz_escapelab", 5, 1, "Group discount made the escape room a perfect hangout.", "Group-friendly,Good value"],
  ["biz_escapelab", 5, 0, "Puzzles were clever and the theming was immersive.", "Good quality,Group-friendly"],
  ["biz_pixelarcade", 4, 0, "Student night pass is great value for a group.", "Group-friendly,Student-friendly"],
  ["biz_pixelarcade", 3, 0, "Fun retro games, a few machines needed maintenance.", "Group-friendly"],
];

const AUTHORS = ["user_lucas", "user_maya", "user_ethan"];

/** Builds 40 historical community reviews relative to `now`. */
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
