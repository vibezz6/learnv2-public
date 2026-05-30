import type { Subject } from "@/curriculum/types";
import { getEntrySkillId, listMistakes } from "@/lib/satMistakeLog";
import { getDrillSchedule } from "@/lib/satDrillSchedule";
import { getLatestCompletedSatPretestAttempt } from "@/lib/satPretest";
import { SAT_PRETEST_DRAFT_1_ID } from "@/data/satPretestDraft1";
import {
  getNodeSkillId,
  resolveSkillId,
  SAT_SKILLS,
  type SatSection,
  type SatSkillId,
} from "@/lib/satSkills";

export interface SatSkillMasteryRow {
  skillId: SatSkillId;
  label: string;
  section: SatSection;
  domain: string;
  mistakeCount: number;
  diagnostic: { correct: number; total: number; pct: number } | null;
  drill: { due: boolean; lastDrilledAt: number | null } | null;
  questionCount: number;
  /** Higher = weaker / more urgent. 0 means no signal yet. */
  weaknessScore: number;
  hasSignal: boolean;
}

/** Count multiple-choice questions available per skill (questions inherit their node's skill). */
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

/** Total logged mistakes per canonical skill (resolving legacy free-text categories). */
export function getMistakeCountsBySkill(storage: Storage = localStorage): Map<SatSkillId, number> {
  const counts = new Map<SatSkillId, number>();
  for (const entry of listMistakes(storage)) {
    const skillId = getEntrySkillId(entry);
    if (!skillId) continue;
    counts.set(skillId, (counts.get(skillId) ?? 0) + 1);
  }
  return counts;
}

/**
 * Per-skill mastery, merging four signals (mistakes, Draft 1 diagnostic, drill
 * recency, question coverage) into one list sorted weakest-first. Strategy/mixed
 * and general buckets are excluded — this is the "what do I attack" content view.
 */
export function getSatSkillMastery(
  subjects: Subject[],
  storage: Storage = localStorage,
  now: number = Date.now(),
): SatSkillMasteryRow[] {
  const mistakeCounts = getMistakeCountsBySkill(storage);
  const questionCounts = countSatQuestionsBySkill(subjects);

  const diagnosticBySkill = new Map<SatSkillId, { correct: number; total: number; pct: number }>();
  const attempt = getLatestCompletedSatPretestAttempt(SAT_PRETEST_DRAFT_1_ID, storage);
  for (const row of attempt?.scoreSummary?.skillBreakdown ?? []) {
    const skillId = resolveSkillId(row.label);
    if (!skillId) continue;
    const existing = diagnosticBySkill.get(skillId);
    if (existing) {
      const correct = existing.correct + row.correct;
      const total = existing.total + row.total;
      diagnosticBySkill.set(skillId, {
        correct,
        total,
        pct: total ? Math.round((correct / total) * 100) : 0,
      });
    } else {
      diagnosticBySkill.set(skillId, { correct: row.correct, total: row.total, pct: row.pct });
    }
  }

  const drillBySkill = new Map<SatSkillId, { due: boolean; lastDrilledAt: number | null }>();
  for (const entry of getDrillSchedule(storage, now)) {
    if (entry.skillId) drillBySkill.set(entry.skillId, { due: entry.due, lastDrilledAt: entry.lastDrilledAt });
  }

  const rows: SatSkillMasteryRow[] = [];
  for (const id of Object.keys(SAT_SKILLS) as SatSkillId[]) {
    const meta = SAT_SKILLS[id];
    if (meta.section === "general" || meta.domain === "Mixed") continue;

    const mistakeCount = mistakeCounts.get(id) ?? 0;
    const diagnostic = diagnosticBySkill.get(id) ?? null;
    const drill = drillBySkill.get(id) ?? null;
    const questionCount = questionCounts.get(id) ?? 0;
    const weaknessScore =
      mistakeCount * 2 + (diagnostic ? 100 - diagnostic.pct : 0) + (drill?.due ? 10 : 0);

    rows.push({
      skillId: id,
      label: meta.label,
      section: meta.section,
      domain: meta.domain,
      mistakeCount,
      diagnostic,
      drill,
      questionCount,
      weaknessScore,
      hasSignal: mistakeCount > 0 || diagnostic != null || drill != null,
    });
  }

  rows.sort(
    (a, b) =>
      b.weaknessScore - a.weaknessScore ||
      a.questionCount - b.questionCount ||
      a.label.localeCompare(b.label),
  );
  return rows;
}
