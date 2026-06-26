import type { BusinessCategory } from "./Business";
import type { NeedType } from "./PingRequest";

export type OfferType =
  | "discount"
  | "limitedTime"
  | "studentOffer"
  | "groupOffer"
  | "appointmentSlot"
  | "event"
  | "freeTrial"
  | "bundle";

/**
 * How a discount is expressed. Determines what the card shows and which
 * pricing fields are meaningful. `undefined` is treated as "fixedPrice"
 * for backward compatibility with offers created before this field existed.
 */
export type DiscountKind = "fixedPrice" | "percent" | "amountOff";

export type Offer = {
  id: string;
  businessId: string;
  title: string;
  description: string;
  category: BusinessCategory;
  offerType: OfferType;
  /**
   * The specific customer need this offer serves (e.g. "lunch", "haircut").
   * Refines the category match so a request for the exact need ranks highest.
   * Optional for backward compatibility with offers created before this field.
   */
  needType?: NeedType;
  /** Defaults to "fixedPrice" when absent. */
  discountKind?: DiscountKind;
  /** Final price the customer pays. 0 for percent/amountOff offers (no fixed price). */
  price: number;
  originalPrice?: number;
  /** Percentage off (1–100), used when discountKind === "percent". */
  percentOff?: number;
  /** Flat dollars off, used when discountKind === "amountOff". */
  amountOff?: number;
  validFrom: string;
  validUntil: string;
  /** Total redemption limit across all customers. */
  maxClaims: number;
  /** Count of redemptions that have been *approved* by the business. */
  currentClaims: number;
  views: number;
  tags: string[];
  studentOnly: boolean;
  verificationRequired: boolean;
  /** When true, a customer can only ever redeem this offer once. */
  oneTimePerUser: boolean;
  /** Minutes a Lattice Pass stays valid after a customer claims it (default 5). */
  redemptionWindowMinutes: number;
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
