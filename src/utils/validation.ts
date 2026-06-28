/** Low-level, reusable validation primitives shared across services. */

const URL_PATTERN = /(https?:\/\/|www\.|\.[a-z]{2,}\/)/i;

// Practical email shape check (syntactic): a local part, an @, a domain, and a
// dotted TLD, with no whitespace. Intentionally permissive — semantic delivery
// is verified by the auth provider, not here.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Type guard: finite number (rejects NaN/Infinity). */
export function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** Validates an email address's *format* (not its deliverability). */
export function isValidEmail(value: string | undefined | null): boolean {
  return typeof value === "string" && EMAIL_PATTERN.test(value.trim());
}

/** Checks for a non-blank string; null/undefined/whitespace-only → false. */
export function isNonEmpty(value: string | undefined | null): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

/** Detects URLs/links inside free text (notes may not contain links). */
export function containsLink(text: string): boolean {
  return URL_PATTERN.test(text);
}

/**
 * Heuristic for "repeated nonsense": the same character or short token repeated
 * many times (e.g. "aaaaaa" or "spam spam spam spam").
 */
export function isRepeatedNonsense(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (/(.)\1{5,}/i.test(trimmed)) return true;
  const words = trimmed.toLowerCase().split(/\s+/);
  if (words.length >= 4) {
    const unique = new Set(words);
    if (unique.size === 1) return true;
  }
  return false;
}

/** Safely constrains a number to [min, max]; used for budget and rating clamping. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Trimmed-string length check; shared by title/description validation on both offers and reviews. */
export function lengthWithin(text: string, min: number, max: number): boolean {
  const len = text.trim().length;
  return len >= min && len <= max;
}
