import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from "../_shared/cors.ts";

<<<<<<< HEAD
const GEMINI_MODELS = ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash"];
=======
const GEMINI_MODELS = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-2.0-flash-lite"];
>>>>>>> de7766ac840f51fe3477c146fca301d5b923dbc9
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";
const NVIDIA_ENDPOINT = "https://integrate.api.nvidia.com/v1/chat/completions";

type AssistantRequest = {
  question: string;
  systemPrompt: string;
};

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

async function handleAssistantRequest(request: AssistantRequest): Promise<string> {
  const { question, systemPrompt } = request;
  if (!question?.trim()) throw new AIError("Question is required");

  try {
    return await callGemini(question, systemPrompt);
  } catch (geminiErr) {
    try {
      return await callNvidia(question, systemPrompt);
    } catch (nvidiaErr) {
      throw new AIError(
        `All AI providers failed. Gemini: ${(geminiErr as Error).message}. NVIDIA: ${(nvidiaErr as Error).message}`,
      );
    }
  }
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
    const payload = (await req.json()) as AssistantRequest;
    const text = await handleAssistantRequest(payload);
    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Assistant request failed";
    return new Response(JSON.stringify({ error: message }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
