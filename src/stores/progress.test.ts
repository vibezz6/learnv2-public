import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Subject } from "@/curriculum/types";
import { recordStudyActivity, STUDY_ACTIVITY_STORAGE_KEY } from "@/lib/studyActivity";
import { quizProgressKey } from "@/features/quiz/quizProgress";
import { upsertSession } from "@/stores/noteSessions";
import {
  getToday,
  MAX_DAILY_REVIEWS,
  useProgress,
  V1_STORAGE_KEY,
  V2_STORAGE_KEY,
} from "@/stores/progress";

function mockSubjects(): Subject[] {
  return [
    {
      id: "math",
      name: "Math",
      description: "Test subject",
      color: "#000",
      icon: "M",
      nodes: [
        {
          id: "m1",
          name: "Node 1",
          description: "First node",
          xpValue: 50,
          parentIds: [],
          estimatedMinutes: 30,
          resources: [],
          keyConcepts: [],
          whyItMatters: "Testing",
          practiceProblems: [],
          difficulty: "beginner",
        },
        {
          id: "m2",
          name: "Node 2",
          description: "Second node",
          xpValue: 50,
          parentIds: ["m1"],
          estimatedMinutes: 30,
          resources: [],
          keyConcepts: [],
          whyItMatters: "Testing",
          practiceProblems: [],
          difficulty: "beginner",
        },
      ],
    },
  ];
}

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

