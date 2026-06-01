import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SAT_PRETEST_DRAFT_1_ID } from "@/data/satPretestDraft1";
import { SAT_PRETEST_DRAFT_3_ID } from "@/data/satPretestDrafts";
import { snoozeNudge } from "@/lib/nudgeSnooze";
import {
  DRAFT_3_RETEST_HUB_SNOOZE_ID,
  getDraft3RetestNudge,
} from "@/lib/satDraft3Nudge";
import { SAT_PRETEST_STORAGE_KEY } from "@/lib/satPretest";

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

function seedCompletedDraft1(storage: Storage): void {
  storage.setItem(
    SAT_PRETEST_STORAGE_KEY,
    JSON.stringify({
      schemaVersion: 1,
      attempts: [
        {
          id: "d1",
          draftId: SAT_PRETEST_DRAFT_1_ID,
          status: "completed",
          startedAt: "2026-06-01T12:00:00.000Z",
          completedAt: "2026-06-01T12:30:00.000Z",
          questionOrder: ["q1"],
          currentIndex: 0,
          responses: {},
          scoreSummary: {
            totalQuestions: 24,
            correctAnswers: 18,
            pct: 75,
            sectionBreakdown: [],
            skillBreakdown: [],
            weakSkills: [],
            recommendedNodeIds: [],
            timeSpentSeconds: 900,
          },
        },
      ],
    }),
  );
}

describe("satDraft3Nudge", () => {
  let storage: Storage;

  beforeEach(() => {
    storage = mockStorage();
    vi.stubGlobal("localStorage", storage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns nudge when Draft 1 done and Draft 3 not started", () => {
    seedCompletedDraft1(storage);
    const nudge = getDraft3RetestNudge(storage);
    expect(nudge?.buttonLabel).toBe("Start Draft 3 retest");
    expect(nudge?.href).toContain("draft=draft-3");
  });

  it("returns null when Draft 3 completed", () => {
    seedCompletedDraft1(storage);
    const raw = JSON.parse(storage.getItem(SAT_PRETEST_STORAGE_KEY)!);
    raw.attempts.push({
      id: "d3",
      draftId: SAT_PRETEST_DRAFT_3_ID,
      status: "completed",
      startedAt: "2026-06-02T12:00:00.000Z",
      completedAt: "2026-06-02T12:30:00.000Z",
      questionOrder: ["q1"],
      currentIndex: 0,
      responses: {},
    });
    storage.setItem(SAT_PRETEST_STORAGE_KEY, JSON.stringify(raw));
    expect(getDraft3RetestNudge(storage)).toBeNull();
  });

  it("returns null when snoozed", () => {
    seedCompletedDraft1(storage);
    snoozeNudge(DRAFT_3_RETEST_HUB_SNOOZE_ID, 1, storage);
    expect(getDraft3RetestNudge(storage)).toBeNull();
  });
});
