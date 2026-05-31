import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Subject } from "@/curriculum/types";
import { getSatDailyStudyCommand } from "@/lib/satDailyStudy";
import { getTodayHeroPresentation } from "@/lib/todayHero";
import { isDailySatQuizDone, markDailySatQuizDone } from "@/lib/satDailyQuiz";
import { SAT_MISTAKE_LOG_KEY } from "@/lib/satMistakeLog";

function mockStorage(): Storage {
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
  return {
    id: "sat-prep",
    name: "SAT",
    description: "",
    color: "#000",
    icon: "g",
    nodes: [
      {
        id: "st4",
        name: "Linear",
        description: "",
        xpValue: 10,
        parentIds: [],
        estimatedMinutes: 10,
        resources: [],
        keyConcepts: [],
        whyItMatters: "",
        practiceProblems: [],
        difficulty: "beginner",
        quiz: [],
      },
    ],
  };
}

describe("todayHero", () => {
  let storage: Storage;

  beforeEach(() => {
    storage = mockStorage();
    vi.stubGlobal("localStorage", storage);
    markDailySatQuizDone({ date: "2026-06-01", score: 5, total: 5 }, storage);
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-01T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("returns drill overlay when Daily 5 done and queue eligible", () => {
    const now = Date.now();
    storage.setItem(
      SAT_MISTAKE_LOG_KEY,
      JSON.stringify([
        {
          id: "m1",
          date: "2026-06-01",
          section: "math",
          category: "Linear equations",
          skillId: "linear-equations",
          note: "",
          createdAt: now,
        },
        {
          id: "m2",
          date: "2026-06-01",
          section: "math",
          category: "Linear equations",
          skillId: "linear-equations",
          note: "",
          createdAt: now - 1,
        },
        {
          id: "m3",
          date: "2026-06-01",
          section: "math",
          category: "Linear equations",
          skillId: "linear-equations",
          note: "",
          createdAt: now - 2,
        },
      ]),
    );
    const subjects = [satSubject()];
    const study = getSatDailyStudyCommand({ subjects, getNodeStatus: () => "available", storage });
    const overlay = getTodayHeroPresentation({
      study,
      subjects,
      getNodeStatus: () => "available",
      storage,
    });
    expect(overlay?.mode).toBe("drill_after_daily5");
    expect(overlay?.detail).toContain("Daily 5 done");
    expect(overlay?.primaryHref).toContain("linear-equations");
  });

  it("returns null when Daily 5 not done", () => {
    storage.removeItem("learnv2_sat_daily_quiz_v1");
    expect(isDailySatQuizDone("2026-06-01", storage)).toBe(false);
    const subjects = [satSubject()];
    const study = getSatDailyStudyCommand({ subjects, getNodeStatus: () => "available", storage });
    expect(
      getTodayHeroPresentation({
        study,
        subjects,
        getNodeStatus: () => "available",
        storage,
      }),
    ).toBeNull();
  });
});