function dateFromToday(offsetDays: number): string {
  const date = new Date(`${getToday()}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function mockSubjectsWithNodeCount(count: number): Subject[] {
  const nodes = Array.from({ length: count }, (_, index) => ({
    id: `n${index}`,
    name: `Node ${index}`,
    description: "Review node",
    xpValue: 10,
    parentIds: index === 0 ? [] : [`n${index - 1}`],
    estimatedMinutes: 10,
    resources: [],
    keyConcepts: [],
    whyItMatters: "Testing",
    practiceProblems: [],
    difficulty: "beginner" as const,
  }));
  return [
    {
      id: "math",
      name: "Math",
      description: "Test subject",
      color: "#000",
      icon: "M",
      nodes,
    },
  ];
}

function seedDueReviews(nodeIds: string[]) {
  const data = useProgress.getState().data;
  const nodes = { ...data.nodes };
  const spacedRepetition = { ...data.spacedRepetition };
  const now = new Date().toISOString();

  for (const nodeId of nodeIds) {
    nodes[nodeId] = {
      completedAt: now,
      startedAt: now,
      timeSpentMinutes: 0,
      quizScores: [],
      quizHistory: [],
    };
    spacedRepetition[nodeId] = {
      nodeId,
      currentIntervalIndex: 0,
      scheduledReviews: [{ scheduledDate: getToday(), completedDate: null }],
    };
  }

  useProgress.setState({ data: { ...data, nodes, spacedRepetition } });
}

describe("progress", () => {
  beforeEach(() => {
    useProgress.getState().resetProgress();
  });

  it("getToday uses UTC", () => {
    const d = new Date();
    const expected = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
    expect(getToday()).toBe(expected);
  });

  it("addStudyTime updates daily minutes and streak", () => {
    useProgress.getState().addStudyTime(600);
    const data = useProgress.getState().data;
    expect(data.totalStudyMinutes).toBe(10);
    expect(data.dailyMinutes[getToday()]).toBe(10);
    expect(data.streaks.current).toBe(1);
  });

  it("completeDailyChallenge awards XP once per day", () => {
    useProgress.getState().completeDailyChallenge("dc001", 25);
    useProgress.getState().completeDailyChallenge("dc001", 25);
    expect(useProgress.getState().data.totalXp).toBe(25);
  });

  it("exportData returns valid JSON with version", () => {
    const exported = useProgress.getState().exportData();
    const parsed = JSON.parse(exported) as { version: number; keys: Record<string, string | null> };
    expect(parsed.version).toBe(3);
    expect(typeof parsed.keys).toBe("object");
  });

  it("resetProgress clears data", () => {
    useProgress.getState().completeNode("m1", 50);
    useProgress.getState().resetProgress();
    expect(useProgress.getState().data.totalXp).toBe(0);
  });

  it("completeNode awards XP once and marks node completed", () => {
    useProgress.getState().completeNode("m1", 50);
    expect(useProgress.getState().data.totalXp).toBe(50);
    expect(useProgress.getState().data.nodes.m1.completedAt).toBeTruthy();

    useProgress.getState().completeNode("m1", 50);
    expect(useProgress.getState().data.totalXp).toBe(50);
  });

  it("completeNode sets levelUpPending when crossing a level threshold", () => {
    useProgress.getState().completeNode("m1", 480);
    expect(useProgress.getState().data.levelUpPending).toBeNull();

    useProgress.getState().completeNode("m2", 50);
    expect(useProgress.getState().data.totalXp).toBe(530);
    expect(useProgress.getState().data.levelUpPending).toBe(2);
  });

  it("getNodesNeedingReview returns due items for completed nodes in subjects", () => {
    const subjects = mockSubjects();
    useProgress.getState().completeNode("m1", 50);
    expect(useProgress.getState().getNodesNeedingReview(subjects)).toEqual([]);

    const data = useProgress.getState().data;
    useProgress.setState({
      data: {
        ...data,
        spacedRepetition: {
          m1: {
            ...data.spacedRepetition.m1,
            scheduledReviews: [{ scheduledDate: getToday(), completedDate: null }],
          },
        },
      },
    });

    const due = useProgress.getState().getNodesNeedingReview(subjects);
    expect(due).toHaveLength(1);
    expect(due[0].node.id).toBe("m1");
    expect(due[0].subject.id).toBe("math");
    expect(due[0].nextReviewDate).toBe(getToday());
    expect(due[0].reviewInterval).toBe(1);
  });

  it("getNodesNeedingReview skips nodes not present in subjects", () => {
    useProgress.getState().completeNode("orphan", 50);
    const data = useProgress.getState().data;
    useProgress.setState({
      data: {
        ...data,
        spacedRepetition: {
          orphan: {
            nodeId: "orphan",
            scheduledReviews: [{ scheduledDate: getToday(), completedDate: null }],
            currentIntervalIndex: 0,
          },
        },
      },
    });

    expect(useProgress.getState().getNodesNeedingReview(mockSubjects())).toEqual([]);
  });



  it("uses earliest pending review and records confidence stats", () => {
    useProgress.getState().completeNode("m1", 50);
    const data = useProgress.getState().data;
    useProgress.setState({
      data: {
        ...data,
        spacedRepetition: {
          m1: {
            nodeId: "m1",
            currentIntervalIndex: 7,
            scheduledReviews: [
              { scheduledDate: dateFromToday(-2), completedDate: null },
              { scheduledDate: dateFromToday(-1), completedDate: null },
            ],
          },
        },
      },
    });

    expect(useProgress.getState().getNodesNeedingReview(mockSubjects())[0].nextReviewDate).toBe(dateFromToday(-2));

    useProgress.getState().completeReviewWithConfidence("m1", "normal");
    const item = useProgress.getState().data.spacedRepetition.m1;
    expect(item.currentIntervalIndex).toBe(7);
    expect(item.scheduledReviews[0]).toMatchObject({ completedDate: getToday(), confidence: "normal" });
    expect(item.scheduledReviews.at(-1)).toMatchObject({ scheduledDate: dateFromToday(240), completedDate: null });
    expect(useProgress.getState().getReviewStats()).toEqual({ totalReviews: 1, passCount: 1, failCount: 0, passRate: 100 });
  });

  it("getReviewStats returns zeros when no reviews are completed", () => {
    expect(useProgress.getState().getReviewStats()).toEqual({
      totalReviews: 0,
      passCount: 0,
      failCount: 0,
      passRate: 0,
    });
  });

  it("getReviewStats treats forgot as fail and rounds passRate", () => {
    useProgress.getState().completeNode("m1", 50);
    useProgress.getState().completeNode("m2", 50);
    useProgress.getState().completeReviewWithConfidence("m1", "easy");
    useProgress.getState().completeReviewWithConfidence("m2", "forgot");

    expect(useProgress.getState().getReviewStats()).toEqual({
      totalReviews: 2,
      passCount: 1,
      failCount: 1,
      passRate: 50,
    });
  });

  it("getReviewStats aggregates completed reviews across nodes", () => {
    useProgress.getState().completeNode("m1", 50);
    useProgress.getState().completeNode("m2", 50);
    useProgress.getState().completeReviewWithConfidence("m1", "normal");
    useProgress.getState().completeReviewWithConfidence("m2", "hard");

    expect(useProgress.getState().getReviewStats()).toEqual({
      totalReviews: 2,
      passCount: 2,
      failCount: 0,
      passRate: 100,
    });
  });

  it("getReviewStats ignores pending reviews without confidence", () => {
    useProgress.getState().completeNode("m1", 50);
    useProgress.getState().completeReviewWithConfidence("m1", "normal");

    const data = useProgress.getState().data;
    useProgress.setState({
      data: {
        ...data,
        spacedRepetition: {
          ...data.spacedRepetition,
          m2: {
            nodeId: "m2",
            currentIntervalIndex: 0,
            scheduledReviews: [
              { scheduledDate: getToday(), completedDate: getToday() },
              { scheduledDate: dateFromToday(1), completedDate: null },
            ],
          },
        },
      },
    });

    expect(useProgress.getState().getReviewStats()).toEqual({
      totalReviews: 1,
      passCount: 1,
      failCount: 0,
      passRate: 100,
    });
  });

  it("getDailyReviewCount increments when completing reviews", () => {
    useProgress.getState().completeNode("m1", 50);
    expect(useProgress.getState().getDailyReviewCount()).toBe(0);

    useProgress.getState().completeReviewWithConfidence("m1", "normal");
    expect(useProgress.getState().getDailyReviewCount()).toBe(1);
  });

  it("getDailyReviewItems respects the daily review cap", () => {
    const subjects = mockSubjectsWithNodeCount(12);
    seedDueReviews(subjects[0].nodes.map((node) => node.id));

    expect(useProgress.getState().getDailyReviewItems(subjects)).toHaveLength(MAX_DAILY_REVIEWS);
  });

  it("getDailyReviewItems returns no items once the daily cap is reached", () => {
    const subjects = mockSubjectsWithNodeCount(3);
    seedDueReviews(subjects[0].nodes.map((node) => node.id));
    useProgress.setState({
      data: {
        ...useProgress.getState().data,
        dailyReviews: { [getToday()]: MAX_DAILY_REVIEWS },
      },
    });

    expect(useProgress.getState().getDailyReviewItems(subjects)).toEqual([]);
  });

  it("getRemainingReviewCount reports overflow beyond the daily cap", () => {
    const subjects = mockSubjectsWithNodeCount(12);
    seedDueReviews(subjects[0].nodes.map((node) => node.id));

    expect(useProgress.getState().getRemainingReviewCount(subjects)).toBe(2);
  });

  it("prefers notes continue target when recent notes activity has open review", () => {
    const subjects = mockSubjects();
    useProgress.getState().completeNode("m1", 50);
    upsertSession({
      nodeId: "m2",
      subjectId: "math",
      responses: { q1: "filled answer" },
      review: null,
      mentorSession: null,
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    recordStudyActivity({ type: "notes_updated", nodeId: "m2", subjectId: "math" });

    expect(useProgress.getState().getContinueTarget(subjects)?.node.id).toBe("m2");
  });

  it("skips completed continue targets and decays stale streaks on read", () => {
    const subjects = mockSubjects();
    useProgress.getState().completeNode("m1", 50);
    useProgress.getState().trackVisit("m1");
    useProgress.setState({
      data: {
        ...useProgress.getState().data,
        streaks: { current: 5, longest: 5, lastStudyDate: dateFromToday(-2) },
      },
    });

    expect(useProgress.getState().getContinueTarget(subjects)?.node.id).toBe("m2");
    expect(useProgress.getState().getStats(subjects).streakCurrent).toBe(0);
  });

});

describe("progress exportData/importData", () => {
  const originalLocalStorage = globalThis.localStorage;

  beforeEach(() => {
    globalThis.localStorage = mockLocalStorage();
    useProgress.getState().resetProgress();
  });

  afterEach(() => {
    globalThis.localStorage = originalLocalStorage;
  });

  it("exportData includes study activity ledger when present", () => {
    recordStudyActivity({ type: "lesson_started", nodeId: "m1" }, globalThis.localStorage);
    const exported = JSON.parse(useProgress.getState().exportData()) as {
      keys: Record<string, string | null>;
    };
    expect(exported.keys[STUDY_ACTIVITY_STORAGE_KEY]).toBeTruthy();
  });

  it("prefers in-progress quiz in getContinueTarget when quiz session exists", () => {
    const subjects = mockSubjects();
    useProgress.getState().completeNode("m1", 50);
    globalThis.localStorage.setItem(
      quizProgressKey("m2"),
      JSON.stringify({
        current: 1,
        answers: [0, null],
        questionCount: 2,
        timestamp: Date.now(),
      }),
    );
    expect(useProgress.getState().getContinueTarget(subjects)?.node.id).toBe("m2");
  });

  it("roundtrips progress through export and import", () => {
    useProgress.getState().completeNode("m1", 75);
    useProgress.getState().addStudyTime(300);

    // Persist middleware is unavailable in node tests; mirror production storage.
    localStorage.setItem(
      V2_STORAGE_KEY,
      JSON.stringify({ state: { data: useProgress.getState().data }, version: 0 }),
    );

    const exported = useProgress.getState().exportData();
    useProgress.getState().resetProgress();
    expect(useProgress.getState().data.totalXp).toBe(0);
    expect(useProgress.getState().data.totalStudyMinutes).toBe(0);

    const result = useProgress.getState().importData(exported);
    expect(result.success).toBe(true);

    const data = useProgress.getState().data;
    expect(data.totalXp).toBe(75);
    expect(data.totalStudyMinutes).toBe(5);
    expect(data.nodes.m1?.completedAt).toBeTruthy();
    expect(data.streaks.current).toBe(1);
  });

  it("excludes OpenRouter API keys from export and import", () => {
    localStorage.setItem("learnapp_openrouter_key", "secret");
    localStorage.setItem("learnv2_openrouter_key", "future-secret");
    localStorage.setItem("learnapp_notes_v1", "{}");

    const exported = useProgress.getState().exportData();
    const parsed = JSON.parse(exported) as { keys: Record<string, string | null> };
    expect(parsed.keys.learnapp_openrouter_key).toBeUndefined();
    expect(parsed.keys.learnv2_openrouter_key).toBeUndefined();
    expect(parsed.keys.learnapp_notes_v1).toBe("{}");

    localStorage.removeItem("learnapp_openrouter_key");
    const result = useProgress.getState().importData(
      JSON.stringify({
        version: 2,
        keys: {
          learnapp_openrouter_key: "imported-secret",
          learnapp_notes_v1: "{}",
        },
      }),
    );

    expect(result.success).toBe(true);
    expect(localStorage.getItem("learnapp_openrouter_key")).toBeNull();
  });



  it("rejects unsupported import keys and clears managed storage on reset", () => {
    expect(useProgress.getState().importData(JSON.stringify({ version: 1, keys: {} })).success).toBe(false);
    expect(useProgress.getState().importData(JSON.stringify({ version: 2, keys: { not_app_key: "value" } })).success).toBe(false);

    localStorage.setItem("learnv2_bookmarks", "bookmarks");
    localStorage.setItem("learnapp_notes_v1", "notes");
    localStorage.setItem("unrelated", "keep");
    useProgress.getState().resetProgress();

    expect(localStorage.getItem("not_app_key")).toBeNull();
    expect(localStorage.getItem("learnv2_bookmarks")).toBeNull();
    expect(localStorage.getItem("learnapp_notes_v1")).toBeNull();
    expect(localStorage.getItem("unrelated")).toBe("keep");
  });

  it("importData rejects malformed JSON", () => {
    const result = useProgress.getState().importData("{not-json");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Failed to parse import file.");
  });

  it("importData rejects exports missing the keys object", () => {
    const result = useProgress.getState().importData(JSON.stringify({ version: 2 }));
    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid export format.");
  });

  it("importData rejects non-string storage values", () => {
    const result = useProgress.getState().importData(
      JSON.stringify({ version: 2, keys: { learnapp_notes_v1: 123 } }),
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid export format.");
  });

  it("importData removes keys when an imported value is null", () => {
    localStorage.setItem("learnapp_notes_v1", "notes");
    const result = useProgress.getState().importData(
      JSON.stringify({ version: 2, keys: { learnapp_notes_v1: null } }),
    );

    expect(result.success).toBe(true);
    expect(localStorage.getItem("learnapp_notes_v1")).toBeNull();
  });

});

describe("progress migrateAllFromV1", () => {
  const originalLocalStorage = globalThis.localStorage;

  beforeEach(() => {
    globalThis.localStorage = mockLocalStorage();
    useProgress.getState().resetProgress();
  });

  afterEach(() => {
    globalThis.localStorage = originalLocalStorage;
  });

  it("returns failure when no v1 data exists", () => {
    const result = useProgress.getState().migrateAllFromV1();
    expect(result.success).toBe(false);
    expect(result.message).toContain("No Learn-v1 data");
    expect(result.details.progress).toBe(false);
    expect(result.details.notesMerged).toBe(0);
    expect(result.details.takeawaysMerged).toBe(0);
    expect(result.details.themeMigrated).toBe(false);
    expect(result.details.resourceBookmarksMerged).toBe(0);
    expect(result.details.lessonBookmarksMerged).toBe(0);
  });

  it("imports progress XP, streak, and SRS from v1", () => {
    localStorage.setItem(
      V1_STORAGE_KEY,
      JSON.stringify({
        totalXp: 420,
        streaks: { current: 5, longest: 12, lastStudyDate: "2026-05-20" },
        spacedRepetition: {
          m1: {
            nodeId: "m1",
            scheduledReviews: [{ scheduledDate: "2026-05-22", completedDate: null }],
            currentIntervalIndex: 1,
          },
        },
      }),
    );

    const result = useProgress.getState().migrateAllFromV1();
    const data = useProgress.getState().data;

    expect(result.success).toBe(true);
    expect(result.details.progress).toBe(true);
    expect(result.details.srsDatesPreserved).toBe(true);
    expect(data.totalXp).toBe(420);
    expect(data.streaks.current).toBe(5);
    expect(data.spacedRepetition.m1.scheduledReviews[0].scheduledDate).toBe("2026-05-22");
  });

  it("merges legacy notes and theme in one migration call", () => {
    localStorage.setItem(
      V1_STORAGE_KEY,
      JSON.stringify({ totalXp: 100, streaks: { current: 1, longest: 1, lastStudyDate: null } }),
    );
    localStorage.setItem(
      "learnapp_notes_v1",
      JSON.stringify({ m3: { text: "legacy note", updatedAt: 5000 } }),
    );
    localStorage.setItem("learnapp_theme_v1", "light");

    const result = useProgress.getState().migrateAllFromV1();

    expect(result.success).toBe(true);
    expect(result.details.notesMerged).toBe(1);
    expect(result.details.themeMigrated).toBe(true);
    expect(result.message).toContain("progress");
    expect(result.message).toContain("legacy notes");
    expect(result.message).toContain("theme");

    const sessions = JSON.parse(localStorage.getItem("learnapp_note_sessions_v2")!);
    expect(sessions.m3.responses.legacy).toBe("legacy note");

    const prefs = JSON.parse(localStorage.getItem("learnv2_preferences")!);
    expect(prefs.state.theme).toBe("light");
    expect(localStorage.getItem("learnv2_migration_done_at")).toBeTruthy();
  });

  it("preserves existing v2 theme during full migration", () => {
    localStorage.setItem(
      V1_STORAGE_KEY,
      JSON.stringify({ totalXp: 100, streaks: { current: 1, longest: 1, lastStudyDate: null } }),
    );
    localStorage.setItem("learnapp_theme_v1", "light");
    localStorage.setItem("learnv2_preferences", JSON.stringify({ state: { theme: "dark" }, version: 0 }));

    const result = useProgress.getState().migrateAllFromV1();

    expect(result.success).toBe(true);
    expect(result.details.themeMigrated).toBe(false);
    const prefs = JSON.parse(localStorage.getItem("learnv2_preferences")!);
    expect(prefs.state.theme).toBe("dark");
  });

  it("merges v1 progress without wiping existing v2 progress", () => {
    useProgress.getState().completeNode("m1", 50);
    useProgress.getState().completeDailyChallenge("dc001", 25);

    localStorage.setItem(
      V1_STORAGE_KEY,
      JSON.stringify({
        totalXp: 420,
        nodes: {
          m2: {
            completedAt: "2026-05-20T00:00:00.000Z",
            startedAt: "2026-05-19T00:00:00.000Z",
            timeSpentMinutes: 15,
            quizScores: [80],
            quizHistory: [
              {
                score: 80,
                totalQuestions: 5,
                correctAnswers: 4,
                date: "2026-05-20",
                timeTakenSeconds: 120,
              },
            ],
          },
        },
        dailyChallenges: { "2026-05-20_dc999": true },
      }),
    );

    const result = useProgress.getState().importFromV1();
    const data = useProgress.getState().data;

    expect(result.success).toBe(true);
    expect(data.totalXp).toBe(420);
    expect(data.nodes.m1.completedAt).toBeTruthy();
    expect(data.nodes.m2.completedAt).toBe("2026-05-20T00:00:00.000Z");
    expect(data.dailyChallenges[`${getToday()}_dc001`]).toBe(true);
    expect(data.dailyChallenges["2026-05-20_dc999"]).toBe(true);
  });




});
