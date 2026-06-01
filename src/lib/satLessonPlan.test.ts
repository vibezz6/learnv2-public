import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  applySatLessonPlanImport,
  clearSatLessonPlan,
  loadSatLessonPlan,
  SAT_LESSON_PLAN_STORAGE_KEY,
} from "@/lib/satLessonPlan";

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

describe("satLessonPlan", () => {
  let storage: Storage;

  beforeEach(() => {
    storage = mockLocalStorage();
    vi.stubGlobal("localStorage", storage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("saves and loads lesson plan entries by priority", () => {
    applySatLessonPlanImport(
      [
        { nodeId: "st10", reason: "Grammar gap", priority: 2 },
        { nodeId: "st4", reason: "Linear equations", priority: 1 },
      ],
      { sourceAttemptId: "attempt-1", notes: "From Cursor" },
      storage,
    );

    const plan = loadSatLessonPlan(storage);
    expect(plan?.entries.map((e) => e.nodeId)).toEqual(["st4", "st10"]);
    expect(plan?.notes).toBe("From Cursor");
    expect(storage.getItem(SAT_LESSON_PLAN_STORAGE_KEY)).toBeTruthy();
  });

  it("clearSatLessonPlan removes stored plan", () => {
    applySatLessonPlanImport([{ nodeId: "st1", reason: "Start here" }], {}, storage);
    clearSatLessonPlan(storage);
    expect(loadSatLessonPlan(storage)).toBeNull();
  });
});
