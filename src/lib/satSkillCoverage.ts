import type { Subject } from "../curriculum/types";
import {
  getPicklistSkills,
  getNodeSkillId,
  SAT_NODE_SKILLS,
  SAT_SKILLS,
  type SatSkillId,
  type SatSection,
} from "./satSkills";

/** Count MC questions per skill (same rules as satSkillMastery). */
export function countSatQuestionsBySkill(subjects: Subject[]): Map<SatSkillId, number> {
  const counts = new Map<SatSkillId, number>();
  const sat = subjects.find((s) => s.id === "sat-prep");
  if (!sat) return counts;
  for (const node of sat.nodes) {
    const skillId = getNodeSkillId(node.id);
    if (!skillId) continue;
    let n = 0;
    for (const q of node.quiz ?? []) {
      if ((q.type ?? "multiple-choice") === "multiple-choice" && q.options.length >= 2) n++;
    }
    if (n > 0) counts.set(skillId, (counts.get(skillId) ?? 0) + n);
  }
  return counts;
}

export const SAT_COVERAGE_TARGET = 5;
export const SAT_COVERAGE_STRETCH_TARGET = 8;

export interface SatSkillCoverageRow {
  skillId: SatSkillId;
  label: string;
  section: SatSection;
  domain: string;
  count: number;
  nodeIds: string[];
  deficit: number;
}

/** Picklist content skills (math + rw, excludes mixed/strategy buckets). */
export function getContentPicklistSkillIds(): SatSkillId[] {
  const math = getPicklistSkills("math").map((s) => s.id);
  const rw = getPicklistSkills("rw").map((s) => s.id);
  return [...math, ...rw];
}

export function nodesBySkill(subject: Subject): Map<SatSkillId, string[]> {
  const bySkill = new Map<SatSkillId, string[]>();
  for (const node of subject.nodes) {
    const skillId = getNodeSkillId(node.id);
    if (!skillId) continue;
    const list = bySkill.get(skillId) ?? [];
    list.push(node.id);
    bySkill.set(skillId, list);
  }
  return bySkill;
}

export function buildSatSkillCoverageReport(
  subject: Subject,
  target: number = SAT_COVERAGE_TARGET,
): SatSkillCoverageRow[] {
  const counts = countSatQuestionsBySkill([subject]);
  const nodeMap = nodesBySkill(subject);
  const picklist = new Set(getContentPicklistSkillIds());

  return [...picklist]
    .map((skillId) => {
      const meta = SAT_SKILLS[skillId];
      const count = counts.get(skillId) ?? 0;
      return {
        skillId,
        label: meta.label,
        section: meta.section,
        domain: meta.domain,
        count,
        nodeIds: nodeMap.get(skillId) ?? [],
        deficit: Math.max(0, target - count),
      };
    })
    .sort((a, b) => a.count - b.count || a.label.localeCompare(b.label));
}

export function getCoverageFailures(
  rows: SatSkillCoverageRow[],
  target: number = SAT_COVERAGE_TARGET,
): SatSkillCoverageRow[] {
  return rows.filter((r) => r.count < target);
}

/** Gap drill nodes st76–st80 MC counts. */
export function gapDrillMcCounts(subject: Subject): Array<{ nodeId: string; count: number }> {
  const gapIds = ["st76", "st77", "st78", "st79", "st80"];
  return gapIds.map((nodeId) => {
    const node = subject.nodes.find((n) => n.id === nodeId);
    let count = 0;
    for (const q of node?.quiz ?? []) {
      if ((q.type ?? "multiple-choice") === "multiple-choice" && (q.options?.length ?? 0) >= 2) {
        count++;
      }
    }
    return { nodeId, count };
  });
}

export function formatCoverageTable(rows: SatSkillCoverageRow[]): string {
  const lines = ["skillId | count | deficit | nodes", "--- | --- | --- | ---"];
  for (const r of rows) {
    lines.push(`${r.skillId} | ${r.count} | ${r.deficit} | ${r.nodeIds.join(", ") || "—"}`);
  }
  return lines.join("\n");
}

/** Validate every st1–st80 node has a skill mapping. */
export function unmappedSatNodes(subject: Subject): string[] {
  return subject.nodes
    .filter((n) => /^st\d+$/.test(n.id) && !SAT_NODE_SKILLS[n.id])
    .map((n) => n.id);
}
