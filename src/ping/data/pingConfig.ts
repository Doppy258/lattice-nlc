import type { BusinessCategory, NeedType } from '@/models'
import type { IconName } from '@/components/common/Icon'
import { atTime, isoFrom, shift } from '@/utils/dateTime'

/**
 * Static configuration for the Create Ping builder: which need types, budget
 * chips, distances, time presets, and preferences belong to each category.
 * Keeping it here (not in components) keeps the builder declarative.
 */

export type CategoryMeta = {
  category: BusinessCategory
  label: string
  description: string
  icon: IconName
  needTypes: NeedType[]
}

export const CATEGORIES: CategoryMeta[] = [
  {
    category: 'food',
    label: 'Food',
    description: 'Lunch, cafes, dinner & more',
    icon: 'food',
    needTypes: ['lunch', 'cafeStudySpot', 'dessert', 'dinner', 'groupMeal'],
  },
  {
    category: 'retail',
    label: 'Retail',
    description: 'Gifts, books, clothing, thrift',
    icon: 'retail',
    needTypes: ['gift', 'clothing', 'books', 'thrift', 'schoolSupplies'],
  },
  {
    category: 'services',
    label: 'Services',
    description: 'Haircuts, printing, alterations',
    icon: 'services',
    needTypes: ['haircut', 'printing', 'alterations'],
  },
  {
    category: 'fitness',
    label: 'Fitness',
    description: 'Gym trials & drop-in classes',
    icon: 'fitness',
    needTypes: ['gymTrial'],
  },
  {
    category: 'education',
    label: 'Education',
    description: 'Tutoring & study help',
    icon: 'education',
    needTypes: ['tutoring'],
  },
  {
    category: 'repair',
    label: 'Repair',
    description: 'Phone & laptop fixes',
    icon: 'repair',
    needTypes: ['phoneRepair', 'laptopRepair'],
  },
  {
    category: 'entertainment',
    label: 'Entertainment',
    description: 'Escape rooms, events, hangouts',
    icon: 'entertainment',
    needTypes: ['escapeRoom', 'localEvent', 'groupHangout'],
  },
]

export function categoryMeta(category: BusinessCategory): CategoryMeta {
  return CATEGORIES.find((c) => c.category === category) ?? CATEGORIES[0]
}

/* ── Budget chips ─────────────────────────────────────────────────────── */

export type BudgetChip = { label: string; min?: number; max?: number }

const UNDER = (n: number): BudgetChip => ({ label: `Under $${n}`, max: n })
const RANGE = (a: number, b: number): BudgetChip => ({ label: `$${a} to $${b}`, min: a, max: b })
const PLUS = (n: number): BudgetChip => ({ label: `$${n}+`, min: n })
const NO_BUDGET: BudgetChip = { label: 'No budget' }
const FREE: BudgetChip = { label: 'Free', max: 0 }

const BUDGET_BY_NEED: Record<NeedType, BudgetChip[]> = {
  lunch: [UNDER(10), UNDER(15), UNDER(20), NO_BUDGET],
  cafeStudySpot: [UNDER(8), UNDER(12), NO_BUDGET],
  dessert: [UNDER(8), UNDER(12), UNDER(20), NO_BUDGET],
  dinner: [UNDER(15), UNDER(25), UNDER(40), NO_BUDGET],
  groupMeal: [UNDER(15), UNDER(30), UNDER(50), NO_BUDGET],
  gift: [UNDER(15), UNDER(25), UNDER(50)],
  clothing: [UNDER(20), UNDER(40), NO_BUDGET],
  books: [UNDER(10), UNDER(20), NO_BUDGET],
  thrift: [UNDER(10), UNDER(20), NO_BUDGET],
  schoolSupplies: [UNDER(10), UNDER(20), NO_BUDGET],
  haircut: [RANGE(20, 30), RANGE(30, 45), PLUS(45)],
  printing: [UNDER(5), UNDER(10), UNDER(20)],
  alterations: [UNDER(15), UNDER(30), NO_BUDGET],
  tutoring: [UNDER(15), UNDER(25), UNDER(40)],
  gymTrial: [FREE, UNDER(25), NO_BUDGET],
  phoneRepair: [UNDER(50), RANGE(50, 100), PLUS(100)],
  laptopRepair: [UNDER(75), RANGE(75, 150), PLUS(150)],
  escapeRoom: [UNDER(25), UNDER(40), NO_BUDGET],
  localEvent: [FREE, UNDER(25), NO_BUDGET],
  groupHangout: [UNDER(15), UNDER(30), NO_BUDGET],
}

