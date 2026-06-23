import type { Business, BusinessCategory, BusinessHours } from '@/models'
import { offsetPoint } from '@/utils/distance'
import { isoFrom } from '@/utils/dateTime'
import { SCHOOL_ORIGIN } from './seedLocations'

/* ── Hours helpers (0 = Sun … 6 = Sat) ──────────────────────────────── */
const daily = (open: string, close: string): BusinessHours[] =>
  Array.from({ length: 7 }, (_, dayOfWeek) => ({ dayOfWeek, openTime: open, closeTime: close }))

const onDays = (days: number[], open: string, close: string): BusinessHours[] =>
  days.map((dayOfWeek) => ({ dayOfWeek, openTime: open, closeTime: close }))

const WEEKDAYS = [1, 2, 3, 4, 5]
const MON_SAT = [1, 2, 3, 4, 5, 6]
const TUE_SUN = [2, 3, 4, 5, 6, 0]
const TUE_SAT = [2, 3, 4, 5, 6]

/**
 * A compact spec for each business. `n` / `e` are kilometres North / East of
 * the school origin, so the resulting coordinates sit at deliberate distances
 * (e.g. FreshBowl Cafe lands ~1.8 km away, matching the PRD example).
 */
type BusinessSpec = {
  id: string
  name: string
  category: BusinessCategory
  owner: 'u_sam' | 'u_nina'
  n: number
  e: number
  rating: number
  reviews: number
  verified: boolean
  price: 1 | 2 | 3 | 4
  tags: string[]
  a11y: string[]
  hours: BusinessHours[]
  desc: string
  address: string
}

