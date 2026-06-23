import type { Review } from '@/models'
import { isoFrom } from '@/utils/dateTime'

/**
 * Seeded review history (the PRD asks for 40+). Four of these are tied to the
 * actually-redeemed seed claims; the rest represent prior verified redemptions
 * so businesses already have credible ratings on first load. `days` is the
 * createdAt offset from now; `claim` defaults to a synthetic historical id.
 */
type ReviewSpec = {
  biz: string
  offer: string
  user: string
  rating: number
  text: string
  tags: string[]
  verified: boolean
  days: number
  claim?: string
}

const SPECS: ReviewSpec[] = [
  /* Reviews backed by real redeemed seed claims */
  { biz: 'b_bowlco', offer: 'o_bowlco_build', user: 'u_lucas', rating: 5, text: 'Bowl was huge for the price and ready in about three minutes. Easy lunch between classes.', tags: ['Good value', 'Fast service'], verified: true, days: -19, claim: 'claim_bowlco' },
  { biz: 'b_pageturner', offer: 'o_page_blinddate', user: 'u_lucas', rating: 4, text: 'Loved the blind-date book idea. Got a mystery thriller I never would have picked myself.', tags: ['Good quality', 'Friendly staff'], verified: true, days: -34, claim: 'claim_page' },
  { biz: 'b_quickprint', offer: 'o_quick_studentprint', user: 'u_maya', rating: 5, text: 'Printed my whole project for five dollars and it was done before I finished my coffee.', tags: ['Good value', 'Fast service', 'Student-friendly'], verified: true, days: -14, claim: 'claim_quick' },
  { biz: 'b_fixhub', offer: 'o_fix_protector', user: 'u_ethan', rating: 4, text: 'Fitted the protector perfectly, no bubbles. In and out in ten minutes.', tags: ['Fast service', 'Good quality'], verified: true, days: -24, claim: 'claim_fix' },

  /* FreshBowl Cafe */
  { biz: 'b_freshbowl', offer: 'o_freshbowl_lunch', user: 'u_maya', rating: 5, text: 'The student bowl is unreal value and the staff actually remember your order.', tags: ['Good value', 'Student-friendly', 'Friendly staff'], verified: true, days: -8 },
  { biz: 'b_freshbowl', offer: 'o_freshbowl_lunch', user: 'u_ethan', rating: 5, text: 'Fresh ingredients, quick line, and a quiet corner to eat. Go-to after school.', tags: ['Good quality', 'Fast service'], verified: true, days: -21 },
  { biz: 'b_freshbowl', offer: 'o_freshbowl_combo', user: 'u_lucas', rating: 4, text: 'Soup and half bowl combo is the perfect size if you are not super hungry.', tags: ['Good value'], verified: true, days: -45 },
  { biz: 'b_freshbowl', offer: 'o_freshbowl_lunch', user: 'u_maya', rating: 5, text: 'Lots of vegetarian options and everything tastes clean and fresh.', tags: ['Good quality', 'Clean'], verified: false, days: -60 },

  /* Caffeine Theory */
  { biz: 'b_caffeine', offer: 'o_caffeine_latte', user: 'u_lucas', rating: 5, text: 'Three dollar iced latte after school is the deal of the year. Quiet upstairs too.', tags: ['Good value', 'Quiet', 'Student-friendly'], verified: true, days: -11 },
  { biz: 'b_caffeine', offer: 'o_caffeine_studypass', user: 'u_maya', rating: 5, text: 'Study pass got me a whole afternoon of outlets and refills. Perfect during exams.', tags: ['Quiet', 'Student-friendly', 'Good value'], verified: true, days: -30 },
  { biz: 'b_caffeine', offer: 'o_caffeine_pastry', user: 'u_ethan', rating: 4, text: 'Great coffee and the pastry bundle is a nice touch. Gets busy at peak times.', tags: ['Good quality', 'Friendly staff'], verified: true, days: -52 },
  { biz: 'b_caffeine', offer: 'o_caffeine_latte', user: 'u_ethan', rating: 5, text: 'Genuinely the best study spot near campus. Calm, clean, friendly baristas.', tags: ['Quiet', 'Clean', 'Friendly staff'], verified: false, days: -70 },

  /* Bowl & Co */
  { biz: 'b_bowlco', offer: 'o_bowlco_student', user: 'u_maya', rating: 4, text: 'Student combo is filling and cheap. Wish the line moved a touch faster at noon.', tags: ['Good value', 'Student-friendly'], verified: true, days: -33 },
  { biz: 'b_bowlco', offer: 'o_bowlco_build', user: 'u_ethan', rating: 5, text: 'Build-your-own means I get exactly what I want every time. Big portions.', tags: ['Good value', 'Good quality'], verified: false, days: -58 },

  /* Maple & Main Diner */
  { biz: 'b_maplemain', offer: 'o_maple_lunchplate', user: 'u_lucas', rating: 4, text: 'Classic diner energy. The weekday lunch plate is a steal and the booths fit a group.', tags: ['Good value', 'Group-friendly'], verified: true, days: -26 },
  { biz: 'b_maplemain', offer: 'o_maple_familydinner', user: 'u_ethan', rating: 4, text: 'Took the family for the dinner deal, everyone left full. Service was warm.', tags: ['Group-friendly', 'Friendly staff'], verified: true, days: -48 },
  { biz: 'b_maplemain', offer: 'o_maple_lunchplate', user: 'u_maya', rating: 3, text: 'Food is solid but it was a bit slow when they got busy. Still good value.', tags: ['Good value'], verified: false, days: -75 },

  /* Sugar Lab */
  { biz: 'b_sugarlab', offer: 'o_sugar_sundae', user: 'u_maya', rating: 5, text: 'The two-scoop sundae is generous and the flavours rotate weekly. So good.', tags: ['Good quality', 'Good value'], verified: true, days: -18 },
  { biz: 'b_sugarlab', offer: 'o_sugar_cake', user: 'u_lucas', rating: 4, text: 'Ordered a mini cake for a birthday, looked and tasted great. Easy pickup.', tags: ['Good quality', 'Friendly staff'], verified: false, days: -64 },

  /* The Thrifted Fox */
  { biz: 'b_thriftedfox', offer: 'o_fox_hoodie', user: 'u_ethan', rating: 4, text: 'Scored a clean vintage hoodie in the weekly drop for fourteen bucks. Great finds.', tags: ['Good value', 'Good quality'], verified: true, days: -23 },
  { biz: 'b_thriftedfox', offer: 'o_fox_bundle', user: 'u_maya', rating: 4, text: 'Tote bundle is fun if you like digging. Staff are super friendly and helpful.', tags: ['Good value', 'Friendly staff'], verified: false, days: -55 },

  /* Northside Gift Co. */
  { biz: 'b_northsidegift', offer: 'o_north_under15', user: 'u_lucas', rating: 4, text: 'Grabbed a last-minute gift under fifteen and they wrapped it for free. Clutch.', tags: ['Good value', 'Friendly staff'], verified: true, days: -40 },
  { biz: 'b_northsidegift', offer: 'o_north_under15', user: 'u_ethan', rating: 3, text: 'Decent selection, a little pricey on some shelves but the deal items are good.', tags: ['Good quality'], verified: false, days: -80 },

  /* SharpLine Barbers */
  { biz: 'b_sharpline', offer: 'o_sharp_studentcut', user: 'u_lucas', rating: 5, text: 'Best fade I have gotten and the student price is unbeatable. Booked again already.', tags: ['Good value', 'Student-friendly', 'Good quality'], verified: true, days: -17 },
  { biz: 'b_sharpline', offer: 'o_sharp_cutbeard', user: 'u_ethan', rating: 5, text: 'Cut and beard trim combo was sharp and quick. Barbers know what they are doing.', tags: ['Fast service', 'Good quality'], verified: true, days: -38 },
  { biz: 'b_sharpline', offer: 'o_sharp_studentcut', user: 'u_maya', rating: 4, text: 'Clean shop, friendly chair-side chat, in and out in half an hour.', tags: ['Clean', 'Friendly staff', 'Fast service'], verified: false, days: -66 },

  /* Lumière Salon */
  { biz: 'b_lumiere', offer: 'o_lumiere_studenttrim', user: 'u_maya', rating: 5, text: 'Tuesday student trim left my hair looking salon-fresh for way less. Loved it.', tags: ['Good value', 'Student-friendly', 'Good quality'], verified: true, days: -29 },
  { biz: 'b_lumiere', offer: 'o_lumiere_gloss', user: 'u_lucas', rating: 4, text: 'Gloss and blow-dry came out beautifully. A little wait past my appointment time.', tags: ['Good quality'], verified: false, days: -57 },

  /* QuickPrint Studio */
  { biz: 'b_quickprint', offer: 'o_quick_poster', user: 'u_ethan', rating: 4, text: 'A1 poster looked crisp and was ready same day. Reliable for project deadlines.', tags: ['Fast service', 'Good quality'], verified: true, days: -42 },

  /* Stitch & Hem Alterations */
  { biz: 'b_stitchhem', offer: 'o_stitch_hem', user: 'u_maya', rating: 5, text: 'Hemmed my pants perfectly and fixed a seam in a day. Friendly and fair priced.', tags: ['Fast service', 'Friendly staff', 'Good value'], verified: true, days: -31 },

  /* Pulse Gym */
  { biz: 'b_pulsegym', offer: 'o_pulse_trial', user: 'u_ethan', rating: 4, text: 'Free trial class was a great intro. Clean equipment and not too crowded.', tags: ['Clean', 'Student-friendly'], verified: true, days: -20 },
  { biz: 'b_pulsegym', offer: 'o_pulse_studentmonth', user: 'u_maya', rating: 4, text: 'Student month pass is excellent value. Lots of machines and good hours.', tags: ['Good value', 'Student-friendly'], verified: true, days: -44 },
  { biz: 'b_pulsegym', offer: 'o_pulse_trial', user: 'u_lucas', rating: 3, text: 'Good gym overall, but the trial sign-up took a while at the front desk.', tags: ['Clean'], verified: false, days: -72 },

  /* CoreFlow Studio */
  { biz: 'b_coreflow', offer: 'o_core_dropin', user: 'u_maya', rating: 5, text: 'Drop-in flow class was calm and well taught. Studio is spotless and quiet.', tags: ['Quiet', 'Clean', 'Good quality'], verified: true, days: -27 },
  { biz: 'b_coreflow', offer: 'o_core_intro', user: 'u_lucas', rating: 4, text: 'Intro pack let me try a few styles. Instructors are encouraging to beginners.', tags: ['Friendly staff', 'Good value'], verified: false, days: -61 },

  /* BrightPath Tutoring */
  { biz: 'b_brightpath', offer: 'o_bright_intro', user: 'u_maya', rating: 5, text: 'Ten dollar intro session was worth way more. My tutor explained calculus so clearly.', tags: ['Good value', 'Student-friendly', 'Good quality'], verified: true, days: -36 },
  { biz: 'b_brightpath', offer: 'o_bright_group', user: 'u_ethan', rating: 5, text: 'Group sessions are affordable and surprisingly focused. Grades went up.', tags: ['Good value', 'Group-friendly'], verified: false, days: -68 },

  /* TestPeak Prep */
  { biz: 'b_testpeak', offer: 'o_testpeak_workshop', user: 'u_lucas', rating: 4, text: 'SAT workshop had useful strategies and realistic practice. Long but worth it.', tags: ['Good quality', 'Student-friendly'], verified: true, days: -50 },

  /* GearUp Bike & Laptop */
  { biz: 'b_gearup', offer: 'o_gearup_tuneup', user: 'u_ethan', rating: 5, text: 'Bike tune-up made it feel brand new. Honest about what actually needed fixing.', tags: ['Good quality', 'Friendly staff'], verified: true, days: -34 },

  /* Riddle Room */
  { biz: 'b_riddleroom', offer: 'o_riddle_group', user: 'u_lucas', rating: 5, text: 'Did the group escape room for a birthday. Puzzles were clever and the host was great.', tags: ['Group-friendly', 'Friendly staff'], verified: true, days: -22 },
  { biz: 'b_riddleroom', offer: 'o_riddle_studentnight', user: 'u_maya', rating: 4, text: 'Student night is a fun cheap outing with friends. Rooms reset quickly between groups.', tags: ['Student-friendly', 'Group-friendly'], verified: false, days: -54 },

  /* Pixel Arcade */
  { biz: 'b_pixelarcade', offer: 'o_pixel_pass', user: 'u_ethan', rating: 4, text: 'Two-hour pass is great value with friends. Good mix of retro and new cabinets.', tags: ['Good value', 'Group-friendly'], verified: true, days: -39 },
  { biz: 'b_pixelarcade', offer: 'o_pixel_pass', user: 'u_lucas', rating: 3, text: 'Fun spot but a couple machines were out of order when we went.', tags: ['Group-friendly'], verified: false, days: -77 },
]

export function buildSeedReviews(now: Date): Review[] {
  return SPECS.map((s, i) => ({
    id: `r_${String(i + 1).padStart(3, '0')}`,
    userId: s.user,
    businessId: s.biz,
    offerId: s.offer,
    claimId: s.claim ?? `seedclaim_${String(i + 1).padStart(3, '0')}`,
    rating: s.rating,
    text: s.text,
    tags: s.tags,
    verified: s.verified,
    createdAt: isoFrom(now, { days: s.days }),
  }))
}
