/**
 * Review — a verified or unverified rating+text left by a customer after
 * redeeming an offer. Verified reviews are linked to a claim so the system
 * can guarantee the reviewer actually transacted with the business.
 */
export type Review = {
  id: string;
  userId: string;
  businessId: string;
  offerId: string;
  /** A verified review may reference the redeemed claim that unlocked it. */
  claimId?: string;
  /** Integer 1–5. */
  rating: number;
  text: string;
  tags: string[];
  verified: boolean;
  createdAt: string;
};

/** Canonical set of review tags surfaced in the review form and summaries. */
export const REVIEW_TAGS = [
  "Good value",
  "Friendly staff",
  "Fast service",
  "Student-friendly",
  "Clean",
  "Good quality",
  "Quiet",
  "Group-friendly",
] as const;

export type ReviewTag = (typeof REVIEW_TAGS)[number];
