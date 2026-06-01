import type { Subject } from "@/curriculum/types";
import { getEntrySkillId, listMistakes } from "@/lib/satMistakeLog";
import { getDrillSchedule } from "@/lib/satDrillSchedule";
import {
  getLatestCompletedSatPretestAttempt,
  type SatPretestAttempt,
} from "@/lib/satPretest";
import { SAT_PRETEST_DRAFT_1_ID } from "@/data/satPretestDraft1";
import { SAT_PRETEST_DRAFT_3_ID } from "@/data/satPretestDrafts";
import {
  getNodeSkillId,
  resolveSkillId,
  SAT_SKILLS,
  type SatSection,
  type SatSkillId,
} from "@/lib/satSkills";

export type SatDiagnosticSource = "baseline" | "retest";

export interface SatSkillMasteryRow {
  skillId: SatSkillId;
  label: string;
  section: SatSection;
  domain: string;
  mistakeCount: number;
  diagnostic: { correct: number; total: number; pct: number } | null;
  diagnosticSource: SatDiagnosticSource | null;
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

function getDiagnosticBySkillFromAttempt(
  attempt: SatPretestAttempt | null,
): Map<SatSkillId, { correct: number; total: number; pct: number }> {
  const diagnosticBySkill = new Map<SatSkillId, { correct: number; total: number; pct: number }>();
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
  return diagnosticBySkill;
}

/** Prefer the newer completed baseline (Draft 1) or retest (Draft 3). */
export function getLatestDiagnosticAttempt(
  storage: Storage = localStorage,
): { attempt: SatPretestAttempt; source: SatDiagnosticSource } | null {
  const d1 = getLatestCompletedSatPretestAttempt(SAT_PRETEST_DRAFT_1_ID, storage);
  const d3 = getLatestCompletedSatPretestAttempt(SAT_PRETEST_DRAFT_3_ID, storage);
  if (!d1 && !d3) return null;
  if (!d1) return { attempt: d3!, source: "retest" };
  if (!d3) return { attempt: d1, source: "baseline" };
  const t1 = Date.parse(d1.completedAt ?? d1.startedAt);
  const t3 = Date.parse(d3.completedAt ?? d3.startedAt);
  return t3 >= t1 ? { attempt: d3, source: "retest" } : { attempt: d1, source: "baseline" };
}

/**
 * Per-skill mastery, merging four signals (mistakes, latest diagnostic, drill
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

  const latestDiag = getLatestDiagnosticAttempt(storage);
  const diagnosticBySkill = getDiagnosticBySkillFromAttempt(latestDiag?.attempt ?? null);
  const diagnosticSource = latestDiag?.source ?? null;

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
      diagnosticSource: diagnostic ? diagnosticSource : null,
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
