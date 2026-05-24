import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SkillNode, Subject } from "@/curriculum/types";
import { addMistake } from "@/lib/satMistakeLog";
import {
  buildTranscriptSummary,
  copyTranscriptToClipboard,
  formatTranscriptMarkdown,
  type TranscriptProgressGetters,
} from "@/lib/transcript";
import type { ReviewStats, Stats } from "@/stores/progress";

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

function node(id: string, name = id): SkillNode {
  return {
    id,
    name,
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

function subject(id: string, name: string, nodeIds: string[]): Subject {
  return {
    id,
    name,
    description: "",
    color: "#000",
    icon: "function",
    nodes: nodeIds.map((nodeId) => node(nodeId, `${name} ${nodeId}`)),
  };
}

function makeGetters(
  stats: Partial<Stats>,
  reviewStats: Partial<ReviewStats>,
  statusMap: Record<string, "locked" | "available" | "completed">,
): TranscriptProgressGetters {
  const fullStats: Stats = {
    totalXp: 0,
    level: 1,
    xpToNext: 500,
    completedNodes: 0,
    totalNodes: 0,
    streakCurrent: 0,
    streakLongest: 0,
    totalStudyMinutes: 0,
    dailyGoal: 60,
    todayMinutes: 0,
    dailyMinutes: {},
    ...stats,
  };

  const fullReviewStats: ReviewStats = {
    totalReviews: 0,
    passCount: 0,
    failCount: 0,
    passRate: 0,
    ...reviewStats,
  };

  return {
    getStats: (subjects) => {
      let completedNodes = 0;
      let totalNodes = 0;
      for (const sub of subjects) {
        for (const n of sub.nodes) {
          totalNodes++;
          if ((statusMap[n.id] ?? "locked") === "completed") completedNodes++;
        }
      }
      return { ...fullStats, completedNodes, totalNodes };
    },
    getNodeStatus: (n) => statusMap[n.id] ?? "locked",
    getReviewStats: () => fullReviewStats,
  };
}

describe("transcript", () => {
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

  it("buildTranscriptSummary aggregates progress, reviews, and SAT mistakes", () => {
    const subjects = [
      subject("math", "Math", ["m1", "m2", "m3"]),
      subject("sat-prep", "SAT Prep", ["st1", "st2"]),
    ];

    addMistake({ section: "math", category: "Tables", note: "Misread axis" }, storage);
    addMistake({ section: "rw", category: "Evidence", note: "Quote trap" }, storage);

    const summary = buildTranscriptSummary(
      subjects,
      makeGetters(
        { totalStudyMinutes: 125.4, streakCurrent: 4 },
        { passRate: 82, totalReviews: 11, passCount: 9, failCount: 2 },
        { m1: "completed", m2: "available", st1: "completed" },
      ),
      storage,
    );

    expect(summary).toMatchObject({
      generatedAt: "2026-05-24T12:00:00.000Z",
      studyMinutes: 125,
      completedLessons: 2,
      totalLessons: 5,
      streak: 4,
      reviewPassRate: 82,
      satMistakesLogged: 2,
    });

    expect(summary.subjectBreakdown).toEqual([
      { subjectId: "sat-prep", subjectName: "SAT Prep", completed: 1, total: 2, pct: 50 },
      { subjectId: "math", subjectName: "Math", completed: 1, total: 3, pct: 33 },
    ]);

    expect(summary.narrativeBullets).toEqual(
      expect.arrayContaining([
        "Logged 125 minutes of focused study time.",
        "Completed 2 of 5 lessons (40% of curriculum).",
        "Current study streak: 4 days.",
        "Spaced review pass rate: 82%.",
        "Logged 2 SAT practice mistakes for retargeting.",
        "Most progress: SAT Prep (50%), Math (33%).",
      ]),
    );
  });

  it("buildTranscriptSummary handles empty progress with starter bullets", () => {
    const subjects = [subject("math", "Math", ["m1"])];

    const summary = buildTranscriptSummary(
      subjects,
      makeGetters({}, {}, {}),
      storage,
    );

    expect(summary).toMatchObject({
      studyMinutes: 0,
      completedLessons: 0,
      totalLessons: 1,
      streak: 0,
      reviewPassRate: 0,
      satMistakesLogged: 0,
      subjectBreakdown: [{ subjectId: "math", subjectName: "Math", completed: 0, total: 1, pct: 0 }],
    });

    expect(summary.narrativeBullets).toEqual([
      "No study time logged yet — use the timer to start building your record.",
      "Completed 0 of 1 lessons (0% of curriculum).",
      "Study today to start or extend your streak.",
    ]);
  });

  it("formatTranscriptMarkdown includes summary, breakdown, and highlights", () => {
    const summary = buildTranscriptSummary(
      [subject("math", "Math", ["m1", "m2"])],
      makeGetters(
        { totalStudyMinutes: 90, streakCurrent: 2 },
        { passRate: 75 },
        { m1: "completed" },
      ),
      storage,
    );

    const markdown = formatTranscriptMarkdown(summary);

    expect(markdown).toContain("# Learn v2 Study Transcript");
    expect(markdown).toContain("Generated: 2026-05-24T12:00:00.000Z");
    expect(markdown).toContain("App: v2.0.12");
    expect(markdown).toContain("- Study time: 90 minutes");
    expect(markdown).toContain("- Lessons completed: 1 / 2");
    expect(markdown).toContain("- Math: 1/2 (50%)");
    expect(markdown).toContain("## Highlights");
    expect(markdown).toContain("_Exported from Learn v2 on 2026-05-24._");
  });

  it("copyTranscriptToClipboard writes formatted markdown", async () => {
    const summary = buildTranscriptSummary(
      [subject("math", "Math", ["m1"])],
      makeGetters({ totalStudyMinutes: 30 }, {}, { m1: "completed" }),
      storage,
    );

    const writeText = vi.fn(async () => undefined);
    const copied = await copyTranscriptToClipboard(summary, writeText);

    expect(copied).toBe(true);
    expect(writeText).toHaveBeenCalledOnce();
    expect(writeText).toHaveBeenCalledWith(formatTranscriptMarkdown(summary));
  });

  it("copyTranscriptToClipboard returns false when clipboard write fails", async () => {
    const summary = buildTranscriptSummary(
      [subject("math", "Math", ["m1"])],
      makeGetters({}, {}, {}),
      storage,
    );

    const copied = await copyTranscriptToClipboard(summary, async () => {
      throw new Error("denied");
    });

    expect(copied).toBe(false);
  });
});
