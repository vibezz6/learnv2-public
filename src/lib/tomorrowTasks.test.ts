import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SkillNode, Subject } from "@/curriculum/types";
import { saveCollegeChecklist } from "@/lib/collegeChecklist";
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
      id: "checklist-c1",
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
      id: "checklist-late",
      detail: "Overdue",
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
});
