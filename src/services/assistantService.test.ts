import { describe, expect, it } from "vitest";
import { answerQuestion, starterQuestions, topicVisibleTo } from "./assistantService";
import type { HelpTopic } from "@/data/helpTopics";

const customerTopic: HelpTopic = {
  id: "t",
  category: "Getting started",
  question: "test",
  answer: "test",
  audience: "customer",
};

describe("answerQuestion", () => {
  it("matches a claiming question to the claim topic", () => {
    const res = answerQuestion("how do I claim an offer?", "customer");
    expect(res.best?.id).toBe("claim-offer");
    expect(res.confidence).toBeGreaterThan(0);
  });

  it("resolves synonyms — 'coupon' finds offer/deal content", () => {
    const res = answerQuestion("where are the coupons", "customer");
    expect(res.best).not.toBeNull();
  });

  it("understands the bot-verification question", () => {
    const res = answerQuestion("why the captcha when claiming", "customer");
    expect(res.best).not.toBeNull();
  });

  it("returns popular topics (no confident best) for gibberish", () => {
    const res = answerQuestion("zxqw qwzx", "customer");
    expect(res.best).toBeNull();
    expect(res.related.length).toBeGreaterThan(0);
  });

  it("respects role visibility — customers don't get business-only answers", () => {
    const res = answerQuestion("how do I redeem a customer's pass", "customer");
    // redeem-pass is business-only, so it must not surface for a customer.
    expect(res.best?.id).not.toBe("redeem-pass");
  });
});

describe("topicVisibleTo", () => {
  it("shows customer topics to customers, hides them from owners", () => {
    expect(topicVisibleTo(customerTopic, "customer")).toBe(true);
    expect(topicVisibleTo(customerTopic, "businessOwner")).toBe(false);
  });
});

describe("starterQuestions", () => {
  it("returns role-appropriate, non-empty suggestions", () => {
    expect(starterQuestions("customer").length).toBeGreaterThan(0);
    expect(starterQuestions("businessOwner").every((t) => t.audience !== "customer")).toBe(true);
  });
});
