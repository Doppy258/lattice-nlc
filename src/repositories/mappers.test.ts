import { describe, it, expect } from "vitest";
import { rowToClaim, rowToOffer, rowToRequest, publicRowToUser } from "./mappers";

describe("mappers", () => {
  it("maps a claim row to a Claim model", () => {
    const c = rowToClaim({
      id: "c1", user_id: "u1", offer_id: "o1", business_id: "b1",
      claim_code: "PING-1234", status: "active", created_at: "t0", expires_at: "t1", redeemed_at: null,
    });
    expect(c).toEqual({
      id: "c1", userId: "u1", offerId: "o1", businessId: "b1",
      claimCode: "PING-1234", status: "active", createdAt: "t0", expiresAt: "t1", redeemedAt: undefined,
    });
  });

  it("coerces numeric strings on offers", () => {
    const o = rowToOffer({
      id: "o1", business_id: "b1", title: "T", description: "", category: "food",
      offer_type: "discount", price: "5.00" as unknown as number, original_price: null, valid_from: "a", valid_until: "b",
      max_claims: 10, current_claims: 0, views: 0, tags: [], student_only: false, verification_required: false, active: true, created_at: "c",
    });
    expect(o.price).toBe(5);
    expect(o.originalPrice).toBeUndefined();
  });

  it("maps request need_type and optional fields", () => {
    const r = rowToRequest({
      id: "r1", user_id: "u1", category: "food", need_type: "lunch", budget_min: null,
      budget_max: 15, distance_km: 3, time_start: "s", time_end: "e", preferences: [], optional_note: null,
      verified_human: true, status: "submitted", created_at: "c",
    });
    expect(r.needType).toBe("lunch");
    expect(r.budgetMin).toBeUndefined();
    expect(r.budgetMax).toBe(15);
  });

  it("fills defaults for display-only public profile rows", () => {
    const u = publicRowToUser({ id: "u9", name: "Ana", role: "customer", verified: false });
    expect(u.name).toBe("Ana");
    expect(u.preferences.maxDefaultDistanceKm).toBe(3);
  });
});
