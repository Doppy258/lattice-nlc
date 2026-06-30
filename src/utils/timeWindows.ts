/**
 * Time-window preset logic for the request-creation flow. Maps friendly labels
 * like "now" / "after school" / "tonight" into concrete ISO ranges, and builds
 * a window from raw date+time inputs. Ensures windows always end in the future
 * so downstream validation passes.
 */

import { MS_PER_DAY } from "./dateTime";

/** Identifiers for the time-window presets offered on the request page. */
export type TimeWindowPresetId =
  | "now"
  | "afterSchool"
  | "tonight"
  | "tomorrow"
  | "thisWeekend"
  | "anytime"
  | "custom";

export type TimeWindow = { timeStart: string; timeEnd: string };

/** A copy of `base` with the clock set to the given hour/minute. */
function atTime(base: Date, hour: number, minute: number): Date {
  const d = new Date(base);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function asWindow(start: Date, end: Date): TimeWindow {
  return { timeStart: start.toISOString(), timeEnd: end.toISOString() };
}

/** Rolls a same-day window forward by one day when it has already ended. */
function rollForwardIfPast(start: Date, end: Date, now: Date): [Date, Date] {
  if (end > now) return [start, end];
  return [new Date(start.getTime() + MS_PER_DAY), new Date(end.getTime() + MS_PER_DAY)];
}

/**
 * Resolves a preset into a concrete [start, end] window relative to `now`.
 * Returns null for "custom", where the caller supplies date/time inputs.
 * Windows always end in the future so they satisfy time-window validation.
 */
export function timeWindowForPreset(
  preset: TimeWindowPresetId,
  now: Date = new Date()
): TimeWindow | null {
  switch (preset) {
    case "now":
      return asWindow(new Date(now), new Date(now.getTime() + 2 * 60 * 60 * 1000));
    case "afterSchool": {
      const [s, e] = rollForwardIfPast(atTime(now, 15, 30), atTime(now, 17, 0), now);
      return asWindow(s, e);
    }
    case "tonight": {
      const [s, e] = rollForwardIfPast(atTime(now, 18, 0), atTime(now, 21, 0), now);
      return asWindow(s, e);
    }
    case "tomorrow": {
      const base = new Date(now.getTime() + MS_PER_DAY);
      return asWindow(atTime(base, 10, 0), atTime(base, 20, 0));
    }
    case "thisWeekend": {
      const sat = new Date(now);
      const daysUntilSat = (6 - sat.getDay() + 7) % 7;
      sat.setDate(sat.getDate() + daysUntilSat);
      let start = atTime(sat, 10, 0);
      let end = atTime(sat, 18, 0);
      if (end <= now) {
        sat.setDate(sat.getDate() + 7);
        start = atTime(sat, 10, 0);
        end = atTime(sat, 18, 0);
      }
      return asWindow(start, end);
    }
    case "anytime":
      return asWindow(new Date(now), new Date(now.getTime() + 7 * MS_PER_DAY));
    case "custom":
      return null;
  }
}

/**
 * Best-effort reverse mapping from a concrete window back onto a relative preset.
 * The NL parser resolves phrases like "right now" into absolute ISO times; this
 * recovers the friendly chip ("Now", "Tonight", …) so the request form shows a
 * preset the user recognises instead of a raw Custom range. Compares absolute
 * epochs — not strings, which mix the parser's local format with the presets'
 * UTC `toISOString()` — and returns the closest preset whose start and end both
 * fall within tolerance, or "custom" when the AI picked a genuinely specific time.
 */
export function presetForTimeWindow(
  timeStart: string,
  timeEnd: string,
  now: Date = new Date()
): TimeWindowPresetId {
  const startMs = Date.parse(timeStart);
  const endMs = Date.parse(timeEnd);
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) return "custom";

  const TOLERANCE_MS = 90 * 60 * 1000; // 90 minutes on each edge
  const candidates: TimeWindowPresetId[] = [
    "now",
    "afterSchool",
    "tonight",
    "tomorrow",
    "thisWeekend",
  ];

  let best: TimeWindowPresetId = "custom";
  let bestDelta = Infinity;
  for (const id of candidates) {
    const window = timeWindowForPreset(id, now);
    if (!window) continue;
    const startDelta = Math.abs(Date.parse(window.timeStart) - startMs);
    const endDelta = Math.abs(Date.parse(window.timeEnd) - endMs);
    if (
      startDelta <= TOLERANCE_MS &&
      endDelta <= TOLERANCE_MS &&
      startDelta + endDelta < bestDelta
    ) {
      bestDelta = startDelta + endDelta;
      best = id;
    }
  }
  return best;
}

/**
 * Builds a window from custom date + time inputs. Returns empty strings when
 * inputs are incomplete/invalid so downstream validation reports the problem.
 */
export function customTimeWindow(
  date: string,
  start: string,
  end: string
): TimeWindow {
  if (!date || !start || !end) return { timeStart: "", timeEnd: "" };
  const startDate = new Date(`${date}T${start}`);
  const endDate = new Date(`${date}T${end}`);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return { timeStart: "", timeEnd: "" };
  }
  // An end clock-time at or before the start (e.g. 10:00 PM → 12:00 AM) means the
  // window crosses midnight. Roll the end into the next day so it stays after the
  // start instead of failing the "end after start" / "not in the past" checks.
  if (endDate.getTime() <= startDate.getTime()) {
    endDate.setTime(endDate.getTime() + MS_PER_DAY);
  }
  return asWindow(startDate, endDate);
}
