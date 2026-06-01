#!/usr/bin/env node
/**
 * Smoke-test OpenRouter with the same model defaults as llmReview.ts.
 * Usage: OPENROUTER_API_KEY=sk-or-... npm run openrouter:check
 * Or: put OPENROUTER_API_KEY in .env.local (gitignored).
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const DEFAULT_MODEL = "openai/gpt-oss-20b:free";

function loadEnvLocal() {
  const path = resolve(ROOT, ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (key && !process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const apiKey = process.env.OPENROUTER_API_KEY?.trim();
if (!apiKey) {
  console.error("Missing OPENROUTER_API_KEY. Set env var or add to .env.local.");
  process.exit(1);
}

const model = process.env.OPENROUTER_MODEL?.trim() || DEFAULT_MODEL;

const body = {
  model,
  messages: [
    {
      role: "system",
      content:
        "Reply with JSON only: {\"ok\":true,\"message\":\"Learn v2 OpenRouter check\"}",
    },
    { role: "user", content: "Ping" },
  ],
  max_tokens: 64,
  temperature: 0,
  response_format: { type: "json_object" },
};

const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    "HTTP-Referer": "https://learnv2.app",
    "X-Title": "Learn v2 OpenRouter Check",
  },
  body: JSON.stringify(body),
});

const text = await res.text();
if (!res.ok) {
  console.error(`OpenRouter HTTP ${res.status}: ${text.slice(0, 500)}`);
  process.exit(1);
}

let parsed;
try {
  parsed = JSON.parse(text);
} catch {
  console.error("Invalid JSON from OpenRouter:", text.slice(0, 300));
  process.exit(1);
}

const content = parsed.choices?.[0]?.message?.content;
console.log("OpenRouter OK");
console.log("Model:", model);
console.log("Sample:", String(content).slice(0, 200));
