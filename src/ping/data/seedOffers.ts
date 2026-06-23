import type { Offer, BusinessCategory, OfferType } from '@/models'
import { isoFrom } from '@/utils/dateTime'

type OfferState = 'active' | 'scheduled' | 'expired'

/** Compact authoring shape; validity dates are derived from `state` + `now`. */
type OfferSpec = {
  id: string
  businessId: string
  category: BusinessCategory
  title: string
  description: string
  offerType: OfferType
  price: number
  originalPrice?: number
  maxClaims: number
  currentClaims: number
  views: number
  tags: string[]
  studentOnly?: boolean
  verificationRequired?: boolean
  state?: OfferState
}

const SPECS: OfferSpec[] = [
  /* FreshBowl Cafe */
  { id: 'o_freshbowl_lunch', businessId: 'b_freshbowl', category: 'food', title: 'Student lunch bowl', description: 'Any grain bowl + a drink, after-school student price.', offerType: 'studentOffer', price: 11.99, originalPrice: 15.99, maxClaims: 40, currentClaims: 27, views: 540, tags: ['good value', 'student-friendly', 'vegetarian', 'fast service'], studentOnly: true, verificationRequired: true },
  { id: 'o_freshbowl_combo', businessId: 'b_freshbowl', category: 'food', title: 'Soup + half bowl combo', description: 'A warm soup paired with a half grain bowl.', offerType: 'discount', price: 9.5, originalPrice: 12.5, maxClaims: 30, currentClaims: 12, views: 210, tags: ['good value', 'fast service'] },
  { id: 'o_freshbowl_smoothie', businessId: 'b_freshbowl', category: 'food', title: 'Summer smoothie launch', description: 'Two-for-one on the new tropical smoothie line.', offerType: 'limitedTime', price: 5, originalPrice: 7, maxClaims: 60, currentClaims: 0, views: 12, tags: ['good value'], state: 'scheduled' },

  /* Maple & Main Diner */
  { id: 'o_maple_lunchplate', businessId: 'b_maplemain', category: 'food', title: 'Weekday lunch plate', description: 'Daily hot plate with soup or salad, 11am–3pm.', offerType: 'limitedTime', price: 13.99, originalPrice: 17.99, maxClaims: 50, currentClaims: 33, views: 480, tags: ['good value', 'group-friendly'] },
  { id: 'o_maple_familydinner', businessId: 'b_maplemain', category: 'food', title: 'Family dinner for four', description: 'Two mains, two kids meals, and a shared dessert.', offerType: 'groupOffer', price: 44, originalPrice: 56, maxClaims: 20, currentClaims: 8, views: 160, tags: ['group-friendly'] },

  /* Bowl & Co */
  { id: 'o_bowlco_build', businessId: 'b_bowlco', category: 'food', title: 'Build-your-bowl lunch', description: 'Any base, any protein, three toppings.', offerType: 'discount', price: 12.5, originalPrice: 16, maxClaims: 60, currentClaims: 41, views: 620, tags: ['good value', 'vegetarian', 'fast service'] },
  { id: 'o_bowlco_student', businessId: 'b_bowlco', category: 'food', title: 'Student combo + drink', description: 'Half bowl, side, and a fountain drink.', offerType: 'studentOffer', price: 10.99, originalPrice: 14, maxClaims: 40, currentClaims: 19, views: 300, tags: ['student-friendly', 'good value'], studentOnly: true },

  /* Caffeine Theory */
  { id: 'o_caffeine_latte', businessId: 'b_caffeine', category: 'food', title: '$3 iced latte after school', description: 'Any size iced latte, 3pm–6pm on school days.', offerType: 'studentOffer', price: 3, originalPrice: 5.25, maxClaims: 100, currentClaims: 73, views: 980, tags: ['student-friendly', 'quiet', 'fast service'], studentOnly: true, verificationRequired: true },
  { id: 'o_caffeine_studypass', businessId: 'b_caffeine', category: 'food', title: 'All-day study pass + coffee', description: 'Reserve a loft seat for the day with bottomless drip.', offerType: 'limitedTime', price: 6, originalPrice: 9, maxClaims: 40, currentClaims: 22, views: 340, tags: ['quiet', 'student-friendly', 'outlets'] },
  { id: 'o_caffeine_pastry', businessId: 'b_caffeine', category: 'food', title: 'Pastry + coffee bundle', description: 'Any pastry with a small house coffee.', offerType: 'bundle', price: 5.5, originalPrice: 7.5, maxClaims: 50, currentClaims: 15, views: 260, tags: ['good value'] },
  { id: 'o_caffeine_exam', businessId: 'b_caffeine', category: 'food', title: 'Exam-week all-nighter combo', description: 'Large coffee + two refills during exam season.', offerType: 'limitedTime', price: 7, originalPrice: 11, maxClaims: 60, currentClaims: 58, views: 510, tags: ['student-friendly'], state: 'expired' },

  /* Sugar Lab */
  { id: 'o_sugar_sundae', businessId: 'b_sugarlab', category: 'food', title: 'Two-scoop sundae', description: 'Build a sundae with two scoops and a topping.', offerType: 'discount', price: 6.5, originalPrice: 8.5, maxClaims: 40, currentClaims: 9, views: 190, tags: ['dessert', 'student-friendly'] },
  { id: 'o_sugar_cake', businessId: 'b_sugarlab', category: 'food', title: 'Mini birthday cake', description: '4-inch made-to-order cake, 24h notice.', offerType: 'bundle', price: 18, originalPrice: 24, maxClaims: 15, currentClaims: 4, views: 90, tags: ['group-friendly'] },

  /* The Thrifted Fox */
  { id: 'o_fox_hoodie', businessId: 'b_thriftedfox', category: 'retail', title: 'Thrift hoodie drop', description: 'This week’s curated hoodie rack, one price.', offerType: 'limitedTime', price: 14, originalPrice: 28, maxClaims: 25, currentClaims: 16, views: 310, tags: ['good value', 'thrift'] },
  { id: 'o_fox_bundle', businessId: 'b_thriftedfox', category: 'retail', title: 'Student tote + 3 items', description: 'Fill a branded tote with any three rack items.', offerType: 'bundle', price: 20, maxClaims: 20, currentClaims: 6, views: 120, tags: ['good value', 'student-friendly'], studentOnly: true },

  /* Pageturner Books */
  { id: 'o_page_blinddate', businessId: 'b_pageturner', category: 'retail', title: 'Blind date with a book', description: 'A wrapped surprise read chosen by our staff.', offerType: 'limitedTime', price: 7, maxClaims: 40, currentClaims: 28, views: 410, tags: ['good value', 'student-friendly', 'books'] },
  { id: 'o_page_studentlist', businessId: 'b_pageturner', category: 'retail', title: '20% off student reading list', description: 'Course and summer reading titles, student price.', offerType: 'studentOffer', price: 16, originalPrice: 20, maxClaims: 50, currentClaims: 11, views: 230, tags: ['books', 'student-friendly'], studentOnly: true },

  /* Northside Gift Co. */
  { id: 'o_north_under15', businessId: 'b_northsidegift', category: 'retail', title: 'Gift under $15 grab', description: 'Pick any tagged item from the gift wall.', offerType: 'discount', price: 12, originalPrice: 18, maxClaims: 30, currentClaims: 5, views: 95, tags: ['gifts', 'good value'] },

  /* SharpLine Barbers */
  { id: 'o_sharp_studentcut', businessId: 'b_sharpline', category: 'services', title: '$25 student haircut', description: 'Wash, cut, and style at the student rate.', offerType: 'studentOffer', price: 25, originalPrice: 32, maxClaims: 30, currentClaims: 18, views: 360, tags: ['student-friendly', 'fast service', 'haircut'], studentOnly: true, verificationRequired: true },
  { id: 'o_sharp_cutbeard', businessId: 'b_sharpline', category: 'services', title: 'Cut + beard trim', description: 'A full cut paired with a shaped beard trim.', offerType: 'bundle', price: 38, originalPrice: 47, maxClaims: 20, currentClaims: 7, views: 150, tags: ['fast service'] },
  { id: 'o_sharp_backtoschool', businessId: 'b_sharpline', category: 'services', title: 'Back-to-school cut', description: 'Fresh cut before the first week of classes.', offerType: 'limitedTime', price: 22, originalPrice: 30, maxClaims: 40, currentClaims: 40, views: 520, tags: ['student-friendly'], state: 'expired' },

  /* Lumière Salon */
  { id: 'o_lumiere_gloss', businessId: 'b_lumiere', category: 'services', title: 'Gloss + blow-dry', description: 'A shine gloss treatment with a styled blow-dry.', offerType: 'appointmentSlot', price: 55, originalPrice: 75, maxClaims: 12, currentClaims: 4, views: 130, tags: ['salon'] },
  { id: 'o_lumiere_studenttrim', businessId: 'b_lumiere', category: 'services', title: 'Student trim Tuesdays', description: 'Tuesday-only trim and style for students.', offerType: 'studentOffer', price: 30, originalPrice: 40, maxClaims: 16, currentClaims: 6, views: 110, tags: ['student-friendly', 'salon'], studentOnly: true },

  /* QuickPrint Studio */
  { id: 'o_quick_studentprint', businessId: 'b_quickprint', category: 'services', title: 'Printing discount for students', description: '50 colour pages or 150 B&W at student rate.', offerType: 'studentOffer', price: 5, originalPrice: 9, maxClaims: 80, currentClaims: 34, views: 520, tags: ['good value', 'fast service', 'student-friendly', 'printing'], studentOnly: true },
  { id: 'o_quick_poster', businessId: 'b_quickprint', category: 'services', title: 'A1 poster print', description: 'Large-format poster, same-day pickup.', offerType: 'discount', price: 12, originalPrice: 18, maxClaims: 30, currentClaims: 9, views: 140, tags: ['fast service'] },

  /* Stitch & Hem Alterations */
  { id: 'o_stitch_hem', businessId: 'b_stitchhem', category: 'services', title: 'Hem + small repair', description: 'Hem one garment plus a minor seam repair.', offerType: 'discount', price: 12, originalPrice: 18, maxClaims: 25, currentClaims: 5, views: 95, tags: ['alterations', 'fast service'] },

  /* Pulse Gym */
  { id: 'o_pulse_trial', businessId: 'b_pulsegym', category: 'fitness', title: 'Free gym trial class', description: 'A free drop-in class and full facility access.', offerType: 'freeTrial', price: 0, maxClaims: 50, currentClaims: 29, views: 700, tags: ['student-friendly', 'gym trial'], verificationRequired: true },
  { id: 'o_pulse_studentmonth', businessId: 'b_pulsegym', category: 'fitness', title: 'Student month pass', description: 'Unlimited access for one month, student price.', offerType: 'studentOffer', price: 19, originalPrice: 35, maxClaims: 40, currentClaims: 14, views: 280, tags: ['student-friendly', 'good value'], studentOnly: true },

  /* CoreFlow Studio */
  { id: 'o_core_dropin', businessId: 'b_coreflow', category: 'fitness', title: 'Drop-in flow class', description: 'A single drop-in vinyasa or pilates class.', offerType: 'discount', price: 12, originalPrice: 20, maxClaims: 20, currentClaims: 8, views: 180, tags: ['drop-in', 'quiet'] },
  { id: 'o_core_intro', businessId: 'b_coreflow', category: 'fitness', title: '3-class intro pack', description: 'Three classes for first-time visitors.', offerType: 'bundle', price: 30, originalPrice: 54, maxClaims: 25, currentClaims: 6, views: 150, tags: ['good value'] },

  /* BrightPath Tutoring */
  { id: 'o_bright_intro', businessId: 'b_brightpath', category: 'education', title: '$10 tutoring intro session', description: 'A 45-minute intro session in any subject.', offerType: 'limitedTime', price: 10, originalPrice: 35, maxClaims: 30, currentClaims: 17, views: 290, tags: ['student-friendly', 'good value', 'tutoring'], verificationRequired: true },
  { id: 'o_bright_group', businessId: 'b_brightpath', category: 'education', title: 'Group study session', description: 'A 90-minute small-group session, per student.', offerType: 'groupOffer', price: 8, maxClaims: 24, currentClaims: 9, views: 130, tags: ['student-friendly', 'group-friendly'] },

  /* TestPeak Prep */
  { id: 'o_testpeak_workshop', businessId: 'b_testpeak', category: 'education', title: 'SAT crash workshop', description: 'A weekend SAT strategy and practice workshop.', offerType: 'event', price: 25, originalPrice: 40, maxClaims: 20, currentClaims: 7, views: 160, tags: ['test prep'] },
  { id: 'o_testpeak_diag', businessId: 'b_testpeak', category: 'education', title: 'Free diagnostic test', description: 'A full proctored diagnostic with a score report.', offerType: 'freeTrial', price: 0, maxClaims: 40, currentClaims: 12, views: 220, tags: ['student-friendly', 'test prep'] },

  /* FixHub Phone Repair */
  { id: 'o_fix_protector', businessId: 'b_fixhub', category: 'repair', title: '20% off phone screen protector', description: 'Tempered-glass protector, fitted in store.', offerType: 'discount', price: 16, originalPrice: 20, maxClaims: 50, currentClaims: 21, views: 380, tags: ['fast service', 'good value', 'phone repair'] },
  { id: 'o_fix_screen', businessId: 'b_fixhub', category: 'repair', title: 'Phone screen replacement', description: 'Common-model screen replacement while you wait.', offerType: 'limitedTime', price: 79, originalPrice: 99, maxClaims: 25, currentClaims: 11, views: 240, tags: ['phone repair'] },

  /* GearUp Bike & Laptop */
  { id: 'o_gearup_tuneup', businessId: 'b_gearup', category: 'repair', title: 'Bike tune-up', description: 'Brakes, gears, and a full safety check.', offerType: 'discount', price: 35, originalPrice: 50, maxClaims: 20, currentClaims: 6, views: 130, tags: ['bike repair'] },
  { id: 'o_gearup_laptop', businessId: 'b_gearup', category: 'repair', title: 'Laptop diagnostic + clean', description: 'Hardware diagnostic and internal clean-out.', offerType: 'discount', price: 45, originalPrice: 65, maxClaims: 18, currentClaims: 4, views: 100, tags: ['laptop repair'] },

  /* Riddle Room */
  { id: 'o_riddle_group', businessId: 'b_riddleroom', category: 'entertainment', title: 'Group escape room discount', description: 'Per-person price for groups of four or more.', offerType: 'groupOffer', price: 22, originalPrice: 30, maxClaims: 30, currentClaims: 19, views: 420, tags: ['group-friendly'] },
  { id: 'o_riddle_studentnight', businessId: 'b_riddleroom', category: 'entertainment', title: 'Student night entry', description: 'Thursday student-night single-room entry.', offerType: 'studentOffer', price: 18, originalPrice: 26, maxClaims: 24, currentClaims: 8, views: 200, tags: ['student-friendly', 'group-friendly'], studentOnly: true },

  /* Pixel Arcade */
  { id: 'o_pixel_pass', businessId: 'b_pixelarcade', category: 'entertainment', title: '2-hour game pass', description: 'Two hours of unlimited cabinet play.', offerType: 'limitedTime', price: 15, originalPrice: 22, maxClaims: 40, currentClaims: 13, views: 260, tags: ['good value', 'group-friendly'] },
]

export function buildSeedOffers(now: Date): Offer[] {
  const createdAt = isoFrom(now, { days: -40 })

  return SPECS.map((s) => {
    const state: OfferState = s.state ?? 'active'

    // Validity windows are anchored to "now" so active offers are always live.
    const validFrom =
      state === 'scheduled' ? isoFrom(now, { days: 5 }) : isoFrom(now, { days: state === 'expired' ? -60 : -30 })
    const validUntil =
      state === 'expired' ? isoFrom(now, { days: -6 }) : isoFrom(now, { days: state === 'scheduled' ? 40 : 45 })

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
      maxClaims: s.maxClaims,
      currentClaims: s.currentClaims,
      views: s.views,
      tags: s.tags,
      studentOnly: s.studentOnly ?? false,
      verificationRequired: s.verificationRequired ?? false,
      active: state !== 'expired',
      createdAt,
    }
  })
}
