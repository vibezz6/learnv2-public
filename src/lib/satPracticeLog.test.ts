import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  SAT_PRACTICE_LOG_KEY,
  addPracticeSession,
  getLatestPracticeSession,
  listPracticeSessions,
} from "@/lib/satPracticeLog";

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

describe("satPracticeLog", () => {
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

  it("logs and lists practice sessions newest-first", () => {
    const session = addPracticeSession(
      {
        section: "math",
        source: "bluebook",
        note: "Module 2 timed",
        missesLogged: false,
      },
      storage,
    );

    expect(session).toMatchObject({
      section: "math",
      source: "bluebook",
      missesLogged: false,
      date: "2026-05-24",
    });
    expect(getLatestPracticeSession(storage)?.label).toContain("Bluebook");
    expect(listPracticeSessions(storage)).toHaveLength(1);
    expect(JSON.parse(storage.getItem(SAT_PRACTICE_LOG_KEY)!).length).toBe(1);
  });
});
