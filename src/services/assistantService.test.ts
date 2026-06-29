import { describe, expect, it, vi } from "vitest";
import { answerQuestion, starterQuestions, topicVisibleTo } from "./assistantService";
import type { HelpTopic } from "@/data/helpTopics";

vi.mock("@/services/aiProvider", () => ({
  callAI: vi.fn(() => Promise.reject(new Error("mock AI unavailable"))),
}));

const customerTopic: HelpTopic = {
  id: "t",
  category: "Getting started",
  question: "test",
  answer: "test",
  audience: "customer",
};

describe("answerQuestion", () => {
  it("matches a claiming question to the claim topic", async () => {
    const res = await answerQuestion("how do I claim an offer?", "customer");
    expect(res.best?.id).toBe("claim-offer");
    expect(res.confidence).toBeGreaterThan(0);
  });

  it("resolves synonyms — 'coupon' finds offer/deal content", async () => {
    const res = await answerQuestion("where are the coupons", "customer");
    expect(res.best).not.toBeNull();
  });

  it("understands the bot-verification question", async () => {
    const res = await answerQuestion("why the captcha when claiming", "customer");
    expect(res.best).not.toBeNull();
  });

  it("returns popular topics (no confident best) for gibberish", async () => {
    const res = await answerQuestion("zxqw qwzx", "customer");
    expect(res.best).toBeNull();
    expect(res.related.length).toBeGreaterThan(0);
  });

  it("respects role visibility — customers don't get business-only answers", async () => {
    const res = await answerQuestion("how do I redeem a customer's pass", "customer");
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
