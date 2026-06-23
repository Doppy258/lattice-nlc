/**
 * ID + claim-code generation.
 *
 * IDs are prefixed (`offer_`, `claim_`, …) so they're self-describing in
 * storage and logs. Claim codes follow the PRD format PING-#### and are
 * checked for uniqueness against the codes already in use.
 */

/** Short, reasonably-unique id with a domain prefix. */
export function makeId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8)
  const time = Date.now().toString(36).slice(-4)
  return `${prefix}_${time}${rand}`
}

/** A four-digit code body, e.g. "8421". */
function randomCodeBody(): string {
  return String(Math.floor(1000 + Math.random() * 9000))
}

/**
 * Generate a unique PING-#### claim code. Pass the set of codes already in use
 * (e.g. from active claims) so we never collide.
 */
export function makeClaimCode(existingCodes: Iterable<string> = []): string {
  const taken = new Set(existingCodes)
  let code = `PING-${randomCodeBody()}`
  // Extremely unlikely to loop more than once with 9000 possibilities.
  while (taken.has(code)) {
    code = `PING-${randomCodeBody()}`
  }
  return code
}

/** Validate the syntactic shape of a claim code (PING-#### exactly). */
export function isValidClaimCodeFormat(code: string): boolean {
  return /^PING-\d{4}$/.test(code.trim().toUpperCase())
}

/** Normalise user-typed codes ("ping-8421 " → "PING-8421"). */
export function normaliseClaimCode(code: string): string {
  return code.trim().toUpperCase()
}
