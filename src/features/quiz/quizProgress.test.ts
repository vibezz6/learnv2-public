import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearQuizProgress,
  loadQuizProgress,
  quizProgressKey,
  restoreQuizSession,
  saveQuizProgress,
} from "@/features/quiz/quizProgress";

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

describe("quizProgress", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", mockLocalStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("saves and restores in-progress quiz state", () => {
    saveQuizProgress("node-a", {
      current: 1,
      answers: [0, null, 2],
      startTime: 1_700_000_000_000,
    });

    const key = quizProgressKey("node-a");
    expect(key).toBe("learnapp_quiz_progress_v1_node-a");
    expect(loadQuizProgress("node-a", 3)).toMatchObject({
      current: 1,
      answers: [0, null, 2],
      startTime: 1_700_000_000_000,
    });

    const session = restoreQuizSession("node-a", 3);
    expect(session.current).toBe(1);
    expect(session.answered).toBe(false);
    expect(session.selected).toBeNull();
    expect(session.startTime).toBe(1_700_000_000_000);
  });

  it("ignores stale or expired progress", () => {
    localStorage.setItem(
      quizProgressKey("node-b"),
      JSON.stringify({
        current: 2,
        answers: [0, 1],
        timestamp: Date.now() - 25 * 60 * 60 * 1000,
      }),
    );
    expect(loadQuizProgress("node-b", 2)).toBeNull();

    saveQuizProgress("node-b", { current: 0, answers: [null, null, null], startTime: Date.now() });
    expect(loadQuizProgress("node-b", 2)).toBeNull();

    clearQuizProgress("node-b");
    expect(loadQuizProgress("node-b", 2)).toBeNull();
  });
});
