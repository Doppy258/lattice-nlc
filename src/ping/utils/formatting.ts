import type {
  BusinessCategory,
  NeedType,
  OfferType,
} from '@/models'

/* ─────────────────────────── Numbers & money ────────────────────────── */

/** "$11.99". Whole dollar amounts drop the cents → "$25". */
export function formatCurrency(amount: number): string {
  const hasCents = Math.round(amount * 100) % 100 !== 0
  return `$${amount.toLocaleString('en-US', {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  })}`
}

/** Like formatCurrency but renders 0 as "Free". */
export function formatPrice(amount: number): string {
  return amount <= 0 ? 'Free' : formatCurrency(amount)
}

/** "1.8 km" for ≥1km, "850 m" below that. */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}

/** One-decimal rating, e.g. 4.7. */
export function formatRating(rating: number): string {
  return rating.toFixed(1)
}

/** Ratio (0–1 or 0–100) → "91%". Pass `fromRatio` when input is 0–1. */
export function formatPercent(value: number, fromRatio = false): string {
  const pct = fromRatio ? value * 100 : value
  return `${Math.round(pct)}%`
}

/** "$$" for a 1–4 price level. */
export function priceLevelLabel(level: 1 | 2 | 3 | 4): string {
  return '$'.repeat(level)
}

/** Simple count + noun, pluralised. */
export function pluralize(count: number, singular: string, plural?: string): string {
  const word = count === 1 ? singular : plural ?? `${singular}s`
  return `${count} ${word}`
}

/* ───────────────────────────── Label maps ───────────────────────────── */

export const CATEGORY_LABELS: Record<BusinessCategory, string> = {
  food: 'Food',
  retail: 'Retail',
  services: 'Services',
  fitness: 'Fitness',
  education: 'Education',
  repair: 'Repair',
  entertainment: 'Entertainment',
}

export const NEED_TYPE_LABELS: Record<NeedType, string> = {
  lunch: 'Lunch',
  cafeStudySpot: 'Cafe / study spot',
  dessert: 'Dessert',
  dinner: 'Dinner',
  groupMeal: 'Group meal',
  gift: 'Gift',
  clothing: 'Clothing',
  books: 'Books',
  thrift: 'Thrift item',
  schoolSupplies: 'School supplies',
  haircut: 'Haircut',
  printing: 'Printing',
  alterations: 'Alterations',
  tutoring: 'Tutoring',
  gymTrial: 'Gym trial',
  phoneRepair: 'Phone repair',
  laptopRepair: 'Laptop repair',
  escapeRoom: 'Escape room',
  localEvent: 'Local event',
  groupHangout: 'Group hangout',
}

export const OFFER_TYPE_LABELS: Record<OfferType, string> = {
  discount: 'Discount',
  limitedTime: 'Limited-time deal',
  studentOffer: 'Student offer',
  groupOffer: 'Group offer',
  appointmentSlot: 'Appointment slot',
  event: 'Event',
  freeTrial: 'Free trial',
  bundle: 'Bundle',
}

export function categoryLabel(category: BusinessCategory): string {
  return CATEGORY_LABELS[category]
}

export function needTypeLabel(need: NeedType): string {
  return NEED_TYPE_LABELS[need]
}

export function offerTypeLabel(type: OfferType): string {
  return OFFER_TYPE_LABELS[type]
}

/** First name from a full name, for compact UI ("Lucas Chen" → "Lucas"). */
export function firstName(fullName: string): string {
  return fullName.split(' ')[0]
}

/** Initials for avatars ("Lucas Chen" → "LC"). */
export function initials(fullName: string): string {
  return fullName
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}
