import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SkillNode, Subject } from "@/curriculum/types";
import { saveCollegeChecklist } from "@/lib/collegeChecklist";
import { addEssayFromTemplate, loadEssayTracker, saveEssayTracker } from "@/lib/essayTracker";
import { SAT_PRETEST_STORAGE_KEY } from "@/lib/satPretest";
import { addMistake } from "@/lib/satMistakeLog";
import { buildTomorrowTasks } from "@/lib/tomorrowTasks";

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

describe("tomorrowTasks", () => {
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

  it("prefers blocking application item when essay is overdue", () => {
    let essays = loadEssayTracker(storage);
    essays = addEssayFromTemplate(essays, "why-us", { dueDate: "2026-05-20" });
    saveEssayTracker(essays, storage);

    const tasks = buildTomorrowTasks(
      {
        subjects: [],
        getNodeStatus: () => "available",
        reviewDueCount: 0,
        storage,
      },
      3,
    );

    expect(tasks[0]?.id).toMatch(/^blocking-/);
    expect(tasks[0]?.source).toBe("college");
  });

  it("prioritizes college deadlines due today or tomorrow", () => {
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

    const tasks = buildTomorrowTasks(
      {
        subjects: [],
        getNodeStatus: () => "available",
        reviewDueCount: 0,
        placementGoal: "explore",
        storage,
      },
      3,
    );

    expect(tasks[0]).toMatchObject({
      id: "blocking-checklist-c1",
      title: "Submit FAFSA",
      source: "college",
    });
  });

  it("includes overdue college deadlines", () => {
    saveCollegeChecklist(
      {
        completed: {},
        customItems: [
          {
            id: "late",
            title: "Late application fee",
            completed: false,
            dueDate: "2026-05-20",
            createdAt: 1,
          },
        ],
      },
      storage,
    );

    const tasks = buildTomorrowTasks(
      {
        subjects: [],
        getNodeStatus: () => "available",
        reviewDueCount: 0,
        storage,
      },
      3,
    );

    expect(tasks[0]).toMatchObject({
      id: "blocking-checklist-late",
      title: "Late application fee",
      source: "college",
    });
  });

  it("includes review and SAT pretest when no draft is complete", () => {
    const subjects: Subject[] = [
      {
        id: "sat-prep",
        name: "SAT Prep",
        description: "",
        color: "#000",
        icon: "book",
        nodes: [node("st1")],
      },
    ];

    const tasks = buildTomorrowTasks({
      subjects,
      getNodeStatus: (n) => (n.id === "st1" ? "available" : "locked"),
      reviewDueCount: 2,
      placementGoal: "sat",
      storage,
    });

    expect(tasks.some((task) => task.source === "review")).toBe(true);
    expect(tasks.some((task) => task.id === "sat-pretest-draft1")).toBe(true);
  });

  it("after Draft 1 complete, prefers mistake review before optional Draft 2", () => {
    storage.setItem(
      SAT_PRETEST_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 1,
        attempts: [
          {
            id: "d1",
            draftId: "draft-1",
            status: "completed",
            startedAt: "2026-05-20T00:00:00.000Z",
            completedAt: "2026-05-20T00:10:00.000Z",
            questionOrder: ["q1"],
            currentIndex: 0,
            responses: {},
            scoreSummary: {
              totalQuestions: 10,
              correctAnswers: 3,
              pct: 30,
              sectionBreakdown: [],
              skillBreakdown: [],
              weakSkills: [{ key: "linear", label: "Linear equations", correct: 0, total: 2, pct: 0 }],
              recommendedNodeIds: ["st4"],
              timeSpentSeconds: 600,
            },
          },
        ],
      }),
    );
    addMistake(
      { section: "math", category: "Linear equations", note: "sign error" },
      storage,
    );

    const subjects: Subject[] = [
      {
        id: "sat-prep",
        name: "SAT Prep",
        description: "",
        color: "#000",
        icon: "book",
        nodes: [node("st4")],
      },
    ];

    const tasks = buildTomorrowTasks(
      {
        subjects,
        getNodeStatus: () => "available",
        reviewDueCount: 0,
        placementGoal: "sat",
        storage,
      },
      3,
    );

    const mistakeIdx = tasks.findIndex((t) => t.id.startsWith("sat-mistake-"));
    const draft2Idx = tasks.findIndex((t) => t.id === "sat-pretest-draft2");
    expect(mistakeIdx).toBeGreaterThanOrEqual(0);
    if (draft2Idx >= 0 && mistakeIdx >= 0) {
      expect(mistakeIdx).toBeLessThan(draft2Idx);
    }
    expect(tasks[mistakeIdx]).toMatchObject({
      source: "sat",
      title: "Review Linear equations",
    });
  });
});
