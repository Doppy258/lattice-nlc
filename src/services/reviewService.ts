import type { Business, Claim, Review } from "../models";
import { REVIEW_TEXT_MAX, REVIEW_TEXT_MIN } from "../utils/constants";
import { lengthWithin } from "../utils/validation";
import { createId } from "../utils/ids";
import { byDate } from "../utils/sorting";

export type ReviewInput = {
  userId: string;
  businessId: string;
  offerId: string;
  claimId: string;
  rating: number;
  text: string;
  tags: string[];
};

export type ReviewValidation = {
  valid: boolean;
  errors: { field: string; message: string }[];
};

export type CreateReviewResult =
  | { ok: true; review: Review }
  | { ok: false; error: string };

/**
 * A user may review a claim only if it is theirs, redeemed, and not yet
 * reviewed (section 13.4 — review verification).
 */
export function canUserReviewClaim(
  userId: string,
  claimId: string,
  claims: Claim[],
  reviews: Review[]
): boolean {
  const claim = claims.find((c) => c.id === claimId);
  if (!claim || claim.userId !== userId || claim.status !== "redeemed") return false;
  return !reviews.some((r) => r.claimId === claimId);
}

function getReviewUnlockError(
  userId: string,
  claimId: string,
  claims: Claim[],
  reviews: Review[]
): string | null {
  const claim = claims.find((c) => c.id === claimId);
  if (!claim || claim.userId !== userId) return "Reviews unlock after the offer is redeemed.";
  if (claim.status !== "redeemed") return "Reviews unlock after the offer is redeemed.";
  if (reviews.some((r) => r.claimId === claimId)) return "You've already reviewed this redeemed claim.";
  return null;
}

export function validateReview(input: ReviewInput): ReviewValidation {
  const errors: ReviewValidation["errors"] = [];
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    errors.push({ field: "rating", message: "Choose a rating from 1 to 5." });
  }
  if (!lengthWithin(input.text, REVIEW_TEXT_MIN, REVIEW_TEXT_MAX)) {
    errors.push({
      field: "text",
      message: `Review must be ${REVIEW_TEXT_MIN}-${REVIEW_TEXT_MAX} characters.`,
    });
  }
  return { valid: errors.length === 0, errors };
}

/** Validates, enforces the unlock rule, and builds a verified review. */
export function createReview(
  input: ReviewInput,
  claims: Claim[],
  reviews: Review[]
): CreateReviewResult {
  const validation = validateReview(input);
  if (!validation.valid) {
    return { ok: false, error: validation.errors[0].message };
  }
  const unlockError = getReviewUnlockError(input.userId, input.claimId, claims, reviews);
  if (unlockError) {
    return { ok: false, error: unlockError };
  }
  const claim = claims.find((c) => c.id === input.claimId);
  if (!claim || claim.businessId !== input.businessId || claim.offerId !== input.offerId) {
    return { ok: false, error: "This review does not match the redeemed claim." };
  }
  const review: Review = {
    id: createId("review"),
    userId: input.userId,
    businessId: input.businessId,
    offerId: input.offerId,
    claimId: input.claimId,
    rating: input.rating,
    text: input.text.trim(),
    tags: input.tags,
    verified: true,
    createdAt: new Date().toISOString(),
  };
  return { ok: true, review };
}

export function getBusinessReviews(businessId: string, reviews: Review[]): Review[] {
  return reviews
    .filter((r) => r.businessId === businessId)
    .sort(byDate((r) => r.createdAt, "desc"));
}

/**
 * Recomputes a business's rating average and review count from the review set.
 * Returns a new Business object (does not mutate the input).
 */
export function updateBusinessRating(
  businessId: string,
  reviews: Review[],
  business: Business
): Business {
  const theirs = getBusinessReviews(businessId, reviews);
  if (theirs.length === 0) return { ...business, reviewCount: 0 };
  const sum = theirs.reduce((acc, r) => acc + r.rating, 0);
  const avg = Math.round((sum / theirs.length) * 10) / 10;
  return { ...business, ratingAverage: avg, reviewCount: theirs.length };
}
