/**
 * One-time generator: splits Learn-v1 curriculums.ts into per-subject JSON.
 * Run: npm run curriculum:split
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "..");
const v1Curriculum = path.resolve(root, "../Learn-v1/src/data/curriculums.ts");
const outDir = path.resolve(root, "src/curriculum/data");

const mod = await import(pathToFileURL(v1Curriculum).href);
const subjects = mod.subjects as Array<{
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  nodes: unknown[];
}>;

mkdirSync(outDir, { recursive: true });

const manifest = subjects.map((s) => ({
  id: s.id,
  name: s.name,
  description: s.description,
  color: s.color,
  icon: s.icon,
  nodeCount: s.nodes.length,
}));

writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));

for (const subject of subjects) {
  writeFileSync(
    path.join(outDir, `${subject.id}.json`),
    JSON.stringify(subject),
  );
  console.log(`✓ ${subject.id}: ${subject.nodes.length} nodes`);
}

console.log(`\nWrote ${subjects.length} subjects to src/curriculum/data/`);
