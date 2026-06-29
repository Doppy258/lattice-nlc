import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from "../_shared/cors.ts";

const GEMINI_MODELS = ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash"];
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";
const NVIDIA_ENDPOINT = "https://integrate.api.nvidia.com/v1/chat/completions";

class AIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIError";
  }
}

async function geminiGenerate(
  apiKey: string,
  model: string,
  prompt: string,
  systemPrompt: string,
): Promise<string> {
  const res = await fetch(`${GEMINI_BASE}/models/${model}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new AIError(`Gemini API error (${res.status}): ${body}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new AIError("Gemini returned empty response");
  return text;
}

async function callGemini(prompt: string, systemPrompt: string): Promise<string> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) throw new AIError("Gemini API key not configured");

  let lastErr: unknown;
  for (const model of GEMINI_MODELS) {
    try {
      return await geminiGenerate(apiKey, model, prompt, systemPrompt);
    } catch (e) {
      lastErr = e;
      if (e instanceof AIError && e.message.includes("(404)")) continue;
    }
  }
  throw lastErr;
}

async function callNvidia(prompt: string, systemPrompt: string): Promise<string> {
  const apiKey = Deno.env.get("NVIDIA_API_KEY");
  const model = Deno.env.get("NVIDIA_MODEL");
  if (!apiKey) throw new AIError("NVIDIA API key not configured");
  if (!model) throw new AIError("NVIDIA model not configured");

  const res = await fetch(NVIDIA_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new AIError(`NVIDIA API error (${res.status}): ${body}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new AIError("NVIDIA returned empty response");
  return text;
}

async function callAI(prompt: string, systemPrompt: string): Promise<string> {
  try {
    return await callGemini(prompt, systemPrompt);
  } catch (geminiErr) {
    try {
      return await callNvidia(prompt, systemPrompt);
    } catch (nvidiaErr) {
      throw new AIError(
        `All AI providers failed. Gemini: ${(geminiErr as Error).message}. NVIDIA: ${(nvidiaErr as Error).message}`,
      );
    }
  }
}

function buildParseSystemPrompt(): string {
  const now = new Date();
  return `You are a precise structured-data extractor. Your ONLY job is to parse a user's natural language request for local services into structured fields.

Today's date and time (for computing relative time references like "around 2pm", "tonight", "this weekend"): ${now.toISOString()}

Return ONLY a valid JSON object with NO markdown formatting, NO backticks, NO extra text. The JSON must have exactly these fields:

{
  "category": string | null,
  "needType": string | null,
  "budgetMax": number | null,
  "budgetMin": number | null,
  "distanceKm": number | null,
  "timeStart": string | null (ISO datetime),
  "timeEnd": string | null (ISO datetime),
  "preferences": string[],
  "locationHint": string | null,
  "explanation": string (brief human-readable summary of what was parsed),
  "confidence": {
    "overall": number (0-1),
    "category": number (0-1),
    "needType": number (0-1),
    "budget": number (0-1),
    "distance": number (0-1),
    "time": number (0-1)
  }
}

VALID category values: "food", "retail", "services", "fitness", "education", "repair", "entertainment"

VALID needType values (category → valid needTypes):
- food: "lunch", "cafeStudySpot", "dessert", "dinner", "groupMeal", "quickSnack"
- retail: "gift", "clothing", "books", "thrift", "schoolSupplies", "homeItem"
- services: "haircut", "salonService", "printing", "alterations", "tutoring", "cleaning"
- fitness: "gymTrial", "dropInClass", "sportsFacility", "personalTraining"
- education: "tutoring", "testPrep", "workshop", "studySpace"
- repair: "phoneRepair", "laptopRepair", "bikeRepair", "clothingRepair"
- entertainment: "escapeRoom", "arcade", "movieActivity", "localEvent", "groupHangout"

VALID preference values: "studentDiscount", "openNow", "highlyRated", "verifiedOnly", "groupFriendly", "wheelchairAccessible", "quiet", "vegetarian", "fastService", "under30"

RULES:
1. Infer the category from the need. E.g., "tacos" → food/lunch, "haircut" → services/haircut, "phone repair" → repair/phoneRepair
2. For budget: "cheap", "affordable", "budget-friendly" → low budgetMax
3. For distance: "near", "nearby", "close" → 5km. "walking distance" → 3km. "downtown" → 10km. Specific location references are extracted as locationHint but also set a sensible distanceKm.
4. For time: "now" → set timeStart/timeEnd to a 2-hour window starting now. "around 2pm" → 2pm-3pm today. "tonight" → 6pm-9pm today. "this weekend" → this Saturday.
5. Set confidence LOW (0.1-0.3) when no information was given for a field.
6. Set confidence HIGH (0.8-1.0) when the user explicitly states a value.
7. Set confidence MEDIUM (0.4-0.7) when values are inferred implicitly.
8. overall confidence should reflect how many fields were confidently extracted.
9. Use null (not string "null") for missing values.
10. If you cannot determine a field at all, set it to null with confidence 0.`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { query } = (await req.json()) as { query: string };
    if (!query?.trim()) {
      return new Response(JSON.stringify({ error: "Query is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = buildParseSystemPrompt();
    const raw = await callAI(query, systemPrompt);
    const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(cleaned);

    if (!parsed.confidence || typeof parsed.confidence.overall !== "number") {
      parsed.confidence = {
        overall: 0,
        category: 0,
        needType: 0,
        budget: 0,
        distance: 0,
        time: 0,
      };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Parse request failed";
    return new Response(JSON.stringify({ error: message }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
