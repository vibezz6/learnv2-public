import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { recordStudyActivity } from "@/lib/studyActivity";
import { getSatReadinessSignal, getSatWeeklyProgress } from "@/lib/satWeeklyProgress";

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

  describe("getSatReadinessSignal", () => {
    it("flags test week when the SAT is within 7 days", () => {
      const signal = getSatReadinessSignal("2026-06-03", storage); // 5 days out
      expect(signal.tone).toBe("crunch");
      expect(signal.label).toBe("Test week");
    });

    it("is 'building' with little recent activity and no imminent test", () => {
      const signal = getSatReadinessSignal(null, storage);
      expect(signal.tone).toBe("building");
    });

    it("reports a strong rhythm with many active days", () => {
      // 6 distinct active days in the last 7
      for (let d = 0; d < 6; d++) {
        recordStudyActivity(
          {
            type: "sat_practice_logged",
            at: Date.parse("2026-05-29T12:00:00.000Z") - d * 86_400_000,
          },
          storage,
        );
      }
      const signal = getSatReadinessSignal("2099-01-01", storage);
      expect(signal.tone).toBe("strong");
    });
  });
});
