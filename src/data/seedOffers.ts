import type { BusinessCategory, Offer, OfferType } from "../models";
import { MS_PER_DAY } from "../utils/dateTime";

type OfferSpec = {
  id: string;
  businessId: string;
  title: string;
  description: string;
  category: BusinessCategory;
  offerType: OfferType;
  price: number;
  originalPrice?: number;
  maxClaims?: number;
  currentClaims?: number;
  views?: number;
  tags?: string[];
  studentOnly?: boolean;
  verificationRequired?: boolean;
  oneTimePerUser?: boolean;
  redemptionWindowMinutes?: number;
  /** Days the offer stays valid from `now`. Ignored when `expired` is true. */
  daysValid?: number;
  expired?: boolean;
};

const SPECS: OfferSpec[] = [
  { id: "offer_freshbowl_bowl", businessId: "biz_freshbowl", title: "Student lunch bowl", description: "Grain bowl with protein + drink, weekdays after 11 AM.", category: "food", offerType: "studentOffer", price: 11.99, originalPrice: 15.99, maxClaims: 40, currentClaims: 12, views: 410, tags: ["student-friendly", "vegetarian", "fast"], studentOnly: true },
  { id: "offer_freshbowl_smoothie", businessId: "biz_freshbowl", title: "After-school smoothie", description: "Any 16oz smoothie, 3-5 PM only.", category: "food", offerType: "discount", price: 4.5, originalPrice: 6, maxClaims: 60, currentClaims: 21, views: 260, tags: ["fast"] },
  { id: "offer_rosas_taco", businessId: "biz_rosas", title: "Taco lunch combo", description: "Two tacos, rice, and a drink.", category: "food", offerType: "limitedTime", price: 11, originalPrice: 14, maxClaims: 50, currentClaims: 30, views: 520, tags: ["tacos", "fast"] },
  { id: "offer_rosas_group", businessId: "biz_rosas", title: "Group taco platter", description: "Feeds 4-5; great for hangouts.", category: "food", offerType: "groupOffer", price: 42, originalPrice: 55, maxClaims: 20, currentClaims: 6, views: 180, tags: ["group-friendly"] },
  { id: "offer_harbour_latte", businessId: "biz_harbourroast", title: "$3 iced latte after school", description: "Any iced latte, weekdays 3-6 PM.", category: "food", offerType: "studentOffer", price: 3, originalPrice: 5, maxClaims: 80, currentClaims: 44, views: 610, tags: ["coffee", "student-friendly"], studentOnly: true },
  { id: "offer_harbour_study", businessId: "biz_harbourroast", title: "Bottomless study refills", description: "Drip refills all afternoon at one table.", category: "food", offerType: "limitedTime", price: 6, originalPrice: 9, maxClaims: 40, currentClaims: 9, views: 150, tags: ["quiet", "wifi"] },
  { id: "offer_sugarpine_slice", businessId: "biz_sugarpine", title: "Cake slice + coffee", description: "A slice of the daily cake with a coffee.", category: "food", offerType: "discount", price: 7, originalPrice: 10, maxClaims: 50, currentClaims: 18, views: 240, tags: ["dessert"] },
  { id: "offer_sugarpine_box", businessId: "biz_sugarpine", title: "Pastry box of 6", description: "Mixed pastry box, perfect to share.", category: "food", offerType: "bundle", price: 14, originalPrice: 18, maxClaims: 30, currentClaims: 7, views: 130, tags: ["dessert", "group-friendly"] },
  { id: "offer_maple_bowl", businessId: "biz_maplenoodle", title: "Noodle bowl special", description: "Hand-pulled noodle bowl of the day.", category: "food", offerType: "discount", price: 12, originalPrice: 16, maxClaims: 45, currentClaims: 15, views: 210, tags: ["dinner"] },
  { id: "offer_maple_group", businessId: "biz_maplenoodle", title: "Group dinner set for 4", description: "Three shared plates plus noodles.", category: "food", offerType: "groupOffer", price: 48, originalPrice: 64, maxClaims: 15, currentClaims: 4, views: 95, tags: ["group-friendly", "dinner"] },

  { id: "offer_inkwell_blind", businessId: "biz_inkwell", title: "Blind date with a book", description: "A wrapped surprise read picked by staff.", category: "retail", offerType: "limitedTime", price: 7, originalPrice: 12, maxClaims: 40, currentClaims: 19, views: 330, tags: ["books", "gifts"] },
  { id: "offer_inkwell_bundle", businessId: "biz_inkwell", title: "Used paperback bundle", description: "Any three used paperbacks.", category: "retail", offerType: "bundle", price: 10, originalPrice: 16, maxClaims: 35, currentClaims: 8, views: 160, tags: ["books"] },
  { id: "offer_thread_hoodie", businessId: "biz_threadtonic", title: "Thrift hoodie drop", description: "Curated vintage hoodies, limited stock.", category: "retail", offerType: "limitedTime", price: 18, originalPrice: 35, maxClaims: 25, currentClaims: 22, views: 290, tags: ["thrift", "clothing"] },
  { id: "offer_thread_tee", businessId: "biz_threadtonic", title: "Vintage tee, 2 for $20", description: "Mix and match vintage tees.", category: "retail", offerType: "bundle", price: 20, originalPrice: 30, maxClaims: 30, currentClaims: 11, views: 140, tags: ["thrift", "clothing"] },
  { id: "offer_gift_set", businessId: "biz_giftnook", title: "Local maker gift set", description: "Candle, card, and small-batch treat.", category: "retail", offerType: "discount", price: 24, originalPrice: 32, maxClaims: 30, currentClaims: 5, views: 110, tags: ["gifts"] },

  { id: "offer_sharp_student", businessId: "biz_sharpfade", title: "$25 student haircut", description: "Scissor or clipper cut, weekdays after 3 PM.", category: "services", offerType: "studentOffer", price: 25, originalPrice: 35, maxClaims: 40, currentClaims: 17, views: 380, tags: ["haircut", "student-friendly"], studentOnly: true, verificationRequired: true },
  { id: "offer_sharp_combo", businessId: "biz_sharpfade", title: "Cut + beard trim", description: "Full cut with a clean beard line-up.", category: "services", offerType: "discount", price: 38, originalPrice: 48, maxClaims: 30, currentClaims: 9, views: 170, tags: ["haircut"] },
  { id: "offer_glow_color", businessId: "biz_glowroom", title: "Color refresh", description: "Single-process color touch-up.", category: "services", offerType: "appointmentSlot", price: 65, originalPrice: 85, maxClaims: 12, currentClaims: 12, views: 90, tags: ["salon"], verificationRequired: true, expired: true },
  { id: "offer_print_student", businessId: "biz_printpoint", title: "Student printing pack", description: "100 B/W pages or 20 color prints.", category: "services", offerType: "studentOffer", price: 5, originalPrice: 9, maxClaims: 100, currentClaims: 38, views: 420, tags: ["printing", "fast", "student-friendly"], studentOnly: true },
  { id: "offer_bright_intro", businessId: "biz_brightminds", title: "$10 tutoring intro session", description: "45-minute intro session in any subject.", category: "services", offerType: "appointmentSlot", price: 10, originalPrice: 25, maxClaims: 25, currentClaims: 13, views: 250, tags: ["tutoring", "student-friendly"], verificationRequired: true },

  { id: "offer_pulse_trial", businessId: "biz_pulse", title: "Free gym trial class", description: "One drop-in group class, no commitment.", category: "fitness", offerType: "freeTrial", price: 0, maxClaims: 60, currentClaims: 27, views: 480, tags: ["gym", "classes"] },
  { id: "offer_pulse_month", businessId: "biz_pulse", title: "Student month pass", description: "Unlimited access for 30 days.", category: "fitness", offerType: "studentOffer", price: 29, originalPrice: 45, maxClaims: 40, currentClaims: 10, views: 200, tags: ["gym", "student-friendly"], studentOnly: true, verificationRequired: true },
  { id: "offer_summit_intro", businessId: "biz_summit", title: "Intro climb + gear", description: "Belay lesson, shoes, and harness.", category: "fitness", offerType: "discount", price: 18, originalPrice: 28, maxClaims: 30, currentClaims: 14, views: 260, tags: ["climbing", "group-friendly"] },

  { id: "offer_scholar_day", businessId: "biz_scholarspace", title: "All-day study pass", description: "Desk + refills until close.", category: "education", offerType: "studentOffer", price: 6, originalPrice: 10, maxClaims: 80, currentClaims: 33, views: 350, tags: ["study", "quiet", "student-friendly"], studentOnly: true },
  { id: "offer_scholar_room", businessId: "biz_scholarspace", title: "Group study room hour", description: "Private room for up to 6.", category: "education", offerType: "groupOffer", price: 12, originalPrice: 20, maxClaims: 30, currentClaims: 6, views: 120, tags: ["study", "group-friendly"] },
  { id: "offer_exam_workshop", businessId: "biz_examedge", title: "SAT crash workshop", description: "Two-hour strategy + practice clinic.", category: "education", offerType: "event", price: 20, originalPrice: 40, maxClaims: 24, currentClaims: 16, views: 180, tags: ["test-prep", "student-friendly"], studentOnly: true },

  { id: "offer_fixly_protector", businessId: "biz_fixly", title: "20% off screen protector", description: "Tempered glass, installed in-store.", category: "repair", offerType: "discount", price: 16, originalPrice: 20, maxClaims: 60, currentClaims: 24, views: 300, tags: ["phone-repair", "fast"] },
  { id: "offer_fixly_screen", businessId: "biz_fixly", title: "Phone screen replacement", description: "Same-day screen repair, most models.", category: "repair", offerType: "limitedTime", price: 79, originalPrice: 110, maxClaims: 20, currentClaims: 8, views: 220, tags: ["phone-repair"], verificationRequired: true },
  { id: "offer_cycle_tune", businessId: "biz_cyclewerks", title: "Spring tune-up", description: "Brakes, gears, and safety check.", category: "repair", offerType: "discount", price: 35, originalPrice: 50, maxClaims: 30, currentClaims: 7, views: 140, tags: ["bike-repair"] },

  { id: "offer_escape_group", businessId: "biz_escapelab", title: "Group escape room discount", description: "Per-person rate for groups of 4+.", category: "entertainment", offerType: "groupOffer", price: 22, originalPrice: 32, maxClaims: 40, currentClaims: 20, views: 410, tags: ["escape-room", "group-friendly"] },
  { id: "offer_pixel_night", businessId: "biz_pixelarcade", title: "Student arcade night pass", description: "Unlimited play, Thursdays 6-10 PM.", category: "entertainment", offerType: "studentOffer", price: 10, originalPrice: 18, maxClaims: 50, currentClaims: 26, views: 280, tags: ["arcade", "student-friendly", "group-friendly"], studentOnly: true },
  { id: "offer_pixel_party", businessId: "biz_pixelarcade", title: "Birthday group package", description: "Reserved zone + tokens for 6.", category: "entertainment", offerType: "groupOffer", price: 60, originalPrice: 84, maxClaims: 15, currentClaims: 3, views: 70, tags: ["arcade", "group-friendly"] },
];

