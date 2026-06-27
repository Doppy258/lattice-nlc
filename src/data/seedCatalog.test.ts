import { describe, it, expect } from "vitest";
import { buildSeedData } from "./seed";
import { NEED_TYPES_BY_CATEGORY } from "./catalog";
import type { BusinessCategory } from "../models";

const data = buildSeedData(new Date("2026-06-26T12:00:00.000Z"));
const businessById = new Map(data.businesses.map((b) => [b.id, b]));
const offerById = new Map(data.offers.map((o) => [o.id, o]));

// San Antonio bounding box (generous) — every seeded business must sit inside it.
const SA = { latMin: 29.1, latMax: 29.85, lngMin: -98.95, lngMax: -98.2 };

describe("seed catalog integrity", () => {
  it("has a large catalog", () => {
    expect(data.businesses.length).toBeGreaterThanOrEqual(75);
    expect(data.offers.length).toBeGreaterThanOrEqual(105);
  });

  it("has no duplicate business or offer ids", () => {
    expect(new Set(data.businesses.map((b) => b.id)).size).toBe(data.businesses.length);
    expect(new Set(data.offers.map((o) => o.id)).size).toBe(data.offers.length);
  });

  it("every business has valid category and a San Antonio location", () => {
    for (const b of data.businesses) {
      expect(NEED_TYPES_BY_CATEGORY[b.category], `category ${b.category} (${b.id})`).toBeTruthy();
      expect(b.location.lat, b.id).toBeGreaterThanOrEqual(SA.latMin);
      expect(b.location.lat, b.id).toBeLessThanOrEqual(SA.latMax);
      expect(b.location.lng, b.id).toBeGreaterThanOrEqual(SA.lngMin);
      expect(b.location.lng, b.id).toBeLessThanOrEqual(SA.lngMax);
    }
  });

  it("every offer links a real business, matches its category, and uses a valid needType", () => {
    for (const o of data.offers) {
      const b = businessById.get(o.businessId);
      expect(b, `offer ${o.id} -> business ${o.businessId}`).toBeDefined();
      expect(o.category, o.id).toBe(b!.category);
      expect(NEED_TYPES_BY_CATEGORY[o.category], `${o.id} needType`).toContain(o.needType);
    }
  });

  it("covers every (category, needType) subcategory with >= 3 distinct businesses", () => {
    const coverage = new Map<string, Set<string>>();
    for (const [cat, needs] of Object.entries(NEED_TYPES_BY_CATEGORY))
      for (const n of needs) coverage.set(`${cat}:${n}`, new Set());
    for (const o of data.offers) {
      const b = businessById.get(o.businessId);
      if (b) coverage.get(`${b.category}:${o.needType}`)?.add(b.id);
    }
    const gaps = [...coverage.entries()].filter(([, set]) => set.size < 3).map(([k, s]) => `${k}=${s.size}`);
    expect(gaps, `subcategories below 3 businesses: ${gaps.join(", ")}`).toEqual([]);
  });

  it("every (category, needType) pair in the taxonomy exists", () => {
    const pairs = Object.entries(NEED_TYPES_BY_CATEGORY).flatMap(([c, ns]) =>
      ns.map((n) => `${c}:${n}`),
    );
    expect(pairs.length).toBe(35);
  });

  it("dependent seeds (reviews, claims, rankings, saves) have no dangling references", () => {
    for (const r of data.reviews) {
      expect(businessById.has(r.businessId), `review ${r.id} biz`).toBe(true);
      expect(offerById.has(r.offerId), `review ${r.id} offer`).toBe(true);
    }
    for (const c of data.claims) {
      expect(businessById.has(c.businessId), `claim ${c.id} biz`).toBe(true);
      expect(offerById.has(c.offerId), `claim ${c.id} offer`).toBe(true);
    }
    for (const rk of data.rankings)
      for (const id of rk.rankedBusinessIds)
        expect(businessById.has(id), `ranking ${rk.category}/${rk.needType} -> ${id}`).toBe(true);
    for (const s of data.savedBusinesses)
      expect(businessById.has(s.businessId), `saved business ${s.businessId}`).toBe(true);
    for (const s of data.savedOffers)
      expect(offerById.has(s.offerId), `saved offer ${s.offerId}`).toBe(true);
  });

  it("seeded users' saved ids resolve to real catalog entries", () => {
    for (const u of data.users) {
      for (const id of u.preferences.savedBusinessIds)
        expect(businessById.has(id), `${u.id} savedBusiness ${id}`).toBe(true);
      for (const id of u.preferences.savedOfferIds)
        expect(offerById.has(id), `${u.id} savedOffer ${id}`).toBe(true);
    }
  });
});

describe("matching works against the new catalog", () => {
  it("food/lunch/no-budget/within-10km returns multiple matches from downtown", async () => {
    const { getMatchingOffers } = await import("../services/offerMatchingService");
    const req = {
      id: "preview",
      userId: "user_lucas",
      category: "food" as BusinessCategory,
      needType: "lunch" as const,
      budgetMin: undefined,
      budgetMax: undefined,
      distanceKm: 10,
      timeStart: new Date("2026-06-26T12:00:00").toISOString(),
      timeEnd: new Date("2026-06-26T14:00:00").toISOString(),
      preferences: [],
      verifiedHuman: true,
      status: "submitted" as const,
      createdAt: new Date("2026-06-26T11:00:00").toISOString(),
    };
    const user = { id: "user_lucas", location: { lat: 29.4241, lng: -98.4936 } } as never;
    const matches = getMatchingOffers(req, data.offers, data.businesses, user);
    expect(matches.length).toBeGreaterThanOrEqual(3);
  });
});
