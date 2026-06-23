/**
 * Date / time helpers.
 *
 * Seed data is generated *relative to the moment the app first runs* (see
 * storageService). That keeps offers "currently valid" and claims sensibly
 * dated no matter what day a judge opens the demo, so nothing looks expired.
 */

export const MS_PER_MINUTE = 60_000
export const MS_PER_HOUR = 3_600_000
export const MS_PER_DAY = 86_400_000

export function nowIso(): string {
  return new Date().toISOString()
}

/** Return a new Date offset from `base` by the given amounts. */
export function shift(
  base: Date,
  { days = 0, hours = 0, minutes = 0 }: { days?: number; hours?: number; minutes?: number },
): Date {
  return new Date(
    base.getTime() + days * MS_PER_DAY + hours * MS_PER_HOUR + minutes * MS_PER_MINUTE,
  )
}

/** ISO timestamp offset from a reference `now` (defaults to the real now). */
export function isoFrom(
  now: Date,
  opts: { days?: number; hours?: number; minutes?: number },
): string {
  return shift(now, opts).toISOString()
}

/** A Date set to a specific wall-clock time on the same day as `base`. */
export function atTime(base: Date, hour: number, minute = 0): Date {
  const d = new Date(base)
  d.setHours(hour, minute, 0, 0)
  return d
}

/** Parse "HH:MM" into total minutes since midnight. */
export function minutesOfDay(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + (m || 0)
}

/** Format an "HH:MM" 24h string as "3:30 PM". */
export function formatClock(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:${String(m || 0).padStart(2, '0')} ${period}`
}

/** Format a Date as "3:30 PM". */
export function formatTime(d: Date): string {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

/** Format an ISO string / Date as e.g. "Jun 23". */
export function formatDate(input: string | Date): string {
  const d = typeof input === 'string' ? new Date(input) : input
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** Format an ISO string / Date as e.g. "Jun 23, 2026". */
export function formatLongDate(input: string | Date): string {
  const d = typeof input === 'string' ? new Date(input) : input
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/** "YYYY-MM" key for grouping by month. */
export function monthKey(input: string | Date): string {
  const d = typeof input === 'string' ? new Date(input) : input
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** Short month label e.g. "Jun" from a "YYYY-MM" key. */
export function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short' })
}

/**
 * Friendly countdown to a future ISO time, e.g. "Expires in 2h 15m",
 * "Expires in 3 days", or "Expired" once past.
 */
export function countdown(toIso: string, from: Date = new Date()): string {
  const diff = new Date(toIso).getTime() - from.getTime()
  if (diff <= 0) return 'Expired'
  const days = Math.floor(diff / MS_PER_DAY)
  if (days >= 1) return `${days} day${days > 1 ? 's' : ''}`
  const hours = Math.floor(diff / MS_PER_HOUR)
  const minutes = Math.floor((diff % MS_PER_HOUR) / MS_PER_MINUTE)
  if (hours >= 1) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

/** True when `iso` is in the past relative to `from`. */
export function isPast(iso: string, from: Date = new Date()): boolean {
  return new Date(iso).getTime() < from.getTime()
}
