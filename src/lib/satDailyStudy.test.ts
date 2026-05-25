import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SkillNode, Subject } from "@/curriculum/types";
import { SAT_PRETEST_STORAGE_KEY } from "@/lib/satPretest";
import { SAT_MISTAKE_LOG_KEY } from "@/lib/satMistakeLog";
import { SAT_READINESS_STORAGE_KEY } from "@/lib/satReadiness";
import { getSatDailyStudyCommand, shouldShowSatTodayCard } from "@/lib/satDailyStudy";

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

describe("satDailyStudy", () => {
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

  it("starts with Draft 1 when baseline not complete", () => {
    const command = getSatDailyStudyCommand({
      subjects,
      getNodeStatus: () => "available",
      storage,
    });
    expect(command.kind).toBe("start_draft1");
    expect(command.href).toBe("/sat/pretest");
  });

  it("prefers mistake review on low readiness after Draft 1", () => {
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
              correctAnswers: 3,
              pct: 30,
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

    const command = getSatDailyStudyCommand({
      subjects,
      getNodeStatus: () => "available",
      storage,
    });

    expect(command.kind).toBe("mistake_review");
    expect(command.intensity).toBe("minimum");
    expect(command.href).toContain("mistakes");
  });

  it("shouldShowSatTodayCard is true for SAT placement", () => {
    expect(
      shouldShowSatTodayCard("sat", subjects, () => "available", storage),
    ).toBe(true);
  });

});
