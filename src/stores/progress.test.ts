import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Subject } from "@/curriculum/types";
import { getToday, useProgress, V1_STORAGE_KEY, V2_STORAGE_KEY } from "@/stores/progress";

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
    expect(parsed.version).toBe(2);
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
    localStorage.setItem("learnv2_preferences", JSON.stringify({ state: { theme: "dark" }, version: 0 }));

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
  });
});
