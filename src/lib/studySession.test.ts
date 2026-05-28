import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  completeStudySessionStep,
  loadStudySession,
  startStudySession,
} from "@/lib/studySession";
import type { StudyBlockPlan } from "@/lib/studyBlockPlan";

function mockStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => map.set(k, v),
    removeItem: (k) => map.delete(k),
    key: (i) => [...map.keys()][i] ?? null,
  };
}

const plan: StudyBlockPlan = {
  title: "20-minute study block",
  rationale: "Study now.",
  totalMinutes: 20,
  primaryHref: "/subjects/sat-prep",
  primaryLabel: "Start",
  steps: [
    { id: "a", title: "Step A", detail: "", href: "/a", minutes: 15, source: "sat", ctaLabel: "A" },
    { id: "b", title: "Step B", detail: "", href: "/b", minutes: 5, source: "sat", ctaLabel: "B" },
  ],
};

describe("studySession", () => {
  let storage: Storage;

  beforeEach(() => {
    storage = mockStorage();
    vi.stubGlobal("localStorage", storage);
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-28T12:00:00.000Z"));
  });

  it("starts and completes a session", () => {
    const session = startStudySession(plan, storage);
    expect(session.activeStepId).toBe("a");
    expect(loadStudySession(storage)?.steps).toHaveLength(2);

    const afterFirst = completeStudySessionStep("a", storage);
    expect(afterFirst?.activeStepId).toBe("b");
    expect(afterFirst?.completedAt).toBeUndefined();

    const afterSecond = completeStudySessionStep("b", storage);
    expect(afterSecond?.completedAt).toBeTypeOf("number");
  });
});
