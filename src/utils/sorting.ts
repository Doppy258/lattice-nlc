/** Reusable comparators for sorting businesses, offers, and results. */

export type SortDirection = "asc" | "desc";

/** Returns a comparator over a numeric selector. */
export function byNumber<T>(
  selector: (item: T) => number,
  direction: SortDirection = "desc"
): (a: T, b: T) => number {
  const sign = direction === "asc" ? 1 : -1;
  return (a, b) => (selector(a) - selector(b)) * sign;
}

/** Returns a comparator over a string selector (locale-aware). */
export function byString<T>(
  selector: (item: T) => string,
  direction: SortDirection = "asc"
): (a: T, b: T) => number {
  const sign = direction === "asc" ? 1 : -1;
  return (a, b) => selector(a).localeCompare(selector(b)) * sign;
}

/** Returns a comparator over an ISO date selector. */
export function byDate<T>(
  selector: (item: T) => string,
  direction: SortDirection = "desc"
): (a: T, b: T) => number {
  const sign = direction === "asc" ? 1 : -1;
  return (a, b) => (Date.parse(selector(a)) - Date.parse(selector(b))) * sign;
}
