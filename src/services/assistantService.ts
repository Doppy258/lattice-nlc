/**
 * assistantService — the offline "Ask Lattice" intelligent Q&A engine.
 *
 * A dependency-free retrieval ranker over the help knowledge base. It tokenizes
 * the user's question, expands domain synonyms, and scores every help topic by
 * weighted term overlap (question > category > answer), then returns the best
 * answer plus related follow-ups. Everything runs client-side, so it works with
 * no network — important for the offline competition demo, where judges can't
 * open external links or scan QR codes.
 *
 * Key exports: answerQuestion, starterQuestions, topicVisibleTo
 */
import { HELP_TOPICS, type HelpTopic } from "@/data/helpTopics";

/** A help topic paired with its relevance score for a given query. */
export type AssistantMatch = { topic: HelpTopic; score: number };

/** The engine's response to one question. */
export type AssistantAnswer = {
  /** Best-matching topic, or null when nothing clears the relevance floor. */
  best: HelpTopic | null;
  /** Confidence 0–1, the top score relative to the strongest possible match. */
  confidence: number;
  /** Up to three related topics offered as follow-up suggestions. */
  related: HelpTopic[];
};

/** Common words carrying little topical signal; dropped before scoring. */
const STOPWORDS = new Set([
  "the", "a", "an", "to", "of", "is", "it", "i", "do", "how", "what", "why", "can", "my", "me",
  "you", "your", "and", "or", "for", "in", "on", "at", "with", "this", "that", "does", "are", "be",
  "get", "got", "when", "where", "which", "about", "from", "if", "im", "ive", "there", "here", "as",
]);

/**
 * Domain synonym expansion: a query token also matches these related terms that
 * appear in the knowledge base. Lets "coupon" find offer/deal answers, etc.
 */
const SYNONYMS: Record<string, string[]> = {
  coupon: ["offer", "deal", "discount"],
  coupons: ["offer", "deal", "discount"],
  deal: ["offer", "discount"],
  deals: ["offer", "discount"],
  discount: ["offer", "deal", "student"],
  offer: ["deal", "discount"],
  offers: ["deal", "discount"],
  save: ["bookmark", "saved", "favourite", "favorite"],
  saved: ["bookmark", "save"],
  bookmark: ["saved", "save"],
  favourite: ["saved", "save"],
  favorite: ["saved", "save"],
  qr: ["pass", "code", "redeem"],
  pass: ["redeem", "code", "claim"],
  redeem: ["pass", "approve", "code"],
  claim: ["pass", "offer"],
  expire: ["expired", "window"],
  expired: ["expire", "window"],
  captcha: ["human", "bot", "verify", "verification"],
  bot: ["human", "verify", "verification", "captcha"],
  bots: ["human", "verify", "verification", "captcha"],
  human: ["verify", "verification", "bot", "captcha"],
  verify: ["verification", "human", "bot"],
  rating: ["review", "rate", "stars"],
  ratings: ["review", "rate", "stars"],
  rate: ["review", "rating"],
  review: ["rating", "verified"],
  reviews: ["rating", "verified"],
  rank: ["ranking", "leaderboard", "compare"],
  rankings: ["rank", "leaderboard"],
  ranking: ["rank", "leaderboard"],
  filter: ["sort", "customize", "category"],
  sort: ["filter", "customize"],
  export: ["csv", "download", "print", "report"],
  csv: ["export", "download"],
  download: ["export", "csv"],
  print: ["export", "report", "pdf"],
  report: ["impact", "analytics", "export"],
  analytics: ["report", "performance"],
  category: ["food", "retail", "services", "filter"],
  match: ["matching", "offerrank", "recommend"],
  matches: ["matching", "offerrank", "recommend"],
  matching: ["match", "offerrank"],
  recommend: ["match", "matching"],
  business: ["storefront", "store", "owner"],
  storefront: ["business", "profile"],
  password: ["account", "sign", "login"],
  signout: ["sign", "logout", "account"],
  settings: ["preferences", "account"],
  distance: ["near", "nearby", "radius"],
  near: ["distance", "nearby"],
  nearby: ["distance", "near"],
};

/** Whether a topic should surface for the current role (mirrors the Help page). */
export function topicVisibleTo(topic: HelpTopic, role: string): boolean {
  if (topic.audience === "all") return true;
  if (role === "businessOwner") return topic.audience === "business";
  return topic.audience === "customer";
}

/** Lowercase, strip punctuation, split, drop stopwords and single characters. */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

/**
 * Scores one topic against the query tokens. Each query token (and its synonyms)
 * is matched against the topic, scored by *where* it lands — the question is
 * worth most (3), the category next (2), the answer body least (1) — taking the
 * strongest placement found. An (almost) verbatim question match adds a phrase
 * bonus so exact questions win decisively.
 */
function scoreTopic(topic: HelpTopic, queryTokens: string[], normQuery: string): number {
  const qSet = new Set(tokenize(topic.question));
  const cSet = new Set(tokenize(topic.category));
  const aSet = new Set(tokenize(topic.answer));

  const placement = (term: string): number => {
    if (qSet.has(term)) return 3;
    if (cSet.has(term)) return 2;
    if (aSet.has(term)) return 1;
    return 0;
  };

  let score = 0;
  for (const tok of queryTokens) {
    const terms = [tok, ...(SYNONYMS[tok] ?? [])];
    score += Math.max(...terms.map(placement));
  }
  if (normQuery.length >= 6 && topic.question.toLowerCase().includes(normQuery)) score += 4;
  return score;
}

/**
 * Answers a free-text question by ranking the role-visible help topics. Returns
 * the best answer (when it clears a small relevance floor) plus related topics.
 */
export function answerQuestion(query: string, role: string): AssistantAnswer {
  const pool = HELP_TOPICS.filter((t) => topicVisibleTo(t, role));
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) {
    return { best: null, confidence: 0, related: pool.slice(0, 3) };
  }

  const normQuery = query.toLowerCase().trim();
  const scored: AssistantMatch[] = pool
    .map((topic) => ({ topic, score: scoreTopic(topic, queryTokens, normQuery) }))
    .sort((a, b) => b.score - a.score);

  const top = scored[0];
  const best = top && top.score >= 2 ? top.topic : null;
  const confidence = top ? Math.min(1, top.score / (queryTokens.length * 3)) : 0;

  let related = scored
    .filter((m) => m.score > 0 && m.topic.id !== best?.id)
    .slice(0, 3)
    .map((m) => m.topic);
  // Always offer something helpful, even when nothing matched.
  if (related.length === 0) {
    related = pool.filter((t) => t.id !== best?.id).slice(0, 3);
  }

  return { best, confidence, related };
}

/** A curated set of opening questions, filtered to what the role can see. */
const STARTER_IDS = [
  "create-lattice",
  "how-matching-works",
  "claim-offer",
  "what-is-pass",
  "leave-review",
  "customer-report",
  "create-offer",
  "redeem-pass",
  "business-analytics",
  "bot-protection",
];

/** Up to five role-appropriate starter questions for an empty conversation. */
export function starterQuestions(role: string): HelpTopic[] {
  const byId = new Map(HELP_TOPICS.map((t) => [t.id, t]));
  return STARTER_IDS.map((id) => byId.get(id))
    .filter((t): t is HelpTopic => !!t && topicVisibleTo(t, role))
    .slice(0, 5);
}
