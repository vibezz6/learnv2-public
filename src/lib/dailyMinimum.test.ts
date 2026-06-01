import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { recordStudyActivity, STUDY_ACTIVITY_STORAGE_KEY } from "@/lib/studyActivity";
import { getDailyMinimumStatus, isMinimumMet } from "@/lib/dailyMinimum";

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

describe("dailyMinimum", () => {
  let storage: Storage;

  beforeEach(() => {
    storage = mockStorage();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-29T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("is not met before any study", () => {
    const status = getDailyMinimumStatus("2026-05-29", storage);
    expect(status.met).toBe(false);
    expect(status.actionsToday).toBe(0);
    expect(status.remaining).toBe(1);
  });

  it("is met after one genuine study action", () => {
    recordStudyActivity({ type: "lesson_completed", nodeId: "st1" }, storage);
    expect(isMinimumMet("2026-05-29", storage)).toBe(true);
  });

  it("does not count just opening a lesson or the trivia challenge", () => {
    recordStudyActivity({ type: "lesson_started", nodeId: "st1" }, storage);
    recordStudyActivity({ type: "daily_challenge_done" }, storage);
    expect(isMinimumMet("2026-05-29", storage)).toBe(false);
  });

  it("counts logging an SAT mistake or official practice", () => {
    recordStudyActivity({ type: "sat_mistake_logged" }, storage);
    expect(isMinimumMet("2026-05-29", storage)).toBe(true);
  });

  it("ignores activity from other days", () => {
    recordStudyActivity({ type: "quiz_completed", nodeId: "st1" }, storage);
    expect(isMinimumMet("2026-05-28", storage)).toBe(false);
    expect(storage.getItem(STUDY_ACTIVITY_STORAGE_KEY)).toContain("quiz_completed");
  });
});
