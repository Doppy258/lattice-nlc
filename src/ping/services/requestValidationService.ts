import type { BusinessCategory, NeedType, PingRequest } from '@/models'
import { MS_PER_DAY, MS_PER_MINUTE } from '@/utils/dateTime'
import { formatCurrency } from '@/utils/formatting'

/**
 * requestValidationService — syntactic + semantic validation for Pings.
 *
 * "Structured, not chaotic": each need type has a realistic minimum budget,
 * time windows must make sense, distances are bounded, and notes are sanitised.
 * Every function here is pure so it can be reused by the live preview, the
 * submit guard, and the tests alike.
 */

/* ── Shared result shapes ─────────────────────────────────────────────── */
export type FieldError = { field: string; message: string }
export type ValidationResult = { valid: boolean; errors: FieldError[] }
export type SimpleCheck = { valid: boolean; message?: string }
export type RequestQuality = 'strong' | 'weak' | 'invalid'
export type QualityResult = { quality: RequestQuality; reasons: string[] }

/** A request still being built — every field is optional until submit. */
export type PingDraft = {
  category?: BusinessCategory
  needType?: NeedType
  budgetMin?: number
  budgetMax?: number
  distanceKm?: number
  timeStart?: string
  timeEnd?: string
  preferences?: string[]
  optionalNote?: string
}

/* ── Tunable rules ────────────────────────────────────────────────────── */
export const MAX_DISTANCE_KM = 10
export const BROAD_DISTANCE_KM = 10
export const NOTE_MAX_LENGTH = 120
export const MAX_WINDOW_DAYS = 7
export const DUPLICATE_COOLDOWN_MINUTES = 10
/** Small tolerance so "Now" presets aren't flagged as being in the past. */
const PAST_TOLERANCE_MINUTES = 5

/**
 * Minimum realistic budget per need type (PRD §13.2). Used to block absurd
 * requests like a $5 haircut.
 */
export const minimumBudgetByNeedType: Record<NeedType, number> = {
  lunch: 8,
  cafeStudySpot: 5,
  dessert: 5,
  dinner: 12,
  groupMeal: 15,
  gift: 10,
  clothing: 10,
  books: 5,
  thrift: 5,
  schoolSupplies: 3,
  haircut: 20,
  printing: 2,
  alterations: 8,
  tutoring: 15,
  gymTrial: 0,
  phoneRepair: 40,
  laptopRepair: 50,
  escapeRoom: 20,
  localEvent: 0,
  groupHangout: 10,
}

/** A friendly suggested budget range string, e.g. "$20 to $30". */
function suggestedRange(min: number): string {
  const upper = Math.max(min + 5, Math.round(min * 1.5))
  return `${formatCurrency(min)} to ${formatCurrency(upper)}`
}

/**
 * Budget must clear the minimum for the chosen need type. "No budget"
 * (undefined max) is always allowed.
 */
export function validateBudgetForNeedType(
  needType: NeedType | undefined,
  budgetMax: number | undefined,
): SimpleCheck {
  if (budgetMax === undefined) return { valid: true }
  if (Number.isNaN(budgetMax) || budgetMax < 0) {
    return { valid: false, message: 'Enter a budget of $0 or more.' }
  }
  if (!needType) return { valid: true }

  const min = minimumBudgetByNeedType[needType]
  if (budgetMax < min) {
    return {
      valid: false,
      message: `Your budget is below the typical minimum for this request. Try ${suggestedRange(
        min,
      )} or browse existing deals.`,
    }
  }
  return { valid: true }
}

/** Time window must be ordered, current-or-future, and at most 7 days long. */
export function validateTimeWindow(start?: string, end?: string): SimpleCheck {
  if (!start || !end) return { valid: false, message: 'Choose a time window.' }

  const startMs = new Date(start).getTime()
  const endMs = new Date(end).getTime()
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
    return { valid: false, message: 'That time window isn’t valid.' }
  }
  if (endMs <= startMs) {
    return { valid: false, message: 'End time must be after start time.' }
  }
  if (startMs < Date.now() - PAST_TOLERANCE_MINUTES * MS_PER_MINUTE) {
    return { valid: false, message: 'That time is in the past. Pick a current or upcoming window.' }
  }
  if (endMs - startMs > MAX_WINDOW_DAYS * MS_PER_DAY) {
    return { valid: false, message: `Keep the time window within ${MAX_WINDOW_DAYS} days.` }
  }
  return { valid: true }
}

