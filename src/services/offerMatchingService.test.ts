import { describe, it, expect } from "vitest";
import { getMatchingOffers } from "./offerMatchingService";
import type { Business, Offer, PingRequest, User } from "../models";

// Regression: a freshly onboarded business is created with hours: [] (onboarding
// collects no hours). It must still match a food / lunch / no-budget / within-5km
// request for an offer 3.7 km away — empty hours mean "unknown", not "closed".
function makeScenario() {
  const origin = { lat: 43.6532, lng: -79.3832 }; // user location
  // ~3.7 km north of origin.
  const business: Business = {
    id: "biz1",
    name: "New Spot",
    category: "food",
    description: "x",
    address: "x",
    location: { lat: 43.6865, lng: -79.3832 },
    hours: [], // <-- the bug trigger: onboarding creates businesses with no hours
    ratingAverage: 0,
    reviewCount: 0,
    verified: false,
    priceLevel: 2,
    tags: ["food"],
    accessibilityFeatures: [],
    ownerUserId: "u2",
    createdAt: new Date().toISOString(),
  };
  const now = Date.now();
  const offer: Offer = {
    id: "off1",
    businessId: "biz1",
    category: "food",
    needType: "lunch",
    title: "Lunch bowl",
    description: "x",
    offerType: "discount",
    discountKind: "fixedPrice",
    price: 12,
    validFrom: new Date(now - 60 * 60 * 1000).toISOString(),
    validUntil: new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString(),
    maxClaims: 25,
    currentClaims: 0,
    views: 0,
    tags: [],
    studentOnly: false,
    verificationRequired: false,
    oneTimePerUser: true,
    redemptionWindowMinutes: 5,
    active: true,
    createdAt: new Date().toISOString(),
  };
  const request: PingRequest = {
    id: "req1",
    userId: "u1",
    category: "food",
    needType: "lunch",
    budgetMin: undefined,
    budgetMax: undefined, // "No budget"
    distanceKm: 5,
    timeStart: new Date(now).toISOString(),
    timeEnd: new Date(now + 2 * 60 * 60 * 1000).toISOString(),
    preferences: [],
    verifiedHuman: true,
    status: "submitted",
    createdAt: new Date().toISOString(),
  };
  const user: User = { id: "u1", name: "Stu", location: origin } as User;
  return { business, offer, request, user };
}

describe("getMatchingOffers — empty-hours business", () => {
  it("matches a 3.7km food/lunch offer from a business with no published hours", () => {
    const { business, offer, request, user } = makeScenario();
    const matches = getMatchingOffers(request, [offer], [business], user);
    expect(matches.length).toBe(1);
    expect(matches[0].offerId).toBe("off1");
    expect(matches[0].score).toBeGreaterThan(0);
  });

  it("still excludes an offer beyond the requested radius", () => {
    const { business, offer, request, user } = makeScenario();
    const far: Business = { ...business, location: { lat: 44.2, lng: -79.3832 } }; // ~60km
    const matches = getMatchingOffers(request, [offer], [far], user);
    expect(matches.length).toBe(0);
  });
});
