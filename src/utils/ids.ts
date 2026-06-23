/** Small id helpers. Deterministic-enough for a demo; no external deps. */

let counter = 0;

/** Generates a reasonably-unique id with an optional prefix, e.g. `claim_lf3k2a`. */
export function createId(prefix = "id"): string {
  counter += 1;
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 6);
  return `${prefix}_${time}${counter.toString(36)}${rand}`;
}

/** Random integer in [min, max] inclusive. */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
