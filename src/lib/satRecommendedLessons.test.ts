import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Subject, SkillNode } from "@/curriculum/types";
import { satPretestDraft1Questions } from "@/data/satPretestDraft1";
import {
  completeSatPretestAttempt,
  recordSatPretestResponse,
  startSatPretestAttempt,
} from "@/lib/satPretest";
import { getSatRecommendedLessons } from "@/lib/satRecommendedLessons";

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

function miniSatSubject(nodeIds: string[]): Subject {
  return {
    id: "sat-prep",
    name: "SAT Prep",
    description: "",
    color: "#000",
    icon: "graduation-cap",
    nodes: nodeIds.map(
      (id): SkillNode => ({
        id,
        name: `Lesson ${id}`,
        description: "",
        xpValue: 10,
        parentIds: [],
        estimatedMinutes: 10,
        resources: [],
        keyConcepts: [],
        whyItMatters: "",
        practiceProblems: [],
        difficulty: "beginner",
      }),
    ),
  };
}

describe("getSatRecommendedLessons", () => {
  let storage: Storage;

  beforeEach(() => {
    storage = mockLocalStorage();
    vi.stubGlobal("localStorage", storage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("suggests track-next lesson when Draft 1 is not complete", () => {
    const subjects = [miniSatSubject(["st1", "st4"])];
    const getNodeStatus = () => "available" as const;

    const plan = getSatRecommendedLessons(subjects, getNodeStatus);

    expect(plan.source).toBe("track_next");
    expect(plan.draft1Complete).toBe(false);
    expect(plan.lessons[0]?.nodeId).toBe("st1");
  });

  it("suggests gap-linked lessons after Draft 1 misses", () => {
    const subjects = [miniSatSubject(["st4", "st17", "st5"])];
    const getNodeStatus = () => "available" as const;

    const attempt = startSatPretestAttempt("draft-1", satPretestDraft1Questions, storage);
    expect(attempt).not.toBeNull();

    const first = satPretestDraft1Questions[0];
    recordSatPretestResponse(
      {
        attemptId: attempt!.id,
        questionId: first.id,
        selectedChoiceId: first.choices[0].id,
        rationale: "I guessed wrong on purpose for the test.",
        timeSpentSeconds: 30,
      },
      satPretestDraft1Questions,
      storage,
    );

    for (let i = 1; i < satPretestDraft1Questions.length; i++) {
      const q = satPretestDraft1Questions[i];
      recordSatPretestResponse(
        {
          attemptId: attempt!.id,
          questionId: q.id,
          selectedChoiceId: q.correctChoiceId,
          rationale: "Checked the math and ruled out traps before picking.",
          timeSpentSeconds: 20,
        },
        satPretestDraft1Questions,
        storage,
      );
    }

    completeSatPretestAttempt(attempt!.id, satPretestDraft1Questions, storage);

    const plan = getSatRecommendedLessons(subjects, getNodeStatus);

    expect(plan.source).toBe("pretest_gaps");
    expect(plan.draft1Complete).toBe(true);
    expect(plan.lessons.some((lesson) => lesson.nodeId === "st4")).toBe(true);
  });
});
