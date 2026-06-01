import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Subject } from "@/curriculum/types";
import { saveCollegeChecklist } from "@/lib/collegeChecklist";
import { buildStudyRecommendations } from "@/lib/studyRecommendations";

function mockStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => map.set(k, v),
    removeItem: (k) => map.delete(k),
    key: (i) => [...map.keys()][i] ?? null,
  };
}

const subjects: Subject[] = [
  {
    id: "sat-prep",
    name: "SAT Prep",
    description: "",
    color: "#000",
    icon: "book",
    nodes: [
      {
        id: "st1",
        name: "SAT Warmup",
        description: "Warm up.",
        xpValue: 10,
        parentIds: [],
        estimatedMinutes: 10,
        resources: [],
        keyConcepts: ["warmup", "sat"],
        whyItMatters: "Useful.",
        practiceProblems: ["Try one question."],
        difficulty: "beginner",
        quiz: [{ id: "q1", question: "Pick A.", options: ["A", "B"], correctIndex: 0, explanation: "A is right." }],
      },
    ],
  },
];

describe("studyRecommendations", () => {
  let storage: Storage;

  beforeEach(() => {
    storage = mockStorage();
    vi.stubGlobal("localStorage", storage);
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-28T12:00:00.000Z"));
  });

  it("prioritizes college blockers then SAT drills", () => {
    saveCollegeChecklist(
      {
        completed: {},
        customItems: [{ id: "c1", title: "Submit FAFSA", dueDate: "2026-05-28", completed: false, createdAt: 1 }],
      },
      storage,
    );
    const recs = buildStudyRecommendations({
      subjects,
      getNodeStatus: () => "available",
      reviewDueCount: 2,
      storage,
      now: new Date("2026-05-28T12:00:00.000Z"),
    });
    expect(recs[0]?.id).toBe("college-blocker");
    expect(recs.some((r) => r.id === "sat-micro-drill")).toBe(true);
  });
});
