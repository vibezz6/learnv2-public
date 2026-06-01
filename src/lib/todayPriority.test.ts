import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SkillNode, Subject } from "@/curriculum/types";
import { addEssayFromTemplate, loadEssayTracker, saveEssayTracker } from "@/lib/essayTracker";
import { addMistake } from "@/lib/satMistakeLog";
import { SAT_PRETEST_STORAGE_KEY } from "@/lib/satPretest";
import { setStudyIntent } from "@/lib/studyIntent";
import { buildTodayPriority, shouldShowSecondaryDrill } from "@/lib/todayPriority";

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

function completedDraft1(storage: Storage) {
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

describe("todayPriority", () => {
  let storage: Storage;
  const subjects: Subject[] = [
    {
      id: "sat-prep",
      name: "SAT Prep",
      description: "",
      color: "#000",
      icon: "book",
      nodes: [node("st1"), node("st4")],
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

  it("keeps urgent college ahead of study intent", () => {
    setStudyIntent("sat", storage);
    completedDraft1(storage);
    let essays = loadEssayTracker(storage);
    essays = addEssayFromTemplate(essays, "common-app-personal", { dueDate: "2026-05-20" });
    saveEssayTracker(essays, storage);

    const priority = buildTodayPriority({
      subjects,
      getNodeStatus: () => "available",
      placementGoal: "sat",
      storage,
    });

    expect(priority.kind).toBe("urgent_college");
    expect(priority.surface).toBe("college");
    expect(priority.pageSubtitle).toContain("College deadline first");
  });

  it("turns catch-up intent into the primary hero when a lesson is in progress", () => {
    setStudyIntent("catch_up", storage);
    const continueTarget = { subject: subjects[0]!, node: subjects[0]!.nodes[0]! };

    const priority = buildTodayPriority({
      subjects,
      getNodeStatus: () => "available",
      placementGoal: "sat",
      continueTarget,
      storage,
    });

    expect(priority.kind).toBe("catch_up");
    expect(priority.surface).toBe("continue");
    expect(priority.detail).toContain("Finish Lesson st1");
  });

  it("hides the secondary drill card when SAT hero already points at a gap", () => {
    completedDraft1(storage);
    addMistake(
      {
        section: "math",
        category: "Linear equations",
        note: "Sign error",
        nodeId: "st4",
        date: "2026-05-24",
      },
      storage,
    );
    const priority = buildTodayPriority({
      subjects,
      getNodeStatus: () => "available",
      placementGoal: "sat",
      storage,
    });

    expect(priority.kind).toBe("sat");
    expect(shouldShowSecondaryDrill(priority)).toBe(false);
  });
});
