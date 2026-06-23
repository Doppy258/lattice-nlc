/** Presentation helpers. Pure functions, no side effects. */

export function formatCurrency(amount: number): string {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

export function formatPercent(value0to1: number, digits = 0): string {
  return `${(value0to1 * 100).toFixed(digits)}%`;
}

export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

export function formatDistance(km: number): string {
  return `${km.toFixed(1)} km`;
}

/** Friendly relative-time label, e.g. "in 2h" or "3 days ago". */
export function relativeTime(iso: string, now = new Date()): string {
  const diffMs = Date.parse(iso) - now.getTime();
  const future = diffMs >= 0;
  const mins = Math.round(Math.abs(diffMs) / 60000);
  const label = (n: number, unit: string) =>
    future ? `in ${n}${unit}` : `${n}${unit} ago`;
  if (mins < 60) return label(Math.max(1, mins), "m");
  const hours = Math.round(mins / 60);
  if (hours < 24) return label(hours, "h");
  const days = Math.round(hours / 24);
  return future ? `in ${days} day${days === 1 ? "" : "s"}` : `${days} day${days === 1 ? "" : "s"} ago`;
}

export function formatTimeRange(startIso: string, endIso: string): string {
  const opts: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" };
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (Number.isNaN(start.getTime())) return "";
  return `${start.toLocaleTimeString("en-US", opts)} – ${end.toLocaleTimeString("en-US", opts)}`;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
