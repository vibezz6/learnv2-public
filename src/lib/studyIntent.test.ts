import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  loadStudyIntent,
  setStudyIntent,
  STUDY_INTENT_STORAGE_KEY,
  getStudyIntentSubtitle,
} from "@/lib/studyIntent";

function mockStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => map.set(k, v),
    removeItem: (k: string) => map.delete(k),
    clear: () => map.clear(),
    key: () => null,
    length: map.size,
  } satisfies Storage;
}

describe("studyIntent", () => {
  let storage: Storage;

  beforeEach(() => {
    storage = mockStorage();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-25T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("persists focus for today", () => {
    setStudyIntent("sat", storage);
    expect(loadStudyIntent(storage).focus).toBe("sat");
    expect(storage.getItem(STUDY_INTENT_STORAGE_KEY)).toContain("sat");
  });

  it("resets to default on a new UTC day", () => {
    setStudyIntent("college", storage);
    vi.setSystemTime(new Date("2026-05-26T12:00:00.000Z"));
    expect(loadStudyIntent(storage).focus).toBe("default");
  });

  it("returns subtitle for SAT focus", () => {
    expect(getStudyIntentSubtitle("sat")).toContain("SAT");
  });
});
