import { describe, expect, it } from "vitest";
import { validateOfferInput, type OfferInput } from "./offerService";
import { MAX_OFFER_CLAIMS } from "../utils/constants";

function offer(overrides: Partial<OfferInput> = {}): OfferInput {
  return {
    title: "Half-price lunch special",
    description: "A genuine lunchtime discount for nearby students and locals.",
    offerType: "discount",
    discountKind: "percent",
    percentOff: 50,
    price: 0,
    validFrom: "2099-01-01T00:00:00.000Z",
    validUntil: "2099-02-01T00:00:00.000Z",
    maxClaims: 100,
    tags: [],
    studentOnly: false,
    verificationRequired: true,
    oneTimePerUser: true,
    redemptionWindowMinutes: 30,
    ...overrides,
  };
}

describe("validateOfferInput", () => {
  it("accepts a well-formed offer", () => {
    expect(validateOfferInput(offer()).valid).toBe(true);
  });

  it("rejects link-stuffed or spammy titles (semantic)", () => {
    const res = validateOfferInput(offer({ title: "Buy now at spam.io/deal" }));
    expect(res.valid).toBe(false);
    expect(res.errors).toContainEqual(expect.objectContaining({ field: "title" }));
  });

  it("rejects spam descriptions", () => {
    const res = validateOfferInput(offer({ description: "deal deal deal deal deal deal" }));
    expect(res.valid).toBe(false);
    expect(res.errors).toContainEqual(expect.objectContaining({ field: "description" }));
  });

  it("bounds the claim cap to a sane maximum", () => {
    const res = validateOfferInput(offer({ maxClaims: MAX_OFFER_CLAIMS + 1 }));
    expect(res.valid).toBe(false);
    expect(res.errors).toContainEqual(expect.objectContaining({ field: "maxClaims" }));
  });

  it("keeps percent bounds (1–100)", () => {
    expect(validateOfferInput(offer({ percentOff: 150 })).valid).toBe(false);
  });
});
