/**
 * One-off merge: append stretch MC to sat-prep.json nodes (B50).
 * Run: npx tsx scripts/merge-sat-stretch.mts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { SAT_NODE_SKILLS, type SatSkillId } from "../src/lib/satSkills.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const prepPath = join(root, "src/curriculum/data/sat-prep.json");
const additionsPath = join(root, "src/curriculum/data/sat-stretch-additions.json");

type QuizQ = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

const prep = JSON.parse(readFileSync(prepPath, "utf8")) as {
  nodes: Array<{ id: string; quiz?: QuizQ[] }>;
};
const additions = JSON.parse(readFileSync(additionsPath, "utf8")) as Record<SatSkillId, QuizQ[]>;

const nodesBySkill = new Map<SatSkillId, string[]>();
for (const node of prep.nodes) {
  const skill = SAT_NODE_SKILLS[node.id];
  if (!skill) continue;
  const list = nodesBySkill.get(skill) ?? [];
  list.push(node.id);
  nodesBySkill.set(skill, list);
}

let added = 0;
for (const [skillId, questions] of Object.entries(additions) as [SatSkillId, QuizQ[]][]) {
  const nodeIds = nodesBySkill.get(skillId);
  if (!nodeIds?.length) {
    console.warn("No node for skill", skillId);
    continue;
  }
  const node = prep.nodes.find((n) => n.id === nodeIds[0]);
  if (!node) continue;
  node.quiz ??= [];
  const existingIds = new Set(node.quiz.map((q) => q.id));
  for (const q of questions) {
    if (existingIds.has(q.id)) continue;
    node.quiz.push(q);
    existingIds.add(q.id);
    added++;
  }
}

writeFileSync(prepPath, `${JSON.stringify(prep, null, 2)}\n`);
console.log(`Merged ${added} stretch questions into sat-prep.json`);
