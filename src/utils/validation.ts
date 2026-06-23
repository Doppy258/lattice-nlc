/** Low-level, reusable validation primitives shared across services. */

const URL_PATTERN = /(https?:\/\/|www\.|\.[a-z]{2,}\/)/i;

export function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

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

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function lengthWithin(text: string, min: number, max: number): boolean {
  const len = text.trim().length;
  return len >= min && len <= max;
}
