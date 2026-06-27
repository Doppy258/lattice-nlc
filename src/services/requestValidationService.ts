/**
 * requestValidationService — syntactic and semantic validation for Ping
 * (Create-a-Lattice) submissions. Covers budget minima per need type, time
 * window ordering/past/range, and optional note spam/character limits. Also
 * provides the RequestQuality signal shown in the live preview.
 */
import type { NeedType, PingRequest } from "../models";
import {
  MAX_REQUEST_WINDOW_DAYS,
  MINIMUM_BUDGET_BY_NEED_TYPE,
  NOTE_MAX,
} from "../utils/constants";
import { daysBetween, isPast } from "../utils/dateTime";
import { containsLink, isRepeatedNonsense } from "../utils/validation";
import { NEED_TYPE_LABELS } from "../data/catalog";

/** A draft request being built in the UI; required fields may be absent. */
export type PingDraft = Partial<PingRequest>;

export type FieldError = { field: string; message: string };
export type ValidationResult = { valid: boolean; errors: FieldError[] };
export type RequestQuality = "invalid" | "weak" | "strong";

/**
 * Semantic budget check (section 13.2): each need type has a realistic minimum.
 * Returns an error when a stated max budget falls below it.
 */
export function validateBudgetForNeedType(
  needType: NeedType | undefined,
  budgetMax: number | undefined
): FieldError | null {
  if (!needType || budgetMax === undefined) return null;
  if (!Number.isFinite(budgetMax) || budgetMax < 0) {
    return { field: "budget", message: "Enter a valid budget amount." };
  }
  const min = MINIMUM_BUDGET_BY_NEED_TYPE[needType];
  if (budgetMax < min) {
    return {
      field: "budget",
      message: `${NEED_TYPE_LABELS[needType]} usually needs a higher budget. Try at least $${min}, or browse existing deals.`,
    };
  }
  return null;
}

/** Time window must be present, ordered, not in the past, and ≤ 7 days. */
export function validateTimeWindow(
  start: string | undefined,
  end: string | undefined
): FieldError[] {
  const errors: FieldError[] = [];
  if (!start || !end) {
    errors.push({ field: "time", message: "Choose when you need this." });
    return errors;
  }
  const startMs = Date.parse(start);
  const endMs = Date.parse(end);
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
    errors.push({ field: "time", message: "Enter a valid time window." });
    return errors;
  }
  if (endMs <= startMs) {
    errors.push({ field: "time", message: "End time must be after start time." });
  }
  if (isPast(end)) {
    errors.push({ field: "time", message: "Time cannot be in the past." });
  }
  if (daysBetween(start, end) > MAX_REQUEST_WINDOW_DAYS) {
    errors.push({
      field: "time",
      message: `A request window cannot exceed ${MAX_REQUEST_WINDOW_DAYS} days.`,
    });
  }
  return errors;
}

/** Optional note: ≤120 chars, no links, no repeated spam text. */
export function validateOptionalNote(note: string | undefined): FieldError | null {
  if (!note) return null;
  if (note.length > NOTE_MAX) {
    return { field: "note", message: `Keep your note under ${NOTE_MAX} characters.` };
  }
  if (containsLink(note)) {
    return { field: "note", message: "Notes can't contain links." };
  }
  if (isRepeatedNonsense(note)) {
    return { field: "note", message: "That note looks like spam. Try describing your need." };
  }
  return null;
}

/** Full request validation aggregating syntactic + semantic checks. */
export function validatePingRequest(
  request: PingDraft,
  existing: PingRequest[] = [],
  now = new Date()
): ValidationResult {
  const errors: FieldError[] = [];

  if (!request.category) errors.push({ field: "category", message: "Pick a category." });
  if (!request.needType) errors.push({ field: "needType", message: "Pick what you need." });
  if (request.distanceKm === undefined) {
    errors.push({ field: "distance", message: "Choose a distance." });
  }

  const budgetError = validateBudgetForNeedType(request.needType, request.budgetMax);
  if (budgetError) errors.push(budgetError);

  errors.push(...validateTimeWindow(request.timeStart, request.timeEnd));

  const noteError = validateOptionalNote(request.optionalNote);
  if (noteError) errors.push(noteError);

  void existing;
  void now;

  return { valid: errors.length === 0, errors };
}

/** Request quality signal shown in the live preview (section 10.2). */
export function getRequestQuality(request: PingDraft, existing: PingRequest[] = []): RequestQuality {
  const { valid } = validatePingRequest(request, existing);
  if (!valid) return "invalid";

  const hasBudget = request.budgetMax != null || request.budgetMin != null;
  const hasTime = !!request.timeStart && !!request.timeEnd;
  const veryBroadDistance = (request.distanceKm ?? 0) >= 10;
  const hasPreferences = (request.preferences?.length ?? 0) > 0;

  const weakSignals = !hasBudget || !hasTime || veryBroadDistance || !hasPreferences;
  return weakSignals ? "weak" : "strong";
}