/**
 * Builds the seeded offers relative to `now` so active offers are genuinely
 * in-window during a demo and expired offers are genuinely in the past.
 */
export function buildSeedOffers(now: Date = new Date()): Offer[] {
  const created = "2025-09-01T12:00:00.000Z";
  return SPECS.map((s) => {
    const daysValid = s.daysValid ?? 14;
    const validFrom = new Date(now.getTime() - 2 * MS_PER_DAY).toISOString();
    const validUntil = s.expired
      ? new Date(now.getTime() - 2 * MS_PER_DAY).toISOString()
      : new Date(now.getTime() + daysValid * MS_PER_DAY).toISOString();
    return {
      id: s.id,
      businessId: s.businessId,
      title: s.title,
      description: s.description,
      category: s.category,
      offerType: s.offerType,
      price: s.price,
      originalPrice: s.originalPrice,
      validFrom,
      validUntil,
      maxClaims: s.maxClaims ?? 30,
      currentClaims: s.currentClaims ?? 0,
      views: s.views ?? 0,
      tags: s.tags ?? [],
      studentOnly: s.studentOnly ?? false,
      verificationRequired: s.verificationRequired ?? false,
      oneTimePerUser: s.oneTimePerUser ?? true,
      redemptionWindowMinutes: s.redemptionWindowMinutes ?? 5,
      active: !s.expired,
      createdAt: created,
    };
  });
}
