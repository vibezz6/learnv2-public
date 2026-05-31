import { describe, expect, it, beforeEach } from "vitest";
import {
  deprioritizeRecent,
  getRecentQuestionIds,
  pruneSatQuestionHistory,
  recordSatQuestionsSeen,
  SAT_QUESTION_HISTORY_KEY,
} from "@/lib/satQuestionHistory";

describe("satQuestionHistory", () => {
  let storage: Storage;

  beforeEach(() => {
    storage = {
      store: new Map<string, string>(),
      get length() {
        return this.store.size;
      },
      clear() {
        this.store.clear();
      },
      getItem(key: string) {
        return this.store.get(key) ?? null;
      },
      setItem(key: string, value: string) {
        this.store.set(key, value);
      },
      removeItem(key: string) {
        this.store.delete(key);
      },
      key() {
        return null;
      },
    } as Storage;
  });

  it("records and returns recent question ids", () => {
    recordSatQuestionsSeen(["q1", "q2"], { skillId: "linear-equations", storage });
    const recent = getRecentQuestionIds({ skillId: "linear-equations", storage });
    expect(recent.has("q1")).toBe(true);
    expect(recent.has("q2")).toBe(true);
  });

  it("prune drops entries older than max age", () => {
    const now = Date.now();
    storage.setItem(
      SAT_QUESTION_HISTORY_KEY,
      JSON.stringify({
        schemaVersion: 1,
        seen: [{ questionId: "old", at: now - 20 * 24 * 60 * 60 * 1000 }],
      }),
    );
    pruneSatQuestionHistory(storage, 14 * 24 * 60 * 60 * 1000, now);
    expect(getRecentQuestionIds({ storage, now }).size).toBe(0);
  });

  it("deprioritizeRecent prefers fresh ids", () => {
    const items = [
      { id: "a", score: 10 },
      { id: "b", score: 9 },
      { id: "c", score: 8 },
      { id: "d", score: 7 },
      { id: "e", score: 6 },
    ];
    const recent = new Set(["a", "b", "c"]);
    const picked = deprioritizeRecent(items, (i) => i.id, recent, 3);
    expect(picked.map((i) => i.id)).toEqual(["d", "e", "a"]);
  });
});
