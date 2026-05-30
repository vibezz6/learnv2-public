import { describe, expect, it } from "vitest";
import type { Subject } from "@/curriculum/types";
import { SAT_MISTAKE_LOG_KEY } from "@/lib/satMistakeLog";
import { getDailySatQuiz, SAT_DAILY_QUIZ_SIZE } from "@/lib/satDailyQuiz";

function mapStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k) => map.get(k) ?? null,
    key: (i) => [...map.keys()][i] ?? null,
    removeItem: (k) => map.delete(k),
    setItem: (k, v) => map.set(k, v),
  } as Storage;
}

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

  it("weights questions toward logged weak categories", () => {
    const storage = mapStorage();
    storage.setItem(
      SAT_MISTAKE_LOG_KEY,
      JSON.stringify([
        {
          id: "m1",
          date: "2026-05-29",
          section: "math",
          category: "Linear equations",
          note: "x",
          createdAt: 1,
        },
      ]),
    );
    const mk = (id: string, name: string, concepts: string[]) => ({
      id,
      name,
      description: "",
      xpValue: 10,
      parentIds: [],
      estimatedMinutes: 10,
      resources: [],
      keyConcepts: concepts,
      whyItMatters: "",
      practiceProblems: [],
      difficulty: "beginner" as const,
      quiz: [
        { id: `${id}-q1`, question: `Q ${name}?`, options: ["a", "b"], correctIndex: 0, explanation: "" },
      ],
    });
    const subjects: Subject[] = [
      {
        id: "sat-prep",
        name: "SAT Prep",
        description: "",
        color: "#000",
        icon: "g",
        nodes: [
          mk("st1", "Geometry", ["Angles and triangles"]),
          mk("st2", "Algebra", ["Linear equations and slope"]),
        ],
      },
    ];
    const quiz = getDailySatQuiz(subjects, "2026-05-29", 1, storage);
    expect(quiz.questions[0]?.id).toBe("st2-q1");
  });
});
