import { describe, expect, it } from "vitest";
import {
  containsLink,
  isNumber,
  isRepeatedNonsense,
  isValidEmail,
  lengthWithin,
} from "./validation";

describe("isValidEmail", () => {
  it("accepts well-formed addresses", () => {
    expect(isValidEmail("you@example.com")).toBe(true);
    expect(isValidEmail("  taixue@gmail.com  ")).toBe(true); // trims first
    expect(isValidEmail("a.b+tag@sub.domain.co")).toBe(true);
  });

  it("rejects malformed or empty addresses", () => {
    expect(isValidEmail("not-an-email")).toBe(false);
    expect(isValidEmail("missing@domain")).toBe(false); // no TLD
    expect(isValidEmail("two @spaces.com")).toBe(false);
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail(undefined)).toBe(false);
  });
});

describe("validation primitives", () => {
  it("isNumber rejects NaN/Infinity", () => {
    expect(isNumber(3)).toBe(true);
    expect(isNumber(Number.NaN)).toBe(false);
    expect(isNumber(Number.POSITIVE_INFINITY)).toBe(false);
  });

  it("containsLink flags urls and bare domains", () => {
    expect(containsLink("visit https://spam.io now")).toBe(true);
    expect(containsLink("buy at shady.biz/deal")).toBe(true);
    expect(containsLink("a normal sentence")).toBe(false);
  });

  it("isRepeatedNonsense flags filler", () => {
    expect(isRepeatedNonsense("aaaaaaa")).toBe(true);
    expect(isRepeatedNonsense("spam spam spam spam")).toBe(true);
    expect(isRepeatedNonsense("Great coffee and friendly staff")).toBe(false);
  });

  it("lengthWithin respects trimmed bounds", () => {
    expect(lengthWithin("  hi  ", 2, 5)).toBe(true);
    expect(lengthWithin("x", 2, 5)).toBe(false);
  });
});
