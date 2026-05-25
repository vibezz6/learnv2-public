import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SkillNode, Subject } from "@/curriculum/types";
import { saveCollegeChecklist } from "@/lib/collegeChecklist";
import { buildWeekPlanRows } from "@/lib/weekPlan";

function mockLocalStorage(): Storage {
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
  };
}

function node(id: string): SkillNode {
  return {
    id,
    name: `Lesson ${id}`,
    description: "",
    xpValue: 10,
    parentIds: [],
    estimatedMinutes: 10,
    resources: [],
    keyConcepts: [],
    whyItMatters: "",
    practiceProblems: [],
    difficulty: "beginner",
  };
}

describe("weekPlan", () => {
  let storage: Storage;

  beforeEach(() => {
    storage = mockLocalStorage();
    vi.stubGlobal("localStorage", storage);
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-24T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("merges college deadlines with track lessons without review rows", () => {
    saveCollegeChecklist(
      {
        completed: {},
        customItems: [
          {
            id: "c1",
            title: "Submit FAFSA",
            completed: false,
            dueDate: "2026-05-25",
            createdAt: 1,
          },
        ],
      },
      storage,
    );

    const subjects: Subject[] = [
      {
        id: "sat-prep",
        name: "SAT Prep",
        description: "",
        color: "#000",
        icon: "book",
        nodes: [node("st1"), node("st2")],
      },
    ];

    const rows = buildWeekPlanRows(
      {
        subjects,
        getNodeStatus: (n) => (n.id === "st1" ? "available" : "locked"),
        enrolledTrackId: "sat-august",
        placementGoal: "sat",
        storage,
      },
      6,
    );

    expect(rows.some((r) => r.source === "college" && r.title === "Submit FAFSA")).toBe(true);
    expect(rows.some((r) => r.source === "track")).toBe(true);
    expect(rows.some((r) => r.id === "review-due")).toBe(false);
  });

  it("does not throw when building rows (regression: undefined admissions args)", () => {
    expect(() =>
      buildWeekPlanRows({
        subjects: [],
        getNodeStatus: () => "available",
        storage,
      }),
    ).not.toThrow();
  });
});
