/** Discount presentation helpers. Pure functions, no side effects. */

import type { DiscountKind, Offer } from "../models";
import { formatCurrency } from "./formatting";

export type OfferPricing =
  | {
      kind: "fixedPrice";
      /** Final price the customer pays. */
      price: number;
      originalPrice?: number;
      /** originalPrice − price, or 0 when there's no struck-through original. */
      savings: number;
      /** Big text shown in the card's price slot, e.g. "$11.99". */
      headline: string;
      /** Optional image badge, e.g. "Save $4". Absent when there are no savings. */
      badge?: string;
    }
  | { kind: "percent"; percentOff: number; headline: string; badge: string } // "20% off"
  | { kind: "amountOff"; amountOff: number; headline: string; badge: string }; // "$5 off"

/** Treats a missing discountKind as "fixedPrice" for back-compat. */
export function offerDiscountKind(offer: Offer): DiscountKind {
  return offer.discountKind ?? "fixedPrice";
}

/** Single source of truth for how an offer's discount is displayed. */
export function getOfferPricing(offer: Offer): OfferPricing {
  switch (offerDiscountKind(offer)) {
    case "percent": {
      const percentOff = offer.percentOff ?? 0;
      const headline = `${percentOff}% off`;
      return { kind: "percent", percentOff, headline, badge: headline };
    }
    case "amountOff": {
      const amountOff = offer.amountOff ?? 0;
      const headline = `${formatCurrency(amountOff)} off`;
      return { kind: "amountOff", amountOff, headline, badge: headline };
    }
    case "fixedPrice":
    default: {
      const savings =
        offer.originalPrice && offer.originalPrice > offer.price
          ? offer.originalPrice - offer.price
          : 0;
      return {
        kind: "fixedPrice",
        price: offer.price,
        originalPrice: offer.originalPrice,
        savings,
        headline: formatCurrency(offer.price),
        badge: savings > 0 ? `Save ${formatCurrency(savings)}` : undefined,
      };
    }
  }
}

/**
 * Dollars a customer saves on a single redemption, for analytics.
 * Unknown (0) for percent offers since the item price varies.
 */
export function offerSavingsPerRedemption(offer: Offer): number {
  switch (offerDiscountKind(offer)) {
    case "amountOff":
      return offer.amountOff ?? 0;
    case "percent":
      return 0;
    case "fixedPrice":
    default:
      return offer.originalPrice && offer.originalPrice > offer.price
        ? offer.originalPrice - offer.price
        : 0;
  }
}
