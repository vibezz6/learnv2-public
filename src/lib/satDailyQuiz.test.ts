import { describe, expect, it } from "vitest";
import type { Subject } from "@/curriculum/types";
import { getDailySatQuiz, SAT_DAILY_QUIZ_SIZE } from "@/lib/satDailyQuiz";

function satSubject(): Subject {
  const nodes = Array.from({ length: 6 }, (_, n) => ({
    id: `st${n}`,
    name: `SAT ${n}`,
    description: "",
    xpValue: 10,
    parentIds: [],
    estimatedMinutes: 10,
    resources: [],
    keyConcepts: [],
    whyItMatters: "",
    practiceProblems: [],
    difficulty: "beginner" as const,
    quiz: [
      {
        id: `st${n}-q1`,
        question: `Q${n}?`,
        options: ["a", "b", "c", "d"],
        correctIndex: 0,
        explanation: "",
      },
    ],
  }));
  return { id: "sat-prep", name: "SAT Prep", description: "", color: "#000", icon: "g", nodes };
}

describe("satDailyQuiz", () => {
  const subjects = [satSubject()];

  it("returns up to the configured size", () => {
    const quiz = getDailySatQuiz(subjects, "2026-05-29");
    expect(quiz.questions.length).toBe(Math.min(SAT_DAILY_QUIZ_SIZE, 6));
    expect(quiz.id).toBe("sat-daily-2026-05-29");
  });

  it("is deterministic for a given date", () => {
    const a = getDailySatQuiz(subjects, "2026-05-29");
    const b = getDailySatQuiz(subjects, "2026-05-29");
    expect(a.questions.map((q) => q.id)).toEqual(b.questions.map((q) => q.id));
  });

  it("varies across dates", () => {
    const a = getDailySatQuiz(subjects, "2026-05-29");
    const b = getDailySatQuiz(subjects, "2026-06-15");
    // Same pool, different seed — ordering should differ for a 6-item pool.
    expect(a.questions.map((q) => q.id)).not.toEqual(b.questions.map((q) => q.id));
  });

  it("returns an empty quiz when there is no SAT subject", () => {
    const quiz = getDailySatQuiz([], "2026-05-29");
    expect(quiz.questions).toHaveLength(0);
  });
});
