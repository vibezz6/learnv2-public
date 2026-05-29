import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { recordStudyActivity } from "@/lib/studyActivity";
import { getSatWeeklyProgress } from "@/lib/satWeeklyProgress";

function mapStorage(): Storage {
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

describe("satWeeklyProgress", () => {
  let storage: Storage;

  beforeEach(() => {
    storage = mapStorage();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-29T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("has no signal on a fresh slate", () => {
    expect(getSatWeeklyProgress(storage).hasAnySignal).toBe(false);
  });

  it("counts SAT lessons (by subjectId), Daily 5s, mistakes and practice in the last 7 days", () => {
    recordStudyActivity({ type: "lesson_completed", nodeId: "st1", subjectId: "sat-prep" }, storage);
    recordStudyActivity({ type: "lesson_completed", nodeId: "m1", subjectId: "math" }, storage); // not SAT
    recordStudyActivity({ type: "quiz_completed", nodeId: "sat-daily-2026-05-29", subjectId: "sat-prep" }, storage);
    recordStudyActivity({ type: "sat_mistake_logged" }, storage);
    recordStudyActivity({ type: "sat_practice_logged" }, storage);

    const p = getSatWeeklyProgress(storage);
    expect(p.satLessons).toBe(1);
    expect(p.dailyQuizzes).toBe(1);
    expect(p.mistakesLogged).toBe(1);
    expect(p.practiceSessions).toBe(1);
    expect(p.activeDays).toBe(1);
    expect(p.hasAnySignal).toBe(true);
  });

  it("ignores activity older than 7 days", () => {
    recordStudyActivity(
      { type: "sat_mistake_logged", at: Date.parse("2026-05-10T12:00:00.000Z") },
      storage,
    );
    expect(getSatWeeklyProgress(storage).mistakesLogged).toBe(0);
  });
});
