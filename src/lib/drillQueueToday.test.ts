import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { addCollege } from "./colleges";
import {
  DRILL_QUEUE_TODAY_SNOOZE_ID,
  isCollegeBlockingWeek,
  shouldShowDrillQueueTodayCard,
} from "./drillQueueToday";
import { snoozeNudge } from "./nudgeSnooze";
import { SAT_MISTAKE_LOG_KEY } from "./satMistakeLog";

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

function daysFromNow(days: number, now = new Date()): string {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

describe("drillQueueToday", () => {
  let storage: Storage;
  const now = new Date("2026-06-01T12:00:00Z").getTime();

  beforeEach(() => {
    storage = mockStorage();
    vi.stubGlobal("localStorage", storage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("hides when college blocks within 7 days", () => {
    addCollege("MIT", daysFromNow(3, new Date(now)), undefined, storage);
    expect(isCollegeBlockingWeek(storage, new Date(now))).toBe(true);
    expect(shouldShowDrillQueueTodayCard(storage, now)).toBe(false);
  });

  it("hides when snoozed", () => {
    storage.setItem(
      SAT_MISTAKE_LOG_KEY,
      JSON.stringify([
        {
          id: "m1",
          date: "2026-06-01",
          section: "math",
          category: "Linear equations",
          skillId: "linear-equations",
          note: "",
          createdAt: now - 1000,
        },
        {
          id: "m2",
          date: "2026-06-01",
          section: "math",
          category: "Linear equations",
          skillId: "linear-equations",
          note: "",
          createdAt: now - 2000,
        },
        {
          id: "m3",
          date: "2026-06-01",
          section: "math",
          category: "Linear equations",
          skillId: "linear-equations",
          note: "",
          createdAt: now - 3000,
        },
      ]),
    );
    snoozeNudge(DRILL_QUEUE_TODAY_SNOOZE_ID, 1, storage);
    expect(shouldShowDrillQueueTodayCard(storage, now)).toBe(false);
  });

  it("shows when queue top has 3+ misses within 14 days and no college block", () => {
    storage.setItem(
      SAT_MISTAKE_LOG_KEY,
      JSON.stringify([
        {
          id: "m1",
          date: "2026-06-01",
          section: "math",
          category: "Linear equations",
          skillId: "linear-equations",
          note: "",
          createdAt: now - 1000,
        },
        {
          id: "m2",
          date: "2026-06-01",
          section: "math",
          category: "Linear equations",
          skillId: "linear-equations",
          note: "",
          createdAt: now - 2000,
        },
        {
          id: "m3",
          date: "2026-06-01",
          section: "math",
          category: "Linear equations",
          skillId: "linear-equations",
          note: "",
          createdAt: now - 3000,
        },
      ]),
    );
    expect(shouldShowDrillQueueTodayCard(storage, now)).toBe(true);
  });

  it("hides when top skill is stale beyond 14 days", () => {
    const stale = now - 15 * 24 * 60 * 60 * 1000;
    storage.setItem(
      SAT_MISTAKE_LOG_KEY,
      JSON.stringify([
        {
          id: "m1",
          date: "2026-05-01",
          section: "math",
          category: "Linear equations",
          skillId: "linear-equations",
          note: "",
          createdAt: stale,
        },
        {
          id: "m2",
          date: "2026-05-01",
          section: "math",
          category: "Linear equations",
          skillId: "linear-equations",
          note: "",
          createdAt: stale - 1000,
        },
        {
          id: "m3",
          date: "2026-05-01",
          section: "math",
          category: "Linear equations",
          skillId: "linear-equations",
          note: "",
          createdAt: stale - 2000,
        },
      ]),
    );
    expect(shouldShowDrillQueueTodayCard(storage, now)).toBe(false);
  });
});
