import type { BusinessHours } from "../models";

export const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** "HH:MM" -> minutes since midnight. */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** Returns true if the two [start,end] minute ranges overlap at all. */
export function rangesOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/** Whole hours between two ISO datetimes (b - a), rounded down. */
export function hoursBetween(aIso: string, bIso: string): number {
  return Math.floor((Date.parse(bIso) - Date.parse(aIso)) / (60 * 60 * 1000));
}

export function daysBetween(aIso: string, bIso: string): number {
  return (Date.parse(bIso) - Date.parse(aIso)) / MS_PER_DAY;
}

/** Is the ISO datetime strictly in the past relative to `now`? */
export function isPast(iso: string, now = new Date()): boolean {
  return Date.parse(iso) < now.getTime();
}

/**
 * Does a business with the given weekly hours have any open coverage during the
 * [startIso, endIso] request window? Checks each day the window touches.
 */
export function isBusinessOpenDuring(
  hours: BusinessHours[],
  startIso: string,
  endIso: string
): "full" | "partial" | "none" {
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "none";

  let touchedMinutes = 0;
  let coveredMinutes = 0;

  // Walk day-by-day across the (typically short) request window.
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  const guard = new Date(end);
  guard.setHours(23, 59, 59, 999);

  while (cursor <= guard) {
    const dayStart = Math.max(
      cursor.getTime(),
      new Date(cursor).setHours(0, 0, 0, 0)
    );
    const windowStartMin = clampToDay(start, cursor);
    const windowEndMin = clampToDay(end, cursor);
    if (windowEndMin > windowStartMin) {
      touchedMinutes += windowEndMin - windowStartMin;
      const todays = hours.filter((h) => h.dayOfWeek === cursor.getDay());
      for (const h of todays) {
        const oStart = timeToMinutes(h.openTime);
        const oEnd = timeToMinutes(h.closeTime);
        const overlapStart = Math.max(windowStartMin, oStart);
        const overlapEnd = Math.min(windowEndMin, oEnd);
        if (overlapEnd > overlapStart) coveredMinutes += overlapEnd - overlapStart;
      }
    }
    void dayStart;
    cursor.setDate(cursor.getDate() + 1);
  }

  if (touchedMinutes === 0 || coveredMinutes === 0) return "none";
  return coveredMinutes >= touchedMinutes - 1 ? "full" : "partial";
}

/** Minutes-since-midnight for `date` clamped to the calendar day of `day`. */
function clampToDay(date: Date, day: Date): number {
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = dayStart.getTime() + MS_PER_DAY;
  const clamped = Math.min(Math.max(date.getTime(), dayStart.getTime()), dayEnd);
  return Math.round((clamped - dayStart.getTime()) / 60000);
}
