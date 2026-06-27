import { describe, expect, it } from "vitest";
import { validatePingRequest, type PingDraft } from "./requestValidationService";
import type { PingRequest } from "../models";

const futureStart = "2099-06-26T12:00:00.000Z";
const futureEnd = "2099-06-26T13:00:00.000Z";

function draft(overrides: Partial<PingDraft> = {}): PingDraft {
  return {
    userId: "user_1",
    category: "food",
    needType: "lunch",
    budgetMax: 12,
    distanceKm: 3,
    timeStart: futureStart,
    timeEnd: futureEnd,
    preferences: [],
    ...overrides,
  };
}

function request(id: string, overrides: Partial<PingRequest> = {}): PingRequest {
  return {
    id,
    userId: "user_1",
    category: "food",
    needType: "lunch",
    budgetMax: 12,
    distanceKm: 3,
    timeStart: futureStart,
    timeEnd: futureEnd,
    preferences: [],
    verifiedHuman: true,
    status: "submitted",
    createdAt: "2099-06-26T11:00:00.000Z",
    ...overrides,
  };
}

describe("validatePingRequest", () => {
  it("allows unlimited active and repeated lattices", () => {
    const existing = Array.from({ length: 6 }, (_, index) => request(`req_${index}`));

    const result = validatePingRequest(draft(), existing, new Date("2099-06-26T11:05:00.000Z"));

    expect(result.errors.map((error) => error.field)).not.toContain("duplicate");
    expect(result.valid).toBe(true);
  });

  it("keeps semantic validation for low budgets", () => {
    const result = validatePingRequest(draft({ budgetMax: 1 }));

    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ field: "budget" }),
    );
  });
});
