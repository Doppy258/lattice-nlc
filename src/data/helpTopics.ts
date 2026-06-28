/**
 * The help-center knowledge base — a curated set of ~20 questions organised
 * into 6 categories (Getting started, Claiming & passes, Reviews & rankings,
 * Reports & export, For businesses, Account & safety). Content mirrors how
 * Lattice actually behaves so the answers stay accurate without referencing
 * internal implementation details.
 */
import type { IconName } from "@/components/common/Icon";

/** Who a help topic is relevant to. "all" shows for both roles. */
export type HelpAudience = "all" | "customer" | "business";

/** A single help-center entry: a question, its answer, and an optional deep-link. */
export type HelpTopic = {
  id: string;
  category: string;
  question: string;
  answer: string;
  audience: HelpAudience;
  /** Optional "take me there" deep-link into the app. */
  action?: { label: string; path: string };
};

/** Display metadata for each help category (order + icon). */
export const HELP_CATEGORIES: { id: string; icon: IconName }[] = [
  { id: "Getting started", icon: "home" },
  { id: "Claiming & passes", icon: "claims" },
  { id: "Reviews & rankings", icon: "rankings" },
  { id: "Reports & export", icon: "reports" },
  { id: "For businesses", icon: "store" },
  { id: "Account & safety", icon: "shield" },
];

/**
 * The help-center knowledge base. Content mirrors how Lattice actually behaves —
 * the Lattice Pass lifecycle, verified reviews/rankings, match scoring, and
 * the report export tools — so the answers stay accurate.
 */