/** Optional note: length-capped, no links, no obvious spam. */
export function validateOptionalNote(note?: string): SimpleCheck {
  if (!note) return { valid: true }
  const trimmed = note.trim()
  if (trimmed.length > NOTE_MAX_LENGTH) {
    return { valid: false, message: `Keep your note under ${NOTE_MAX_LENGTH} characters.` }
  }
  if (/(https?:\/\/|www\.)/i.test(trimmed)) {
    return { valid: false, message: 'Links aren’t allowed in notes.' }
  }
  // Same character 7+ times, or a single word repeated 4+ times in a row.
  if (/(.)\1{6,}/i.test(trimmed) || /\b(\w+)\b(?:\s+\1\b){3,}/i.test(trimmed)) {
    return { valid: false, message: 'That note looks like spam. Try describing what you need.' }
  }
  return { valid: true }
}

/**
 * A request is a duplicate if the same user made one with the same category +
 * need type within the cooldown window.
 */
export function detectDuplicateRequest(
  userId: string,
  draft: PingDraft,
  requests: PingRequest[],
  now: Date = new Date(),
): SimpleCheck {
  const cutoff = now.getTime() - DUPLICATE_COOLDOWN_MINUTES * MS_PER_MINUTE
  const isDuplicate = requests.some(
    (r) =>
      r.userId === userId &&
      r.category === draft.category &&
      r.needType === draft.needType &&
      new Date(r.createdAt).getTime() >= cutoff,
  )
  return isDuplicate
    ? {
        valid: false,
        message:
          'You already created a similar Ping recently. Try editing that request or wait before creating another.',
      }
    : { valid: true }
}

/**
 * Full submit-time validation. Aggregates required-field, budget, time, and
 * note checks into a single list of field errors.
 */
export function validatePingRequest(draft: PingDraft): ValidationResult {
  const errors: FieldError[] = []

  if (!draft.category) errors.push({ field: 'category', message: 'Choose a category.' })
  if (!draft.needType) errors.push({ field: 'needType', message: 'Choose what you need.' })

  if (draft.distanceKm === undefined || Number.isNaN(draft.distanceKm)) {
    errors.push({ field: 'distanceKm', message: 'Choose a distance.' })
  } else if (draft.distanceKm <= 0 || draft.distanceKm > MAX_DISTANCE_KM) {
    errors.push({ field: 'distanceKm', message: `Distance must be between 1 and ${MAX_DISTANCE_KM} km.` })
  }

  const time = validateTimeWindow(draft.timeStart, draft.timeEnd)
  if (!time.valid) errors.push({ field: 'time', message: time.message ?? 'Invalid time window.' })

  const budget = validateBudgetForNeedType(draft.needType, draft.budgetMax)
  if (!budget.valid) errors.push({ field: 'budget', message: budget.message ?? 'Invalid budget.' })

  const note = validateOptionalNote(draft.optionalNote)
  if (!note.valid) errors.push({ field: 'note', message: note.message ?? 'Invalid note.' })

  return { valid: errors.length === 0, errors }
}

/**
 * Request quality for the live preview (PRD §10.2):
 *  - invalid: fails validation (missing required fields, bad budget/time)
 *  - strong:  category, need, budget, distance, and time all set & sensible
 *  - weak:    valid but missing budget/time, very broad distance, or no prefs
 */
export function getRequestQuality(draft: PingDraft): QualityResult {
  const validation = validatePingRequest(draft)
  if (!validation.valid) {
    return { quality: 'invalid', reasons: validation.errors.map((e) => e.message) }
  }

  const weakReasons: string[] = []
  if (draft.budgetMax === undefined) weakReasons.push('Add a budget for sharper matches.')
  if ((draft.distanceKm ?? 0) >= BROAD_DISTANCE_KM) {
    weakReasons.push('A narrower distance focuses your results.')
  }
  if (!draft.preferences || draft.preferences.length === 0) {
    weakReasons.push('Add a preference or two to personalise matches.')
  }

  return weakReasons.length > 0
    ? { quality: 'weak', reasons: weakReasons }
    : { quality: 'strong', reasons: ['Category, budget, distance, and timing are all set.'] }
}
