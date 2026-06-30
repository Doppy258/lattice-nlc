import { handleAssistantRequest, type AssistantEnv } from "./assistantHandler";

export type ParsedPingFields = {
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

function buildParseSystemPrompt(timezone?: string): string {
  const now = new Date();
  const localDesc = timezone
    ? `Today is ${now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: timezone })}. The current local time is ${now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: timezone })} (${timezone}).`
    : `Today's date and time in UTC: ${now.toISOString()}`;
  return `You are a precise structured-data extractor. Your ONLY job is to parse a user's natural language request for local services into structured fields.

ABSOLUTE REQUIREMENT: category and needType must ALWAYS be non-null strings — infer them from context. For EVERY other field (budgetMax, budgetMin, distanceKm, timeStart, timeEnd), if the user did not clearly mention it, DEFAULT TO THE MOST PERMISSIVE / LEAST RESTRICTIVE value, which is null. null means "no preference": no maximum price, no distance limit, any time. Do NOT invent a specific number for a field the user never mentioned — only output a concrete value when the user actually states or strongly implies one, and lower the confidence when it was implied rather than stated.

${localDesc}

IMPORTANT TIMEZONE RULE: Output timeStart and timeEnd as ISO strings in the user's LOCAL timezone (e.g., "2026-06-29T17:00:00" for 5pm local time — no Z suffix, no timezone offset). The client will interpret them as local times.

Return ONLY a valid JSON object with NO markdown formatting, NO backticks, NO extra text. The JSON must have exactly these fields:

{
  "category": string,
  "needType": string,
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

RULES — Follow these EXACTLY:

1. CATEGORY: Always output a valid category. Infer it from context. E.g., "tacos" → "food", "haircut" → "services", "phone repair" → "repair", "gym" → "fitness".

2. NEEDTYPE: Always output a valid needType that belongs to the chosen category. Infer from context. E.g., "tacos" → "lunch", "coffee" → "cafeStudySpot", "haircut" → "haircut".

3. BUDGET: If the user mentions a price ("cheap", "under $10", "affordable", etc.), use that as budgetMax. If the user explicitly opts out ("no budget", "any price", "doesn't matter") OR does not mention budget at all, set BOTH budgetMax and budgetMin to null — meaning no maximum price. Set confidence low when budget was not mentioned.

4. DISTANCE: "near", "nearby", "close", "near me" → 5. "walking distance" → 3. "downtown" + city → 10. If the user explicitly opts out ("anywhere", "any distance", "no limit", "doesn't matter") OR does not mention distance at all, set distanceKm to null — meaning no distance limit. Set confidence low when distance was not mentioned.

5. TIME: If the user explicitly says "anytime", "whenever", "no preference" about time, set BOTH timeStart AND timeEnd to null. Otherwise:
   - "now" or "asap" → start now, end 2 hours later
   - "around 2pm", "at 2pm" → 2pm today, 3pm today (1 hour window)
   - "tonight" → 6pm today, 9pm today
   - "this weekend" → 10am this coming Saturday, 6pm this coming Saturday
   - "tomorrow" → 10am tomorrow, 8pm tomorrow
   - "morning", "breakfast" → 8am today, 12pm today
   - "afternoon", "lunch" → 12pm today, 5pm today
   - "evening", "dinner" → 5pm today, 9pm today
   - If NO time reference is given at all, set BOTH timeStart AND timeEnd to null — meaning anytime — and set confidence low.
   - IMPORTANT: The ISO datetime values in the JSON (timeStart, timeEnd) MUST exactly match the times described in the explanation field. If the explanation says "6 PM to 9 PM" then timeStart must be today at 6pm ISO and timeEnd must be today at 9pm ISO. Never contradict yourself.

6. PREFERENCES: Extract any mentioned preferences. Default to empty array [].

7. LOCATIONHINT: Extract any location reference (neighborhood, landmark, street). Null if none.

8. CONFIDENCE SCORING:
   - HIGH (0.8-1.0): User explicitly stated the value.
   - MEDIUM (0.4-0.7): Value was strongly implied by context.
   - LOW (0.1-0.3): Value was not mentioned, you used a default.
   - If a field is null because the user explicitly opted out ("no budget", "anytime"), set confidence to 1.0 for that field (the parse was perfectly accurate).
   - overall should be the average of all field confidences.

9. EXPLANATION: Write 1 short sentence summarizing what you understood and noting any defaults used (e.g., "I assumed a 10km radius and a 2-hour window starting now since none were specified.").`;
}

export async function parsePingRequest(query: string, env: AssistantEnv & { timezone?: string } = {}): Promise<ParsedPingFields> {
  const systemPrompt = buildParseSystemPrompt(env.timezone);
  const raw = await handleAssistantRequest({ question: query, systemPrompt }, env);
  const cleaned = raw
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  const parsed = JSON.parse(cleaned) as ParsedPingFields;

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

  return parsed;
}
