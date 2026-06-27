/**
 * User-facing error messages keyed by short codes that match the Postgres
 * `raise exception 'CODE'` convention used in Supabase RPC functions.
 * `RepoError` wraps the code and a friendly UI message; `throwIfError`
 * maps an RPC result's `error.message` back to the right message, keeping
 * the API boundary readable without leaking raw Postgres text to the UI.
 */
const MESSAGES: Record<string, string> = {
  NOT_AUTHENTICATED: "Please sign in and try again.",
  OFFER_NOT_FOUND: "This offer no longer exists.",
  OFFER_EXPIRED: "This offer has expired. View similar active offers.",
  OFFER_FULL: "This offer has reached its claim limit.",
  ALREADY_CLAIMED: "You've already claimed this offer.",
  TOO_MANY_ACTIVE: "You can only have 3 active claims at once. Redeem or cancel one first.",
  CODE_NOT_FOUND: "This claim code does not exist or is not active.",
  NOT_YOUR_BUSINESS: "This claim belongs to another business.",
  ALREADY_REDEEMED: "This claim was already redeemed.",
  EXPIRED: "This claim has expired.",
  NOT_ACTIVE: "This claim is no longer active.",
  BAD_TIME_WINDOW: "End time must be after start time.",
  TIME_IN_PAST: "Time cannot be in the past.",
  WINDOW_TOO_LONG: "A request window cannot exceed 7 days.",
  CLAIM_NOT_FOUND: "That claim could not be found.",
  NOT_YOUR_CLAIM: "You can only review your own claims.",
  NOT_REDEEMED: "You can review this only after redeeming the claim.",
  ALREADY_REVIEWED: "You've already reviewed this claim.",
  BAD_RATING: "Choose a rating from 1 to 5.",
  BAD_TEXT_LENGTH: "Reviews must be between 10 and 300 characters.",
};

export class RepoError extends Error {
  code: string;
  constructor(code: string, fallback?: string) {
    super(MESSAGES[code] ?? fallback ?? code);
    this.code = code;
    this.name = "RepoError";
  }
}

/** Postgres `raise exception 'CODE'` surfaces as error.message containing CODE. */
export function throwIfError(error: { message: string } | null | undefined): void {
  if (!error) return;
  const code = Object.keys(MESSAGES).find((c) => error.message.includes(c));
  throw new RepoError(code ?? "UNKNOWN", error.message);
}
