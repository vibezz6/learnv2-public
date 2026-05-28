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

function wordCount(value: string | undefined): number {
  return value?.trim().split(/\s+/).filter(Boolean).length ?? 0;
}

const LEGACY_DUPLICATE_QUIZ_IDS = new Set(["science:q805", "ai:q531", "finance:q161"]);

function isSatLightDrill(subjectId: string, nodeId: string): boolean {
  return subjectId === "sat-prep" && /^st(7[6-9]|80)$/.test(nodeId);
}

function hasValidResourceUrl(url: string): boolean {
  return url.startsWith("/") || /^https?:\/\//.test(url);
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
  const quizIds = new Set<string>();
  for (const node of subject.nodes) {
    if (!node.id?.trim()) fail(`${entry.id}: node missing id`);
    if (!node.name?.trim()) fail(`${entry.id}: node ${node.id} missing name`);
    if (wordCount(node.description) < 5) fail(`${entry.id}: node ${node.id} description too short`);
    if (wordCount(node.whyItMatters) < 5) fail(`${entry.id}: node ${node.id} whyItMatters too short`);
    if ((node.keyConcepts ?? []).filter((item) => item.trim().length >= 4).length < 2) {
      fail(`${entry.id}: node ${node.id} needs at least 2 concrete keyConcepts`);
    }
    if ((node.practiceProblems ?? []).filter((item) => item.trim().length >= 8).length < 1) {
      fail(`${entry.id}: node ${node.id} needs at least 1 concrete practice problem`);
    }
    if (!isSatLightDrill(entry.id, node.id) && entry.id !== "sat-prep") {
      if ((node.workedExamples ?? []).length < 1) {
        fail(`${entry.id}: node ${node.id} needs a worked example`);
      }
    }
    if (seen.has(node.id)) fail(`${entry.id}: duplicate node id ${node.id}`);
    seen.add(node.id);
    for (const parentId of node.parentIds ?? []) {
      if (!globalNodeIds.has(parentId)) {
        fail(`${entry.id}: node ${node.id} unknown parent ${parentId}`);
      }
    }
    for (const resource of node.resources ?? []) {
      if (!resource.title?.trim()) fail(`${entry.id}: node ${node.id} resource missing title`);
      if (!hasValidResourceUrl(resource.url)) {
        fail(`${entry.id}: node ${node.id} resource ${resource.title} has invalid url ${resource.url}`);
      }
      if (/example\.com|placeholder|todo/i.test(resource.url)) {
        fail(`${entry.id}: node ${node.id} resource ${resource.title} uses placeholder url`);
      }
    }
    for (const quiz of node.quiz ?? []) {
      if (!quiz.id?.trim()) fail(`${entry.id}: node ${node.id} quiz missing id`);
      if (quizIds.has(quiz.id) && !LEGACY_DUPLICATE_QUIZ_IDS.has(`${entry.id}:${quiz.id}`)) {
        fail(`${entry.id}: duplicate quiz id ${quiz.id}`);
      }
      quizIds.add(quiz.id);
      if (!Array.isArray(quiz.options) || quiz.options.length < 2) {
        fail(`${entry.id}: quiz ${quiz.id} needs at least 2 options`);
      }
      if (
        typeof quiz.correctIndex !== "number" ||
        quiz.correctIndex < 0 ||
        quiz.correctIndex >= (quiz.options?.length ?? 0)
      ) {
        fail(`${entry.id}: quiz ${quiz.id} correctIndex out of range`);
      }
      if (wordCount(quiz.explanation) < 3) {
        fail(`${entry.id}: quiz ${quiz.id} explanation too short`);
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
