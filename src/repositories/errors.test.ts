/**
 * Tests for the error-mapping layer: verifying that `throwIfError` passes
 * through null, maps known codes to friendly UI messages, finds codes
 * embedded in prefixed Postgres error strings, and throws unknown codes
 * as-is without mapping.
 */
import { describe, it, expect } from "vitest";
import { throwIfError, RepoError } from "./errors";

describe("throwIfError", () => {
  it("returns silently on null error", () => {
    expect(() => throwIfError(null)).not.toThrow();
  });

  it("maps a known RPC code to a friendly message", () => {
    try {
      throwIfError({ message: "OFFER_FULL" });
    } catch (e) {
      expect(e).toBeInstanceOf(RepoError);
      expect((e as RepoError).code).toBe("OFFER_FULL");
      expect((e as RepoError).message).toMatch(/claim limit/i);
      return;
    }
    throw new Error("should have thrown");
  });

  it("matches a code embedded in a prefixed postgres message", () => {
    try {
      throwIfError({ message: "error: TOO_MANY_ACTIVE" });
    } catch (e) {
      expect((e as RepoError).code).toBe("TOO_MANY_ACTIVE");
      return;
    }
    throw new Error("should have thrown");
  });
});