export const HELP_TOPICS: HelpTopic[] = [
  // ── Getting started ──────────────────────────────────────────
  {
    id: "what-is-lattice",
    category: "Getting started",
    question: "What is Lattice?",
    answer:
      "Lattice connects you with deals from local businesses. Tell us what you need with a Lattice request, and our matching engine ranks the best nearby offers for you — by price, distance, rating, timing, and your preferences.",
    audience: "customer",
  },
  {
    id: "create-lattice",
    category: "Getting started",
    question: "How do I find offers that fit what I need?",
    answer:
      "Create a Lattice: pick a category and what you need, set a budget, distance, and time window, and we'll rank matching offers with a short explanation of why each one fits.",
    audience: "customer",
    action: { label: "Create a Lattice", path: "/create" },
  },
  {
    id: "how-matching-works",
    category: "Getting started",
    question: "How does Lattice decide which offers to show me?",
    answer:
      "Our matching engine scores every active offer across seven signals — category fit, budget, distance, rating, availability during your time window, verification, and how well it matches your stated preferences. The Matches page shows the highest-scoring offers first, each with the reasons behind its score.",
    audience: "customer",
    action: { label: "See your matches", path: "/matches" },
  },
  {
    id: "browse-explore",
    category: "Getting started",
    question: "Can I just browse without making a request?",
    answer:
      "Yes. Explore lets you search and filter every local business and offer by category, rating, and reviews, and bookmark the ones you like.",
    audience: "customer",
    action: { label: "Explore offers", path: "/explore" },
  },

  // ── Claiming & passes ────────────────────────────────────────
  {
    id: "claim-offer",
    category: "Claiming & passes",
    question: "How do I claim an offer?",
    answer:
      "Tap “Claim” on any offer. You'll pass a quick human-verification check (to keep offers fair and bot-free), and then a Lattice Pass is created for you.",
    audience: "customer",
    action: { label: "Explore offers", path: "/explore" },
  },
  {
    id: "what-is-pass",
    category: "Claiming & passes",
    question: "What is a Lattice Pass and how do I redeem it?",
    answer:
      "A Lattice Pass is your proof of claim. Show its QR code or 6-digit code to the business; once they approve it in-store within the redemption window, the pass is marked redeemed. Passes that aren't approved in time expire automatically.",
    audience: "customer",
    action: { label: "View your passes", path: "/claims" },
  },
  {
    id: "pass-expired",
    category: "Claiming & passes",
    question: "Why did my pass expire?",
    answer:
      "Each pass has a short redemption window so businesses can manage limited inventory. If it isn't approved before the window closes, it expires and the reserved spot is released back to others.",
    audience: "customer",
    action: { label: "View your passes", path: "/claims" },
  },
  {
    id: "why-human-check",
    category: "Claiming & passes",
    question: "Why do I have to verify I'm human when claiming?",
    answer:
      "The human check stops bots from mass-claiming and exhausting an offer's limited spots. It's a quick, offline-friendly challenge — just confirm the checkbox and type the code shown.",
    audience: "customer",
  },

  // ── Reviews & rankings ───────────────────────────────────────
  {
    id: "leave-review",
    category: "Reviews & rankings",
    question: "How do I leave a review?",
    answer:
      "Reviews unlock after you redeem a pass at a business — that keeps every review verified. Open the redeemed claim and rate your experience from 1 to 5 with optional tags.",
    audience: "customer",
    action: { label: "View your passes", path: "/claims" },
  },
  {
    id: "rank-businesses",
    category: "Reviews & rankings",
    question: "How do personal rankings work?",
    answer:
      "You can rank businesses you've claimed an offer from. Lattice uses quick head-to-head comparisons (binary insertion) so you only answer a few questions to place each one in your personal leaderboard.",
    audience: "customer",
    action: { label: "Open rankings", path: "/rankings" },
  },
  {
    id: "save-favorites",
    category: "Reviews & rankings",
    question: "How do I save a business or offer for later?",
    answer:
      "Tap the bookmark icon on any business or offer to add it to Saved, where you can revisit and claim it anytime.",
    audience: "customer",
    action: { label: "Open saved", path: "/saved" },
  },

  // ── Reports & export ─────────────────────────────────────────
  {
    id: "customer-report",
    category: "Reports & export",
    question: "What's in my impact report?",
    answer:
      "Your report summarizes how much you've saved, what you claim most, the businesses you support, and the ratings you've given. Use the date-range, category, and status filters to customize what it covers.",
    audience: "customer",
    action: { label: "Open reports", path: "/reports" },
  },
  {
    id: "export-report-customer",
    category: "Reports & export",
    question: "Can I export or print my report?",
    answer:
      "Yes. Use “Export CSV” to download the data for a spreadsheet, or “Print” to produce a clean PDF via your browser's print dialog — the app chrome is hidden so only the report prints.",
    audience: "customer",
    action: { label: "Open reports", path: "/reports" },
  },
  {
    id: "export-report-business",
    category: "Reports & export",
    question: "Can I export my business analytics?",
    answer:
      "Yes. On Analytics, filter by date range and status, then “Export CSV” for a spreadsheet or “Print” for a presentable PDF of your performance report.",
    audience: "business",
    action: { label: "Open analytics", path: "/analytics" },
  },

  // ── For businesses ───────────────────────────────────────────
  {
    id: "create-offer",
    category: "For businesses",
    question: "How do I publish an offer?",
    answer:
      "Go to New offer, set the title, description, price (and optional original price), validity window, and how many claims you'll allow. Offers inherit your storefront's category so they always match.",
    audience: "business",
    action: { label: "Create an offer", path: "/create-offer" },
  },
  {
    id: "redeem-pass",
    category: "For businesses",
    question: "How do I redeem a customer's pass?",
    answer:
      "Open Redeem, then scan the customer's QR code or enter their 6-digit backup code. Lattice validates the pass is live and unredeemed before you approve it in-store.",
    audience: "business",
    action: { label: "Open redeem", path: "/redeem" },
  },
  {
    id: "business-analytics",
    category: "For businesses",
    question: "What do my analytics show?",
    answer:
      "Analytics tracks your conversion funnel (views → claims → redeemed), pass-approval rate, repeat customers, revenue influenced, and the tags customers mention most — all filterable and exportable.",
    audience: "business",
    action: { label: "Open analytics", path: "/analytics" },
  },
  {
    id: "switch-business",
    category: "For businesses",
    question: "I manage more than one storefront — how do I switch?",
    answer:
      "Use the business switcher in the top bar to change which storefront you're managing. Offers, redemptions, reviews, and analytics all follow the active business.",
    audience: "business",
  },

  // ── Account & safety ─────────────────────────────────────────
  {
    id: "bot-protection",
    category: "Account & safety",
    question: "How does Lattice keep out bots?",
    answer:
      "Account creation and offer claims are protected by a verification step. We use reCAPTCHA where available and a built-in human-check challenge as a reliable fallback, so spam accounts and automated claiming are blocked.",
    audience: "all",
  },
  {
    id: "verified-reviews",
    category: "Account & safety",
    question: "Are reviews and ratings trustworthy?",
    answer:
      "Every review is tied to a redeemed pass, so only people who actually visited can rate a business. That's why a business's rating reflects real, verified experiences.",
    audience: "all",
  },
  {
    id: "update-settings",
    category: "Account & safety",
    question: "Where do I update my preferences or sign out?",
    answer:
      "Open Settings to adjust your preferences, default distance, and accessibility needs. You can sign out from the profile menu in the top-right.",
    audience: "all",
    action: { label: "Open settings", path: "/settings" },
  },
];
