import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SAT_PRETEST_STORAGE_KEY } from "@/lib/satPretest";
import { runStoragePrune } from "@/lib/storagePrune";

function mockStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => map.set(k, v),
    removeItem: (k: string) => map.delete(k),
    clear: () => map.clear(),
    key: (i: number) => [...map.keys()][i] ?? null,
    get length() {
      return map.size;
    },
  } satisfies Storage;
}

describe("storagePrune", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-25T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("removes stale in-progress pretest attempts", () => {
    const storage = mockStorage();
    storage.setItem(
      SAT_PRETEST_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 1,
        attempts: [
          {
            id: "old",
            draftId: "draft-1",
            status: "in_progress",
            startedAt: "2026-05-10T00:00:00.000Z",
            questionOrder: ["q1"],
            currentIndex: 0,
            responses: {},
          },
        ],
      }),
    );
    const report = runStoragePrune(storage);
    expect(report.stalePretestAttemptsRemoved).toBe(1);
    const next = JSON.parse(storage.getItem(SAT_PRETEST_STORAGE_KEY)!);
    expect(next.attempts).toHaveLength(0);
  });
});
