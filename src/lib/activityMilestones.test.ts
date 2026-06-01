import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ACTIVITY_MILESTONES_STORAGE_KEY,
  detectNewActivityMilestones,
} from "@/lib/activityMilestones";
import { recordStudyActivity, STUDY_ACTIVITY_STORAGE_KEY } from "@/lib/studyActivity";

function mockStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
    clear: () => map.clear(),
    key: () => null,
    length: map.size,
  } satisfies Storage;
}

describe("activityMilestones", () => {
  let storage: Storage;
  const listeners = new Map<string, Set<EventListener>>();

  beforeEach(() => {
    storage = mockStorage();
    listeners.clear();
    vi.stubGlobal("window", {
      addEventListener: (type: string, listener: EventListener) => {
        if (!listeners.has(type)) listeners.set(type, new Set());
        listeners.get(type)!.add(listener);
      },
      removeEventListener: (type: string, listener: EventListener) => {
        listeners.get(type)?.delete(listener);
      },
      dispatchEvent: (event: Event) => {
        listeners.get(event.type)?.forEach((fn) => fn(event));
        return true;
      },
    });
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-25T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("awards first_sat_practice once", () => {
    recordStudyActivity({ type: "sat_practice_logged" }, storage);
    const first = detectNewActivityMilestones(storage);
    expect(first.some((m) => m.id === "first_sat_practice")).toBe(true);
    const second = detectNewActivityMilestones(storage);
    expect(second.some((m) => m.id === "first_sat_practice")).toBe(false);
    expect(storage.getItem(ACTIVITY_MILESTONES_STORAGE_KEY)).toContain("first_sat_practice");
  });

  it("awards week_10_actions when mix reaches 10 events", () => {
    for (let i = 0; i < 10; i++) {
      recordStudyActivity({ type: "review_done", nodeId: `n${i}` }, storage);
    }
    const earned = detectNewActivityMilestones(storage);
    expect(earned.some((m) => m.id === "week_10_actions")).toBe(true);
    expect(storage.getItem(STUDY_ACTIVITY_STORAGE_KEY)).toBeTruthy();
  });
});
