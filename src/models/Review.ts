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
