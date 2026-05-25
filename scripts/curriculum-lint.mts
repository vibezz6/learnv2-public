/**
 * Curriculum integrity lint — manifest counts, loads, and graph refs.
 * Run: npm run curriculum:lint
 */
import { manifest, loadSubjectResult } from "../src/curriculum/index.ts";

let errors = 0;

function fail(message: string): void {
  console.error(`✗ ${message}`);
  errors++;
}

function ok(message: string): void {
  console.log(`✓ ${message}`);
}

const loaded = await Promise.all(manifest.map((entry) => loadSubjectResult(entry.id)));
const globalNodeIds = new Set<string>();
for (const result of loaded) {
  if (result.status === "ok") {
    for (const node of result.subject.nodes) globalNodeIds.add(node.id);
  }
}

for (let i = 0; i < manifest.length; i++) {
  const entry = manifest[i]!;
  const result = loaded[i]!;
  if (result.status === "not_listed") {
    fail(`${entry.id}: not listed`);
    continue;
  }
  if (result.status === "missing_file") {
    fail(`${entry.id}: missing data file`);
    continue;
  }
  if (result.status !== "ok") {
    fail(`${entry.id}: load failed`);
    continue;
  }

  const { subject } = result;
  if (subject.nodes.length !== entry.nodeCount) {
    fail(
      `${entry.id}: manifest nodeCount ${entry.nodeCount} !== file ${subject.nodes.length}`,
    );
  }

  const seen = new Set<string>();
  for (const node of subject.nodes) {
    if (!node.id?.trim()) fail(`${entry.id}: node missing id`);
    if (!node.name?.trim()) fail(`${entry.id}: node ${node.id} missing name`);
    if (seen.has(node.id)) fail(`${entry.id}: duplicate node id ${node.id}`);
    seen.add(node.id);
    for (const parentId of node.parentIds ?? []) {
      if (!globalNodeIds.has(parentId)) {
        fail(`${entry.id}: node ${node.id} unknown parent ${parentId}`);
      }
    }
  }

  ok(`${entry.id} — ${subject.nodes.length} nodes`);
}

const total = manifest.reduce((n, m) => n + m.nodeCount, 0);
console.log(`\n${manifest.length} subjects, ${total} nodes`);

if (errors > 0) {
  console.error(`\n${errors} error(s)`);
  process.exit(1);
}

console.log("\nCurriculum lint passed.");
