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
    case "custom":
      return null;
  }
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
  return asWindow(startDate, endDate);
}
