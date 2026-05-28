import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SkillNode, Subject } from "@/curriculum/types";
import { saveCollegeChecklist } from "@/lib/collegeChecklist";
import { saveEssayTracker } from "@/lib/essayTracker";
import { SAT_MISTAKE_LOG_KEY } from "@/lib/satMistakeLog";
import { SAT_PRETEST_STORAGE_KEY } from "@/lib/satPretest";
import { SAT_READINESS_STORAGE_KEY } from "@/lib/satReadiness";
import { buildStudyBlockPlan } from "@/lib/studyBlockPlan";

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

function completedDraft1(storage: Storage): void {
  storage.setItem(
    SAT_PRETEST_STORAGE_KEY,
    JSON.stringify({
      schemaVersion: 1,
      attempts: [
        {
          id: "a1",
          draftId: "draft-1",
          status: "completed",
          startedAt: "2026-05-20T00:00:00.000Z",
          completedAt: "2026-05-20T00:10:00.000Z",
          questionOrder: ["q1"],
          currentIndex: 0,
          responses: {},
          scoreSummary: {
            totalQuestions: 10,
            correctAnswers: 7,
            pct: 70,
            sectionBreakdown: [],
            skillBreakdown: [],
            weakSkills: [],
            recommendedNodeIds: [],
            timeSpentSeconds: 600,
          },
        },
      ],
    }),
  );
}

describe("studyBlockPlan", () => {
  let storage: Storage;
  const subjects: Subject[] = [
    {
      id: "sat-prep",
      name: "SAT Prep",
      description: "",
      color: "#000",
      icon: "book",
      nodes: [node("st1"), node("st2"), node("st4")],
    },
  ];

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

  it("builds a SAT-first 20 minute block when no college blocker exists", () => {
    const plan = buildStudyBlockPlan({
      subjects,
      getNodeStatus: () => "available",
      placementGoal: "sat",
      storage,
      now: new Date("2026-05-24T12:00:00.000Z"),
    });

    expect(plan.totalMinutes).toBe(20);
    expect(plan.steps).toHaveLength(2);
    expect(plan.steps[0]).toMatchObject({
      source: "sat",
      minutes: 15,
      href: "/subjects/sat-prep#official",
    });
    expect(plan.steps[1]).toMatchObject({
      source: "sat",
      minutes: 5,
      href: "/subjects/sat-prep#mistakes",
    });
  });

  it("adds an urgent college micro-step without displacing SAT study", () => {
    saveCollegeChecklist(
      {
        completed: {},
        customItems: [
          {
            id: "fafsa",
            title: "Submit FAFSA",
            dueDate: "2026-05-25",
            completed: false,
            createdAt: 1,
          },
        ],
      },
      storage,
    );

    const plan = buildStudyBlockPlan({
      subjects,
      getNodeStatus: () => "available",
      placementGoal: "sat",
      storage,
      now: new Date("2026-05-24T12:00:00.000Z"),
    });

    expect(plan.totalMinutes).toBe(20);
    expect(plan.steps[0].source).toBe("sat");
    expect(plan.steps[1]).toMatchObject({
      source: "college",
      title: "College: Submit FAFSA",
      minutes: 5,
      href: "/campus/college-checklist",
    });
    expect(plan.steps[1].detail).toContain("Due in 1 day");
  });

  it("keeps low-readiness sessions light and mistake-focused", () => {
    completedDraft1(storage);
    storage.setItem(
      SAT_MISTAKE_LOG_KEY,
      JSON.stringify([
        {
          id: "m1",
          date: "2026-05-24",
          section: "math",
          category: "Linear equations",
          note: "Forgot negative",
          createdAt: 1,
        },
      ]),
    );
    storage.setItem(
      SAT_READINESS_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 1,
        entries: [{ date: "2026-05-24", rating: 2 }],
      }),
    );
    saveEssayTracker({ essays: [] }, storage);

    const plan = buildStudyBlockPlan({
      subjects,
      getNodeStatus: () => "available",
      placementGoal: "sat",
      storage,
      now: new Date("2026-05-24T12:00:00.000Z"),
    });

    expect(plan.rationale).toContain("Light day");
    expect(plan.steps[0]).toMatchObject({
      source: "sat",
      title: "SAT: mistake review",
      minutes: 15,
      href: "/subjects/sat-prep#mistakes",
    });
    expect(plan.steps[0].detail).toContain("light day");
  });
});
