import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ACTIVITY_UPDATED_EVENT,
  buildWeekInReviewParagraph,
  getTodayStudySummary,
  getWeekActivityMix,
  listActivities,
  listActivitiesForDate,
  loadStudyActivities,
  recordStudyActivity,
  subscribeActivityUpdated,
  STUDY_ACTIVITY_STORAGE_KEY,
} from "@/lib/studyActivity";

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

describe("studyActivity", () => {
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

  it("records and persists an event", () => {
    const event = recordStudyActivity(
      { type: "lesson_completed", nodeId: "st1", subjectId: "sat-prep", meta: { xp: 50 } },
      storage,
    );
    expect(event.type).toBe("lesson_completed");
    expect(event.date).toBe("2026-05-25");
    expect(loadStudyActivities(storage)).toHaveLength(1);
  });

  it("lists activities for a date", () => {
    recordStudyActivity({ type: "notes_updated", nodeId: "m1", subjectId: "math" }, storage);
    vi.setSystemTime(new Date("2026-05-26T12:00:00.000Z"));
    recordStudyActivity({ type: "quiz_completed", nodeId: "m2", subjectId: "math" }, storage);

    expect(listActivitiesForDate("2026-05-25", storage)).toHaveLength(1);
    expect(listActivitiesForDate("2026-05-26", storage)).toHaveLength(1);
  });

  it("prepends newest first in listActivities", () => {
    recordStudyActivity({ type: "lesson_started", nodeId: "a" }, storage);
    vi.setSystemTime(new Date("2026-05-25T13:00:00.000Z"));
    recordStudyActivity({ type: "lesson_completed", nodeId: "b" }, storage);
    const list = listActivities(10, storage);
    expect(list[0]?.type).toBe("lesson_completed");
  });

  it("dispatches ACTIVITY_UPDATED_EVENT", () => {
    const handler = vi.fn();
    window.addEventListener(ACTIVITY_UPDATED_EVENT, handler);
    recordStudyActivity({ type: "review_done", nodeId: "x" }, storage);
    expect(handler).toHaveBeenCalled();
    window.removeEventListener(ACTIVITY_UPDATED_EVENT, handler);
  });

  it("stores under learnv2_activity_v1", () => {
    recordStudyActivity({ type: "timer_minutes", meta: { minutes: 25 } }, storage);
    expect(storage.getItem(STUDY_ACTIVITY_STORAGE_KEY)).toContain("timer_minutes");
  });

  it("getTodayStudySummary aggregates today", () => {
    recordStudyActivity({ type: "lesson_completed", nodeId: "a" }, storage);
    recordStudyActivity({ type: "quiz_completed", nodeId: "b" }, storage);
    const summary = getTodayStudySummary("2026-05-25", storage);
    expect(summary.eventCount).toBe(2);
    expect(summary.topTypes.length).toBeGreaterThan(0);
  });

  it("getWeekActivityMix counts last 7 days", () => {
    recordStudyActivity({ type: "review_done", nodeId: "x" }, storage);
    const mix = getWeekActivityMix(storage);
    expect(mix.totalEvents).toBe(1);
    expect(mix.byType.review_done).toBe(1);
  });

  it("buildWeekInReviewParagraph summarizes an active week", () => {
    recordStudyActivity({ type: "lesson_completed", nodeId: "a" }, storage);
    recordStudyActivity({ type: "quiz_completed", nodeId: "b" }, storage);
    const text = buildWeekInReviewParagraph({ "2026-05-25": 20 }, storage);
    expect(text).toContain("This week");
    expect(text).toContain("20m on the timer");
  });

  it("buildWeekInReviewParagraph handles empty week", () => {
    expect(buildWeekInReviewParagraph({}, storage)).toContain("No study logged");
  });

  it("subscribeActivityUpdated fires on record", () => {
    const handler = vi.fn();
    const unsubscribe = subscribeActivityUpdated(handler);
    recordStudyActivity({ type: "daily_challenge_done" }, storage);
    expect(handler).toHaveBeenCalled();
    unsubscribe();
  });
});
