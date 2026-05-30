import type { QuizQuestion, Subject } from "@/curriculum/types";
import { getPrimaryMistakeCategory, type MistakeCategorySummary } from "@/lib/satMistakeTriage";
import { nodeRelevanceTier, type WeakTarget } from "@/lib/satSkillMatch";

export interface SatMicroDrillQuestion {
  subjectId: string;
  nodeId: string;
  nodeTitle: string;
  question: QuizQuestion;
}

export interface SatMicroDrill {
  title: string;
  reason: string;
  href: string;
  questions: SatMicroDrillQuestion[];
  /** True when there aren't enough skill-matched questions yet (content gap). */
  thin: boolean;
}

function normalize(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((part) => part.length >= 4);
}

function targetFromSummary(summary: MistakeCategorySummary | null): WeakTarget | null {
  if (!summary) return null;
  return { skillId: summary.skillId ?? null, section: summary.latestSection, nodeId: summary.nodeId };
}

/**
 * Build a focused drill for one weak skill. Ranks questions by skill relevance
 * (exact node > same skill > same domain > same section), with token overlap and
 * a stable order as tiebreaks. Multiple-choice only, de-duped by question id.
 */
export function buildSatMicroDrill(
  subjects: Subject[],
  storage: Storage = localStorage,
  limit = 5,
  /** Override the category to drill (e.g. from the spaced re-drill schedule). */
  target?: MistakeCategorySummary | null,
): SatMicroDrill {
  const sat = subjects.find((subject) => subject.id === "sat-prep");
  const topMistake = target ?? getPrimaryMistakeCategory(storage);
  const weak = targetFromSummary(topMistake ?? null);
  const tokens = new Set(normalize(topMistake?.category ?? ""));

  interface Scored extends SatMicroDrillQuestion {
    tier: number;
    tokenScore: number;
  }
  const candidates: Scored[] = [];
  const seen = new Set<string>();

  if (sat) {
    for (const node of sat.nodes) {
      const tier = weak ? nodeRelevanceTier(node.id, weak) : 0;
      for (const question of node.quiz ?? []) {
        if ((question.type ?? "multiple-choice") !== "multiple-choice" || question.options.length < 2) {
          continue;
        }
        if (seen.has(question.id)) continue;
        seen.add(question.id);
        const haystack = normalize(
          [node.name, node.description, ...node.keyConcepts, question.question].join(" "),
        );
        const tokenScore = tokens.size === 0 ? 0 : haystack.filter((token) => tokens.has(token)).length;
        candidates.push({
          subjectId: sat.id,
          nodeId: node.id,
          nodeTitle: node.name,
          question,
          tier,
          tokenScore,
        });
      }
    }
  }

  candidates.sort(
    (a, b) => b.tier - a.tier || b.tokenScore - a.tokenScore || a.nodeId.localeCompare(b.nodeId),
  );
  const questions: SatMicroDrillQuestion[] = candidates.slice(0, limit).map((item) => ({
    subjectId: item.subjectId,
    nodeId: item.nodeId,
    nodeTitle: item.nodeTitle,
    question: item.question,
  }));

  // "Thin" = a real skill was targeted but there aren't `limit` questions actually on that skill.
  const skillMatched = candidates.filter((c) => c.tier >= 3).length;
  const thin = !!weak?.skillId && skillMatched < limit;

  const href = topMistake?.nodeId
    ? `/subjects/sat-prep/${topMistake.nodeId}`
    : questions[0]
      ? `/subjects/sat-prep/${questions[0].nodeId}`
      : "/subjects/sat-prep#mistakes";

  return {
    title: topMistake ? `Micro-drill: ${topMistake.category}` : "Micro-drill: SAT warmup",
    reason: topMistake
      ? `${topMistake.count} logged miss${topMistake.count === 1 ? "" : "es"} in this skill.`
      : "No mistake logged yet, so start with available SAT quiz questions.",
    href,
    questions,
    thin,
  };
}
