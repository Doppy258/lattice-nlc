import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin, ViteDevServer } from "vite";
import { loadEnv } from "vite";
import { handleAssistantRequest } from "../server/assistantHandler";

function readAssistantEnv(mode: string): Record<string, string | undefined> {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    geminiApiKey: env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY,
    nvidiaApiKey: env.NVIDIA_API_KEY || env.VITE_NVIDIA_API_KEY,
    nvidiaModel: env.NVIDIA_MODEL || env.VITE_NVIDIA_MODEL,
  };
}

async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse,
  mode: string,
): Promise<void> {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end("Method not allowed");
    return;
  }

  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
  });
  req.on("end", async () => {
    try {
      const payload = JSON.parse(body) as { question: string; systemPrompt: string };
      const text = await handleAssistantRequest(payload, readAssistantEnv(mode));
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ text }));
    } catch (e) {
      const message = e instanceof Error ? e.message : "Assistant request failed";
      res.statusCode = 502;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: message }));
    }
  });
}

function attachAssistantRoute(server: ViteDevServer): void {
  const mode = server.config.mode;
  server.middlewares.use("/api/assistant", (req, res) => {
    void handleRequest(req, res, mode);
  });
}

export function assistantProxy(): Plugin {
  return {
    name: "assistant-proxy",
    configureServer(server) {
      attachAssistantRoute(server);
    },
  };
}
