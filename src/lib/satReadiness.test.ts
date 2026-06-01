import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getReadinessNudge,
  getTodayReadinessEntry,
  logSatReadiness,
  SAT_READINESS_STORAGE_KEY,
} from "@/lib/satReadiness";

function mockLocalStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    key: (i) => [...map.keys()][i] ?? null,
    getItem: (k) => map.get(k) ?? null,
    removeItem: (k) => map.delete(k),
    setItem: (k, v) => map.set(k, v),
  };
}

describe("satReadiness", () => {
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

  it("logs and reads today entry", () => {
    logSatReadiness({ rating: 3, bedTime: "23:00", wakeTime: "06:30" }, storage);
    const today = getTodayReadinessEntry(storage);
    expect(today?.rating).toBe(3);
    expect(storage.getItem(SAT_READINESS_STORAGE_KEY)).toBeTruthy();
  });

  it("getReadinessNudge prompts when no entry today", () => {
    expect(getReadinessNudge(storage)).toContain("Log how rested");
  });

  it("getReadinessNudge warns on low rating", () => {
    logSatReadiness({ rating: 1 }, storage);
    expect(getReadinessNudge(storage)).toContain("bad-day minimum");
  });
});
