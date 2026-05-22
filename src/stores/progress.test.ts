import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getToday, useProgress, V1_STORAGE_KEY } from "@/stores/progress";

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
