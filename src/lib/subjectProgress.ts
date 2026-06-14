import type { SkillNode, Subject } from "@/curriculum/types";

type NodeStatus = "locked" | "available" | "completed";

export interface SubjectProgressSummary {
  completed: number;
  total: number;
  pct: number;
  nextNode: SkillNode | null;
}

export function summarizeSubjectProgress(
  subject: Subject,
  getNodeStatus: (node: SkillNode) => NodeStatus,
): SubjectProgressSummary {
  const total = subject.nodes.length;
  const completed = subject.nodes.filter((n) => getNodeStatus(n) === "completed").length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const nextNode = subject.nodes.find((n) => getNodeStatus(n) === "available") ?? null;

  return { completed, total, pct, nextNode };
}

/** Map curriculum subject id → daily-challenge category label */
export function subjectToChallengeCategory(subjectId: string): string | null {
  const map: Record<string, string> = {
    math: "Math",
    cs: "CS",
    programming: "CS",
    probability: "Probability",
    finance: "Finance",
    trading: "Trading",
    "sat-prep": "SAT",
  };
  return map[subjectId] ?? null;
}
