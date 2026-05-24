#!/usr/bin/env node
/**
 * Bump Learn v2 app version.
 * Scheme: 2.0.1 … 2.0.99 → 2.1.0 … 2.1.99 → 2.2.0
 *
 * Usage: node scripts/bump-version.mjs [patch|minor|set 2.0.5]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const versionTs = path.join(root, "src/lib/version.ts");
const packageJson = path.join(root, "package.json");
const serviceWorker = path.join(root, "public/sw.js");

function readVersion() {
  const src = fs.readFileSync(versionTs, "utf8");
  const m = src.match(/export const APP_VERSION = "(\d+\.\d+\.\d+)"/);
  if (!m) throw new Error("Could not parse APP_VERSION from src/lib/version.ts");
  return m[1];
}

function writeVersion(next) {
  let src = fs.readFileSync(versionTs, "utf8");
  src = src.replace(/export const APP_VERSION = "\d+\.\d+\.\d+"/, `export const APP_VERSION = "${next}"`);
  fs.writeFileSync(versionTs, src);

  const pkg = JSON.parse(fs.readFileSync(packageJson, "utf8"));
  pkg.version = next;
  fs.writeFileSync(packageJson, JSON.stringify(pkg, null, 2) + "\n");

  if (fs.existsSync(serviceWorker)) {
    let sw = fs.readFileSync(serviceWorker, "utf8");
    sw = sw.replace(
      /const CACHE_NAME = "learnv2-v[\d.]+";/,
      `const CACHE_NAME = "learnv2-v${next}";`,
    );
    fs.writeFileSync(serviceWorker, sw);
  }
}

function bumpPatch(v) {
  const [major, minor, patch] = v.split(".").map(Number);
  if (patch >= 99) return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

function bumpMinor(v) {
  const [major, minor] = v.split(".").map(Number);
  return `${major}.${minor + 1}.0`;
}

const current = readVersion();
const mode = process.argv[2] ?? "patch";
let next;

if (mode === "patch") next = bumpPatch(current);
else if (mode === "minor") next = bumpMinor(current);
else if (mode === "set") next = process.argv[3];
else throw new Error(`Unknown mode: ${mode}. Use patch | minor | set X.Y.Z`);

if (!/^\d+\.\d+\.\d+$/.test(next)) throw new Error(`Invalid version: ${next}`);

writeVersion(next);
console.log(`${current} → ${next}`);
