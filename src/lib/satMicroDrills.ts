import type { QuizQuestion, Subject } from "@/curriculum/types";
import { getPrimaryMistakeCategory } from "@/lib/satMistakeTriage";

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
}

function normalize(value: string): string[] {
  return value.toLowerCase().split(/[^a-z0-9]+/).filter((part) => part.length >= 4);
}

export function buildSatMicroDrill(
  subjects: Subject[],
  storage: Storage = localStorage,
  limit = 5,
): SatMicroDrill {
  const sat = subjects.find((subject) => subject.id === "sat-prep");
  const topMistake = getPrimaryMistakeCategory(storage);
  const tokens = new Set(normalize(topMistake?.category ?? ""));
  const candidates: SatMicroDrillQuestion[] = [];

  if (sat) {
    for (const node of sat.nodes) {
      for (const question of node.quiz ?? []) {
        const haystack = normalize([
          node.name,
          node.description,
          ...node.keyConcepts,
          question.question,
        ].join(" "));
        const score = tokens.size === 0 ? 0 : haystack.filter((token) => tokens.has(token)).length;
        candidates.push({
          subjectId: sat.id,
          nodeId: node.id,
          nodeTitle: node.name,
          question,
          ...({ score } as { score: number }),
        } as SatMicroDrillQuestion & { score: number });
      }
    }
  }

  const sorted = (candidates as Array<SatMicroDrillQuestion & { score: number }>)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ score: _score, ...item }) => item);

  const href = topMistake?.nodeId
    ? `/subjects/sat-prep/${topMistake.nodeId}`
    : sorted[0]
      ? `/subjects/sat-prep/${sorted[0].nodeId}`
      : "/subjects/sat-prep#mistakes";

  return {
    title: topMistake ? `Micro-drill: ${topMistake.category}` : "Micro-drill: SAT warmup",
    reason: topMistake
      ? `${topMistake.count} logged miss${topMistake.count === 1 ? "" : "es"} in this category.`
      : "No mistake category yet, so start with available SAT quiz questions.",
    href,
    questions: sorted,
  };
}
