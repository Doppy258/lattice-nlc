import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin, ViteDevServer } from "vite";
import { loadEnv } from "vite";
import { handleAssistantRequest, type AssistantEnv } from "../server/assistantHandler";
import { parsePingRequest } from "../server/pingParser";

function readAssistantEnv(mode: string): AssistantEnv {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    geminiApiKey: env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY,
    nvidiaApiKey: env.NVIDIA_API_KEY || env.VITE_NVIDIA_API_KEY,
    nvidiaModel: env.NVIDIA_MODEL || env.VITE_NVIDIA_MODEL,
  };
}

function installAssistantEnv(mode: string): AssistantEnv {
  const config = readAssistantEnv(mode);
  if (config.geminiApiKey) process.env.GEMINI_API_KEY = config.geminiApiKey;
  if (config.nvidiaApiKey) process.env.NVIDIA_API_KEY = config.nvidiaApiKey;
  if (config.nvidiaModel) process.env.NVIDIA_MODEL = config.nvidiaModel;
  return config;
}

async function handleParsePing(
  req: IncomingMessage,
  res: ServerResponse,
  env: AssistantEnv,
): Promise<void> {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end("Method not allowed");
    return;
  }

  let body = "";
  req.on("data", (chunk) => { body += chunk; });
  req.on("end", async () => {
    try {
      const { query, timezone } = JSON.parse(body) as { query: string; timezone?: string };
      const result = await parsePingRequest(query, { ...env, timezone });
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(result));
    } catch (e) {
      const message = e instanceof Error ? e.message : "Parse request failed";
      res.statusCode = 502;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: message }));
    }
  });
}

async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse,
  modeOrEnv: string | AssistantEnv,
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

      let env: AssistantEnv;
      if (typeof modeOrEnv === "string") {
        env = readAssistantEnv(modeOrEnv);
      } else {
        env = modeOrEnv;
      }

      const text = await handleAssistantRequest(payload, env);
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

function attachAssistantRoutes(server: ViteDevServer): void {
  const env = installAssistantEnv(server.config.mode);
  server.middlewares.use("/api/assistant", (req, res) => {
    void handleRequest(req, res, env);
  });
  server.middlewares.use("/api/parse-ping", (req, res) => {
    void handleParsePing(req, res, env);
  });
}

export function assistantProxy(): Plugin {
  return {
    name: "assistant-proxy",
    configureServer(server) {
      attachAssistantRoutes(server);
    },
    configurePreviewServer(server) {
      // @ts-expect-error: PreviewServer is not fully compatible with ViteDevServer, but the middleware API exists.
      attachAssistantRoutes(server);
    },
  };
}
