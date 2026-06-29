import type { BusinessCategory, NeedType } from "@/models";
import { NEED_TYPES_BY_CATEGORY } from "@/data/catalog";

export type NLParseConfidence = {
  overall: number;
  category: number;
  needType: number;
  budget: number;
  distance: number;
  time: number;
};

export type NLParseResult = {
  category?: BusinessCategory;
  needType?: NeedType;
  budgetMin?: number;
  budgetMax?: number;
  distanceKm?: number;
  timeStart?: string;
  timeEnd?: string;
  preferences: string[];
  locationHint: string | null;
  explanation: string;
  confidence: NLParseConfidence;
};

export type NLParseState =
  | { status: "idle" }
  | { status: "parsing" }
  | { status: "success"; result: NLParseResult }
  | { status: "partial"; result: NLParseResult; warnings: string[] }
  | { status: "failed"; error: string };

const CONFIDENCE_HIGH = 0.7;
const CONFIDENCE_MEDIUM = 0.4;

const VALID_CATEGORIES: BusinessCategory[] = [
  "food", "retail", "services", "fitness", "education", "repair", "entertainment",
];

type RawParseResponse = {
  category: string | null;
  needType: string | null;
  budgetMax: number | null;
  budgetMin: number | null;
  distanceKm: number | null;
  timeStart: string | null;
  timeEnd: string | null;
  preferences: string[];
  locationHint: string | null;
  explanation: string;
  confidence: {
    overall: number;
    category: number;
    needType: number;
    budget: number;
    distance: number;
    time: number;
  };
};

function clampConfidence(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function getParseEndpoint(): string {
  if (import.meta.env.DEV) return "/api/parse-ping";
  const supabaseUrl =
    import.meta.env.VITE_SUPABASE_URL ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://nzasnhmpcyxsgwpdxwni.supabase.co";
  return `${supabaseUrl}/functions/v1/parse-ping`;
}

function getParseHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (!import.meta.env.DEV) {
    const anonKey =
      import.meta.env.VITE_SUPABASE_ANON_KEY ||
      import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (anonKey) headers.Authorization = `Bearer ${anonKey}`;
  }
  return headers;
}

function validateAndClamp(raw: RawParseResponse): {
  result: NLParseResult;
  warnings: string[];
} {
  const warnings: string[] = [];

  let category: BusinessCategory | undefined;
  if (raw.category && VALID_CATEGORIES.includes(raw.category as BusinessCategory)) {
    category = raw.category as BusinessCategory;
  } else if (raw.category) {
    warnings.push(`Unrecognized category "${raw.category}"`);
  }

  let needType: NeedType | undefined;
  if (raw.needType && category) {
    const validTypes = NEED_TYPES_BY_CATEGORY[category];
    if (validTypes.includes(raw.needType as NeedType)) {
      needType = raw.needType as NeedType;
    } else {
      warnings.push(`"${raw.needType}" is not a valid need type for ${category}`);
    }
  } else if (raw.needType) {
    warnings.push(`Cannot determine need type "${raw.needType}" without a category`);
  }

  const budgetMax = raw.budgetMax === null
    ? undefined
    : typeof raw.budgetMax === "number" && Number.isFinite(raw.budgetMax) && raw.budgetMax >= 0
      ? raw.budgetMax
      : undefined;
  const budgetMin = raw.budgetMin === null
    ? undefined
    : typeof raw.budgetMin === "number" && Number.isFinite(raw.budgetMin) && raw.budgetMin >= 0
      ? raw.budgetMin
      : undefined;

  const distanceKm = raw.distanceKm === null
    ? 999
    : typeof raw.distanceKm === "number" && Number.isFinite(raw.distanceKm) && raw.distanceKm > 0
      ? raw.distanceKm
      : undefined;

  let timeStart: string | undefined;
  let timeEnd: string | undefined;
  if (raw.timeStart === null || raw.timeEnd === null) {
    // User said "anytime" — leave both undefined
  } else if (raw.timeStart && raw.timeEnd) {
    const s = Date.parse(raw.timeStart);
    const e = Date.parse(raw.timeEnd);
    if (!Number.isNaN(s) && !Number.isNaN(e) && e > s) {
      timeStart = raw.timeStart;
      timeEnd = raw.timeEnd;
    } else {
      warnings.push("Invalid time window from parsed input");
    }
  }

  const preferences = Array.isArray(raw.preferences) ? raw.preferences : [];

  const confidence = {
    overall: clampConfidence(raw.confidence?.overall ?? 0),
    category: clampConfidence(raw.confidence?.category ?? 0),
    needType: clampConfidence(raw.confidence?.needType ?? 0),
    budget: clampConfidence(raw.confidence?.budget ?? 0),
    distance: clampConfidence(raw.confidence?.distance ?? 0),
    time: clampConfidence(raw.confidence?.time ?? 0),
  };

  const result: NLParseResult = {
    category,
    needType,
    budgetMin,
    budgetMax,
    distanceKm,
    timeStart,
    timeEnd,
    preferences,
    locationHint: raw.locationHint ?? null,
    explanation: raw.explanation ?? "",
    confidence,
  };

  return { result, warnings };
}

export async function parseNaturalLanguage(query: string): Promise<NLParseState> {
  const trimmed = query.trim();
  if (!trimmed) return { status: "idle" };

  try {
    const res = await fetch(getParseEndpoint(), {
      method: "POST",
      headers: getParseHeaders(),
      body: JSON.stringify({
        query: trimmed,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return { status: "failed", error: data?.error ?? `Parse request failed (${res.status})` };
    }

    const { result, warnings } = validateAndClamp(data as RawParseResponse);

    if (result.confidence.overall >= CONFIDENCE_HIGH && warnings.length === 0) {
      return { status: "success", result };
    }
    if (result.confidence.overall >= CONFIDENCE_MEDIUM) {
      return { status: "partial", result, warnings };
    }
    return {
      status: "failed",
      error: warnings.length > 0
        ? `Couldn't fully understand your request: ${warnings.join("; ")}`
        : "Couldn't parse your request. Try being more specific, or use the form below.",
    };
  } catch (e) {
    return {
      status: "failed",
      error: e instanceof Error ? e.message : "Failed to connect to the parser",
    };
  }
}

export function isHighConfidence(state: NLParseState): boolean {
  return state.status === "success";
}

export function isPartialConfidence(state: NLParseState): boolean {
  return state.status === "partial";
}

export function canApplyToForm(state: NLParseState): boolean {
  return state.status === "success" || state.status === "partial";
}