const SPECS: BusinessSpec[] = [
  /* ── Food (5) ─────────────────────────────────────────────────────── */
  {
    id: 'b_freshbowl', name: 'FreshBowl Cafe', category: 'food', owner: 'u_sam',
    n: 1.2, e: 1.3, rating: 4.7, reviews: 42, verified: true, price: 1,
    tags: ['student-friendly', 'vegetarian options', 'fast service', 'good value'],
    a11y: ['wheelchair accessible', 'quiet corner'], hours: daily('07:30', '21:00'),
    desc: 'Build-your-own grain bowls and smoothies, two minutes from campus.',
    address: '120 Maple Grove Dr, Oakville',
  },
  {
    id: 'b_maplemain', name: 'Maple & Main Diner', category: 'food', owner: 'u_nina',
    n: 2.6, e: -1.2, rating: 4.4, reviews: 88, verified: true, price: 2,
    tags: ['group-friendly', 'comfort food', 'good value'],
    a11y: ['wheelchair accessible'], hours: daily('07:00', '22:00'),
    desc: 'A classic all-day diner with big booths and bottomless drip coffee.',
    address: '57 Main St E, Oakville',
  },
  {
    id: 'b_bowlco', name: 'Bowl & Co', category: 'food', owner: 'u_sam',
    n: 0.6, e: 2.1, rating: 4.5, reviews: 64, verified: true, price: 1,
    tags: ['vegetarian options', 'fast service', 'good value', 'student-friendly'],
    a11y: ['wheelchair accessible'], hours: daily('10:30', '21:00'),
    desc: 'Fast, fresh poke and rice bowls with a student combo every weekday.',
    address: '88 Speers Rd, Oakville',
  },
  {
    id: 'b_caffeine', name: 'Caffeine Theory', category: 'food', owner: 'u_nina',
    n: -0.8, e: 0.9, rating: 4.8, reviews: 120, verified: true, price: 1,
    tags: ['quiet', 'outlets', 'student-friendly', 'vegetarian options'],
    a11y: ['wheelchair accessible', 'quiet environment'], hours: daily('06:30', '20:00'),
    desc: 'A study-friendly espresso bar with plenty of outlets and a quiet loft.',
    address: '14 Kerr St, Oakville',
  },
  {
    id: 'b_sugarlab', name: 'Sugar Lab', category: 'food', owner: 'u_sam',
    n: 3.1, e: 1.8, rating: 4.6, reviews: 53, verified: false, price: 2,
    tags: ['dessert', 'group-friendly'],
    a11y: ['wheelchair accessible'], hours: daily('12:00', '22:30'),
    desc: 'Small-batch ice cream, sundaes, and made-to-order mini cakes.',
    address: '210 Lakeshore Rd E, Oakville',
  },

  /* ── Retail (3) ───────────────────────────────────────────────────── */
  {
    id: 'b_thriftedfox', name: 'The Thrifted Fox', category: 'retail', owner: 'u_nina',
    n: -1.4, e: 2.4, rating: 4.3, reviews: 37, verified: true, price: 1,
    tags: ['thrift', 'good value', 'sustainable'],
    a11y: ['wheelchair accessible'], hours: daily('11:00', '19:00'),
    desc: 'Curated second-hand streetwear with weekly hoodie and denim drops.',
    address: '32 Rebecca St, Oakville',
  },
  {
    id: 'b_pageturner', name: 'Pageturner Books', category: 'retail', owner: 'u_sam',
    n: 0.9, e: -1.6, rating: 4.7, reviews: 71, verified: true, price: 2,
    tags: ['books', 'gifts', 'quiet', 'student-friendly'],
    a11y: ['wheelchair accessible', 'quiet environment'], hours: daily('09:00', '20:00'),
    desc: 'Independent bookshop with a famous "blind date with a book" wall.',
    address: '149 Lakeshore Rd W, Oakville',
  },
  {
    id: 'b_northsidegift', name: 'Northside Gift Co.', category: 'retail', owner: 'u_nina',
    n: 4.2, e: 2.6, rating: 4.2, reviews: 29, verified: false, price: 2,
    tags: ['gifts', 'group-friendly'],
    a11y: ['wheelchair accessible'], hours: daily('10:00', '19:00'),
    desc: 'Stationery, candles, and gift bundles for every last-minute occasion.',
    address: '405 North Service Rd, Oakville',
  },

  /* ── Services (4) ─────────────────────────────────────────────────── */
  {
    id: 'b_sharpline', name: 'SharpLine Barbers', category: 'services', owner: 'u_sam',
    n: 1.6, e: 0.4, rating: 4.6, reviews: 94, verified: true, price: 2,
    tags: ['student-friendly', 'fast service', 'haircut'],
    a11y: ['wheelchair accessible'], hours: onDays(TUE_SUN, '09:00', '19:00'),
    desc: 'Skin fades, classic cuts, and student pricing on weekday afternoons.',
    address: '76 Trafalgar Rd, Oakville',
  },
  {
    id: 'b_lumiere', name: 'Lumière Salon', category: 'services', owner: 'u_nina',
    n: 2.2, e: -2.1, rating: 4.5, reviews: 66, verified: true, price: 3,
    tags: ['salon', 'by appointment'],
    a11y: ['wheelchair accessible'], hours: daily('09:00', '20:00'),
    desc: 'Colour, gloss, and styling studio with a Tuesday student trim deal.',
    address: '11 George St, Oakville',
  },
  {
    id: 'b_quickprint', name: 'QuickPrint Studio', category: 'services', owner: 'u_sam',
    n: -0.5, e: -1.1, rating: 4.4, reviews: 40, verified: true, price: 1,
    tags: ['printing', 'fast service', 'good value', 'student-friendly'],
    a11y: ['wheelchair accessible'], hours: [...onDays(WEEKDAYS, '08:00', '19:00'), ...onDays([6], '10:00', '16:00')],
    desc: 'Posters, assignments, and binding with same-day student rates.',
    address: '5 Cross Ave, Oakville',
  },
  {
    id: 'b_stitchhem', name: 'Stitch & Hem Alterations', category: 'services', owner: 'u_nina',
    n: 2.9, e: 3.3, rating: 4.6, reviews: 22, verified: false, price: 2,
    tags: ['alterations', 'fast service'],
    a11y: ['wheelchair accessible'], hours: onDays(TUE_SAT, '10:00', '18:00'),
    desc: 'Quick hems, repairs, and tailoring with most jobs done in a day.',
    address: '63 Dunn St, Oakville',
  },

  /* ── Fitness (2) ──────────────────────────────────────────────────── */
  {
    id: 'b_pulsegym', name: 'Pulse Gym', category: 'fitness', owner: 'u_sam',
    n: -2.2, e: 1.0, rating: 4.3, reviews: 110, verified: true, price: 2,
    tags: ['gym trial', 'student-friendly', 'group-friendly'],
    a11y: ['wheelchair accessible', 'accessible washroom'], hours: daily('05:30', '23:00'),
    desc: 'Full-size gym with free trial classes and a student month pass.',
    address: '300 Iroquois Shore Rd, Oakville',
  },
  {
    id: 'b_coreflow', name: 'CoreFlow Studio', category: 'fitness', owner: 'u_nina',
    n: 0.7, e: 4.0, rating: 4.7, reviews: 58, verified: true, price: 3,
    tags: ['yoga', 'drop-in', 'quiet'],
    a11y: ['wheelchair accessible', 'quiet environment'], hours: daily('06:00', '21:00'),
    desc: 'Boutique yoga and pilates studio with drop-in flow classes.',
    address: '22 Bronte Rd, Oakville',
  },

  /* ── Education (2) ────────────────────────────────────────────────── */
  {
    id: 'b_brightpath', name: 'BrightPath Tutoring', category: 'education', owner: 'u_sam',
    n: 1.1, e: -0.7, rating: 4.8, reviews: 47, verified: true, price: 2,
    tags: ['tutoring', 'student-friendly', 'quiet'],
    a11y: ['wheelchair accessible', 'quiet environment'], hours: onDays(MON_SAT, '14:00', '20:00'),
    desc: 'One-on-one and small-group tutoring across high-school subjects.',
    address: '90 Sixth Line, Oakville',
  },
  {
    id: 'b_testpeak', name: 'TestPeak Prep', category: 'education', owner: 'u_nina',
    n: 3.6, e: -1.0, rating: 4.5, reviews: 33, verified: false, price: 3,
    tags: ['test prep', 'workshops'],
    a11y: ['wheelchair accessible'], hours: onDays(MON_SAT, '10:00', '20:00'),
    desc: 'SAT, ACT, and exam-prep workshops with free diagnostic tests.',
    address: '180 Speers Rd, Oakville',
  },

  /* ── Repair (2) ───────────────────────────────────────────────────── */
  {
    id: 'b_fixhub', name: 'FixHub Phone Repair', category: 'repair', owner: 'u_sam',
    n: -1.0, e: -2.6, rating: 4.4, reviews: 76, verified: true, price: 2,
    tags: ['phone repair', 'fast service', 'good value'],
    a11y: ['wheelchair accessible'], hours: onDays(MON_SAT, '10:00', '19:00'),
    desc: 'Screen, battery, and charge-port repairs while you wait.',
    address: '41 Lakeshore Rd E, Oakville',
  },
  {
    id: 'b_gearup', name: 'GearUp Bike & Laptop', category: 'repair', owner: 'u_nina',
    n: 4.8, e: 0.6, rating: 4.6, reviews: 41, verified: true, price: 2,
    tags: ['bike repair', 'laptop repair'],
    a11y: ['wheelchair accessible'], hours: onDays(TUE_SAT, '09:30', '18:30'),
    desc: 'Tune-ups and diagnostics for bikes, laptops, and everything in between.',
    address: '520 Trafalgar Rd, Oakville',
  },

  /* ── Entertainment (2) ────────────────────────────────────────────── */
  {
    id: 'b_riddleroom', name: 'Riddle Room', category: 'entertainment', owner: 'u_sam',
    n: -2.8, e: 2.2, rating: 4.7, reviews: 89, verified: true, price: 2,
    tags: ['escape room', 'group-friendly'],
    a11y: ['wheelchair accessible'], hours: daily('11:00', '23:00'),
    desc: 'Four themed escape rooms with student-night and group discounts.',
    address: '7 Church St, Oakville',
  },
  {
    id: 'b_pixelarcade', name: 'Pixel Arcade', category: 'entertainment', owner: 'u_nina',
    n: 5.0, e: -2.4, rating: 4.4, reviews: 62, verified: false, price: 1,
    tags: ['arcade', 'group-friendly', 'good value'],
    a11y: ['wheelchair accessible'], hours: daily('12:00', '23:59'),
    desc: 'Retro cabinets, modern racers, and hourly game passes.',
    address: '612 Kerr St, Oakville',
  },
]

export function buildSeedBusinesses(now: Date): Business[] {
  const createdAt = isoFrom(now, { days: -210 })
  return SPECS.map((s) => ({
    id: s.id,
    name: s.name,
    category: s.category,
    description: s.desc,
    address: s.address,
    location: offsetPoint(SCHOOL_ORIGIN, s.n, s.e),
    hours: s.hours,
    ratingAverage: s.rating,
    reviewCount: s.reviews,
    verified: s.verified,
    priceLevel: s.price,
    tags: s.tags,
    accessibilityFeatures: s.a11y,
    ownerUserId: s.owner,
    createdAt,
  }))
}
