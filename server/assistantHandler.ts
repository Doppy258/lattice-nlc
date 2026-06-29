/**
 * Server-side AI handler for the Lattice Assistant.
 * Proxies Gemini and NVIDIA NIM calls so API keys stay off the client and
 * browser CORS restrictions do not block the NVIDIA fallback.
 */

export type AssistantRequest = {
  question: string;
  systemPrompt: string;
};

<<<<<<< HEAD
const GEMINI_MODELS = ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash"];
=======
const GEMINI_MODELS = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-2.0-flash-lite"];
>>>>>>> de7766ac840f51fe3477c146fca301d5b923dbc9
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";
const NVIDIA_ENDPOINT = "https://integrate.api.nvidia.com/v1/chat/completions";

export class AIError extends Error {
  constructor(message: string, public provider?: string) {
    super(message);
    this.name = "AIError";
  }
}

type Env = {
  geminiApiKey?: string;
  nvidiaApiKey?: string;
  nvidiaModel?: string;
};

<<<<<<< HEAD
export type AssistantEnv = Env;

=======
>>>>>>> de7766ac840f51fe3477c146fca301d5b923dbc9
function readEnv(env: Env = {}): Required<Env> | Env {
  return {
    geminiApiKey:
      env.geminiApiKey ?? process.env.GEMINI_API_KEY ?? process.env.VITE_GEMINI_API_KEY,
    nvidiaApiKey:
      env.nvidiaApiKey ?? process.env.NVIDIA_API_KEY ?? process.env.VITE_NVIDIA_API_KEY,
    nvidiaModel:
      env.nvidiaModel ?? process.env.NVIDIA_MODEL ?? process.env.VITE_NVIDIA_MODEL,
  };
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
    throw new AIError(`Gemini API error (${res.status}): ${body}`, "gemini");
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new AIError("Gemini returned empty response", "gemini");
  return text;
}

async function callGemini(prompt: string, systemPrompt: string, env: Env): Promise<string> {
  const { geminiApiKey } = readEnv(env);
  if (!geminiApiKey) throw new AIError("Gemini API key not configured", "gemini");

  let lastErr: unknown;
  for (const model of GEMINI_MODELS) {
    try {
      return await geminiGenerate(geminiApiKey, model, prompt, systemPrompt);
    } catch (e) {
      lastErr = e;
      if (e instanceof AIError && e.message.includes("(404)")) continue;
    }
  }
  throw lastErr;
}

async function callNvidia(prompt: string, systemPrompt: string, env: Env): Promise<string> {
  const { nvidiaApiKey, nvidiaModel } = readEnv(env);
  if (!nvidiaApiKey) throw new AIError("NVIDIA API key not configured", "nvidia");
  if (!nvidiaModel) throw new AIError("NVIDIA model not configured", "nvidia");

  const res = await fetch(NVIDIA_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${nvidiaApiKey}`,
    },
    body: JSON.stringify({
      model: nvidiaModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new AIError(`NVIDIA API error (${res.status}): ${body}`, "nvidia");
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new AIError("NVIDIA returned empty response", "nvidia");
  return text;
}

export async function handleAssistantRequest(
  request: AssistantRequest,
  env: Env = {},
): Promise<string> {
  const { question, systemPrompt } = request;
  if (!question?.trim()) throw new AIError("Question is required");

  try {
    return await callGemini(question, systemPrompt, env);
  } catch (geminiErr) {
    try {
      return await callNvidia(question, systemPrompt, env);
    } catch (nvidiaErr) {
      throw new AIError(
        `All AI providers failed. Gemini: ${(geminiErr as Error).message}. NVIDIA: ${(nvidiaErr as Error).message}`,
      );
    }
  }
}
