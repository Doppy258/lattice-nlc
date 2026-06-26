/**
 * Tests for the repository layer and RPC wrappers. Uses a minimal fake
 * Supabase client to verify that `hydrateAppData` de-dupes self profiles,
 * `claimRepo.create` returns mapped claims, and `requestRepo.submit`
 * passes snake_case params to the underlying RPC without real DB calls.
 */
import { describe, it, expect } from "vitest";
import { hydrateAppData, claimRepo, requestRepo } from "./index";

function fakeClient(
  tables: Record<string, unknown[]>,
  rpc?: (fn: string, args: unknown) => { data: unknown; error: { message: string } | null },
) {
  return {
    from: (t: string) => ({ select: async () => ({ data: tables[t] ?? [], error: null }) }),
    rpc: async (fn: string, args: unknown) => (rpc ? rpc(fn, args) : { data: null, error: null }),
  } as never;
}

describe("hydrateAppData", () => {
  it("assembles AppData from all tables and de-dupes self from public_profiles", async () => {
    const client = fakeClient({
      profiles: [{
        id: "self", name: "Me", email: "me@x.io", role: "customer",
        verified: true, preferences: null, onboarding_complete: true, created_at: "t",
      }],
      public_profiles: [
        { id: "self", name: "Me", role: "customer", verified: true },
        { id: "other", name: "Ana", role: "businessOwner", verified: true },
      ],
      businesses: [], offers: [], claims: [], reviews: [], requests: [],
    });
    const data = await hydrateAppData(client, "self");
    expect(data.users.map((u) => u.id).sort()).toEqual(["other", "self"]);
    expect(data.users.find((u) => u.id === "self")!.email).toBe("me@x.io"); // full profile wins
    expect(data.savedBusinesses).toEqual([]);
  });
});

describe("claimRepo.create", () => {
  it("returns the mapped claim on success", async () => {
    const client = fakeClient({}, () => ({
      data: {
        id: "c1", user_id: "u", offer_id: "o", business_id: "b",
        claim_code: "PING-1111", status: "active", created_at: "t", expires_at: "t2", redeemed_at: null,
      },
      error: null,
    }));
    const claim = await claimRepo.create("o", client);
    expect(claim.claimCode).toBe("PING-1111");
  });

  it("throws a mapped RepoError on RPC failure", async () => {
    const client = fakeClient({}, () => ({ data: null, error: { message: "OFFER_FULL" } }));
    await expect(claimRepo.create("o", client)).rejects.toMatchObject({ code: "OFFER_FULL" });
  });
});

describe("requestRepo.submit", () => {
  it("passes snake_case params to the RPC", async () => {
    let received: Record<string, unknown> = {};
    const client = fakeClient({}, (_fn, args) => {
      received = args as Record<string, unknown>;
      return {
        data: {
          id: "r", user_id: "u", category: "food", need_type: "lunch", budget_min: null, budget_max: 15,
          distance_km: 3, time_start: "s", time_end: "e", preferences: [], optional_note: null, verified_human: true,
          status: "submitted", created_at: "c",
        },
        error: null,
      };
    });
    await requestRepo.submit({
      category: "food", needType: "lunch", distanceKm: 3, timeStart: "s", timeEnd: "e",
      budgetMax: 15, preferences: [], verifiedHuman: true,
    }, client);
    expect(received.p_need_type).toBe("lunch");
    expect(received.p_budget_min).toBeNull();
  });
});
