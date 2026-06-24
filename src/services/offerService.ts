import type { BusinessCategory, Offer, OfferType } from "../models";
import { createId } from "../utils/ids";
import { isPast } from "../utils/dateTime";
import { isNonEmpty, isNumber, lengthWithin } from "../utils/validation";

/** Lifecycle state of an offer from the owner's point of view. */
export type OfferStatus = "active" | "paused" | "expired" | "full";

/** The editable fields an owner supplies when creating or updating an offer. */
export type OfferInput = {
  title: string;
  description: string;
  offerType: OfferType;
  price: number;
  originalPrice?: number;
  validFrom: string;
  validUntil: string;
  maxClaims: number;
  tags: string[];
  studentOnly: boolean;
  verificationRequired: boolean;
};

export type OfferValidation = {
  valid: boolean;
  errors: { field: string; message: string }[];
};

export type CreateOfferResult = { ok: true; offer: Offer } | { ok: false; error: string };

const TITLE_MIN = 3;
const TITLE_MAX = 80;
const DESC_MIN = 10;
const DESC_MAX = 240;

/** Validates owner-supplied offer fields (mirrors requestValidationService style). */
export function validateOfferInput(input: OfferInput): OfferValidation {
  const errors: OfferValidation["errors"] = [];

  if (!lengthWithin(input.title, TITLE_MIN, TITLE_MAX)) {
    errors.push({ field: "title", message: `Title must be ${TITLE_MIN}-${TITLE_MAX} characters.` });
  }
  if (!lengthWithin(input.description, DESC_MIN, DESC_MAX)) {
    errors.push({
      field: "description",
      message: `Description must be ${DESC_MIN}-${DESC_MAX} characters.`,
    });
  }
  if (!isNumber(input.price) || input.price < 0) {
    errors.push({ field: "price", message: "Price must be zero or more." });
  }
  if (input.originalPrice !== undefined) {
    if (!isNumber(input.originalPrice) || input.originalPrice <= input.price) {
      errors.push({
        field: "originalPrice",
        message: "Original price must be greater than the offer price.",
      });
    }
  }
  if (!isNonEmpty(input.validFrom) || !isNonEmpty(input.validUntil)) {
    errors.push({ field: "validUntil", message: "Choose when the offer starts and ends." });
  } else if (Date.parse(input.validUntil) <= Date.parse(input.validFrom)) {
    errors.push({ field: "validUntil", message: "The end date must be after the start date." });
  } else if (isPast(input.validUntil)) {
    errors.push({ field: "validUntil", message: "The end date is already in the past." });
  }
  if (!Number.isInteger(input.maxClaims) || input.maxClaims < 1) {
    errors.push({ field: "maxClaims", message: "Allow at least one claim." });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates and builds a new offer (does not persist). The category is inherited
 * from the owning business so offers always match their storefront.
 */
export function createOffer(
  input: OfferInput,
  businessId: string,
  category: BusinessCategory,
  now = new Date()
): CreateOfferResult {
  const validation = validateOfferInput(input);
  if (!validation.valid) return { ok: false, error: validation.errors[0].message };

  const offer: Offer = {
    id: createId("offer"),
    businessId,
    title: input.title.trim(),
    description: input.description.trim(),
    category,
    offerType: input.offerType,
    price: input.price,
    originalPrice: input.originalPrice,
    validFrom: input.validFrom,
    validUntil: input.validUntil,
    maxClaims: input.maxClaims,
    currentClaims: 0,
    views: 0,
    tags: input.tags,
    studentOnly: input.studentOnly,
    verificationRequired: input.verificationRequired,
    active: true,
    createdAt: now.toISOString(),
  };
  return { ok: true, offer };
}

/** Returns a new offers array with `offerId` patched from validated input. */
export function updateOffer(offerId: string, input: OfferInput, offers: Offer[]): Offer[] {
  return offers.map((o) =>
    o.id === offerId
      ? {
          ...o,
          title: input.title.trim(),
          description: input.description.trim(),
          offerType: input.offerType,
          price: input.price,
          originalPrice: input.originalPrice,
          validFrom: input.validFrom,
          validUntil: input.validUntil,
          maxClaims: input.maxClaims,
          tags: input.tags,
          studentOnly: input.studentOnly,
          verificationRequired: input.verificationRequired,
        }
      : o
  );
}

/** Pauses or resumes an offer by flipping its `active` flag. */
export function toggleOfferActive(offerId: string, offers: Offer[]): Offer[] {
  return offers.map((o) => (o.id === offerId ? { ...o, active: !o.active } : o));
}

/** Removes an offer entirely. Callers should guard offers that have claims. */
export function deleteOffer(offerId: string, offers: Offer[]): Offer[] {
  return offers.filter((o) => o.id !== offerId);
}

export function getOwnerOffers(businessId: string, offers: Offer[]): Offer[] {
  return offers.filter((o) => o.businessId === businessId);
}

/** Maps an offer to its owner-facing lifecycle status. */
export function classifyOffer(offer: Offer, now = new Date()): OfferStatus {
  if (isPast(offer.validUntil, now)) return "expired";
  if (!offer.active) return "paused";
  if (offer.currentClaims >= offer.maxClaims) return "full";
  return "active";
}