export function budgetChipsFor(needType: NeedType): BudgetChip[] {
  return BUDGET_BY_NEED[needType] ?? [UNDER(15), UNDER(30), NO_BUDGET]
}

/* ── Distance ─────────────────────────────────────────────────────────── */

export const DISTANCE_OPTIONS: { km: number; label: string }[] = [
  { km: 1, label: 'Within 1 km' },
  { km: 3, label: 'Within 3 km' },
  { km: 5, label: 'Within 5 km' },
  { km: 10, label: 'Within 10 km' },
]

/* ── Time presets ─────────────────────────────────────────────────────── */

export type TimePresetKey = 'now' | 'afterSchool' | 'tonight' | 'tomorrow' | 'weekend' | 'custom'

export const TIME_PRESETS: { key: TimePresetKey; label: string }[] = [
  { key: 'now', label: 'Now' },
  { key: 'afterSchool', label: 'After school' },
  { key: 'tonight', label: 'Tonight' },
  { key: 'tomorrow', label: 'Tomorrow' },
  { key: 'weekend', label: 'This weekend' },
  { key: 'custom', label: 'Custom' },
]

/** Resolve a preset to a concrete {start, end} window (null for custom). */
export function presetWindow(
  key: TimePresetKey,
  now: Date = new Date(),
): { start: string; end: string } | null {
  switch (key) {
    case 'now':
      return { start: now.toISOString(), end: isoFrom(now, { hours: 2 }) }
    case 'afterSchool': {
      let start = atTime(now, 15, 30)
      if (start.getTime() < now.getTime()) start = atTime(shift(now, { days: 1 }), 15, 30)
      return { start: start.toISOString(), end: atTime(start, 17, 0).toISOString() }
    }
    case 'tonight': {
      let start = atTime(now, 18, 0)
      if (now.getHours() >= 22) start = atTime(shift(now, { days: 1 }), 18, 0)
      else if (start.getTime() < now.getTime()) start = now
      const end = atTime(start, 22, 0)
      return { start: start.toISOString(), end: end.toISOString() }
    }
    case 'tomorrow': {
      const base = shift(now, { days: 1 })
      return { start: atTime(base, 9, 0).toISOString(), end: atTime(base, 21, 0).toISOString() }
    }
    case 'weekend': {
      // Next Saturday (or today if it's already the weekend).
      const day = now.getDay() // 0 Sun … 6 Sat
      const daysUntilSat = day === 6 ? 0 : day === 0 ? -1 : 6 - day
      const sat = shift(now, { days: daysUntilSat })
      const sun = shift(sat, { days: 1 })
      return { start: atTime(sat, 10, 0).toISOString(), end: atTime(sun, 20, 0).toISOString() }
    }
    case 'custom':
      return null
  }
}

/* ── Preferences ──────────────────────────────────────────────────────── */

export type PreferenceMeta = {
  key: string
  label: string
  /** 'all' or the categories this preference is relevant to (PRD §10.2). */
  categories: BusinessCategory[] | 'all'
}

export const PREFERENCES: PreferenceMeta[] = [
  { key: 'studentDiscount', label: 'Student discount', categories: 'all' },
  { key: 'openNow', label: 'Open now', categories: 'all' },
  { key: 'highlyRated', label: 'Highly rated only', categories: 'all' },
  { key: 'verifiedOnly', label: 'Verified businesses only', categories: 'all' },
  { key: 'groupFriendly', label: 'Group-friendly', categories: ['food', 'entertainment', 'fitness'] },
  { key: 'wheelchairAccessible', label: 'Wheelchair accessible', categories: 'all' },
  { key: 'quiet', label: 'Quiet environment', categories: ['food', 'education', 'services'] },
  { key: 'vegetarian', label: 'Vegetarian options', categories: ['food'] },
  { key: 'fastService', label: 'Fast service', categories: ['food', 'services', 'repair'] },
  { key: 'under30', label: 'Under 30 minutes', categories: ['food', 'services', 'repair'] },
]

export function preferencesForCategory(category: BusinessCategory): PreferenceMeta[] {
  return PREFERENCES.filter((p) => p.categories === 'all' || p.categories.includes(category))
}
