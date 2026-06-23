import type { BusinessCategory } from "./Business";

export type OfferType =
  | "discount"
  | "limitedTime"
  | "studentOffer"
  | "groupOffer"
  | "appointmentSlot"
  | "event"
  | "freeTrial"
  | "bundle";

export type Offer = {
  id: string;
  businessId: string;
  title: string;
  description: string;
  category: BusinessCategory;
  offerType: OfferType;
  price: number;
  originalPrice?: number;
  validFrom: string;
  validUntil: string;
  maxClaims: number;
  currentClaims: number;
  views: number;
  tags: string[];
  studentOnly: boolean;
  verificationRequired: boolean;
  active: boolean;
  createdAt: string;
};

/**
 * Per-subscore breakdown produced by the OfferRank algorithm.
 * Each field is a 0–100 value before the weighting is applied.
 */
export type ScoreBreakdown = {
  categoryScore: number;
  budgetScore: number;
  distanceScore: number;
  ratingScore: number;
  timeScore: number;
  verificationScore: number;
  preferenceScore: number;
};

/** A single ranked match between a Ping request and an offer. */
export type MatchResult = {
  offerId: string;
  businessId: string;
  requestId: string;
  /** Final weighted score, 0–100. */
  score: number;
  scoreBreakdown: ScoreBreakdown;
  /** Human-readable explanations of why the offer matched. */
  reasons: string[];
};
