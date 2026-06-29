import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin, ViteDevServer } from "vite";
import { loadEnv } from "vite";
<<<<<<< HEAD
import { handleAssistantRequest, type AssistantEnv } from "../server/assistantHandler";
import { parsePingRequest } from "../server/pingParser";

function readAssistantEnv(mode: string): AssistantEnv {
=======
import { handleAssistantRequest } from "../server/assistantHandler";

function readAssistantEnv(mode: string): Record<string, string | undefined> {
>>>>>>> de7766ac840f51fe3477c146fca301d5b923dbc9
  const env = loadEnv(mode, process.cwd(), "");
  return {
    geminiApiKey: env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY,
    nvidiaApiKey: env.NVIDIA_API_KEY || env.VITE_NVIDIA_API_KEY,
    nvidiaModel: env.NVIDIA_MODEL || env.VITE_NVIDIA_MODEL,
  };
}

<<<<<<< HEAD
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
  env: AssistantEnv,
=======
async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse,
  mode: string,
>>>>>>> de7766ac840f51fe3477c146fca301d5b923dbc9
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
<<<<<<< HEAD
      const text = await handleAssistantRequest(payload, env);
=======
      const text = await handleAssistantRequest(payload, readAssistantEnv(mode));
>>>>>>> de7766ac840f51fe3477c146fca301d5b923dbc9
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

<<<<<<< HEAD
function attachAssistantRoutes(server: ViteDevServer): void {
  const env = installAssistantEnv(server.config.mode);
  server.middlewares.use("/api/assistant", (req, res) => {
    void handleRequest(req, res, env);
  });
  server.middlewares.use("/api/parse-ping", (req, res) => {
    void handleParsePing(req, res, env);
=======
function attachAssistantRoute(server: ViteDevServer): void {
  const mode = server.config.mode;
  server.middlewares.use("/api/assistant", (req, res) => {
    void handleRequest(req, res, mode);
>>>>>>> de7766ac840f51fe3477c146fca301d5b923dbc9
  });
}

export function assistantProxy(): Plugin {
  return {
    name: "assistant-proxy",
    configureServer(server) {
<<<<<<< HEAD
      attachAssistantRoutes(server);
    },
    configurePreviewServer(server) {
      attachAssistantRoutes(server);
=======
      attachAssistantRoute(server);
>>>>>>> de7766ac840f51fe3477c146fca301d5b923dbc9
    },
  };
}
