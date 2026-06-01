#!/usr/bin/env node
/**
 * Prints a one-liner to paste in the browser console on http://127.0.0.1:8080
 * after loading Settings — uses OPENROUTER_API_KEY from .env.local.
 * Does not print the key to stdout.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(import.meta.dirname, "..", ".env.local");
if (!existsSync(envPath)) {
  console.error("Missing .env.local with OPENROUTER_API_KEY");
  process.exit(1);
}

let apiKey = "";
for (const line of readFileSync(envPath, "utf8").split("\n")) {
  const m = line.match(/^OPENROUTER_API_KEY=(.+)$/);
  if (m) apiKey = m[1].trim().replace(/^["']|["']$/g, "");
}

if (!apiKey) {
  console.error("OPENROUTER_API_KEY not set in .env.local");
  process.exit(1);
}

console.log("Open Learn v2 → Settings, then paste this in the browser devtools console:\n");
console.log(
  `localStorage.setItem("learnv2_openrouter_key", ${JSON.stringify(apiKey)}); location.reload();`,
);
