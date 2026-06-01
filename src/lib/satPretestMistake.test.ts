import { describe, expect, it } from "vitest";
import type { SatPretestQuestion } from "@/lib/satPretest";
import { buildMistakeDraftFromResponse, listMissedPretestItems } from "@/lib/satPretestMistake";

const question: SatPretestQuestion = {
  id: "q1",
  draftId: "draft-1",
  section: "math",
  domain: "Algebra",
  skill: "Linear equations",
  difficulty: "easy",
  prompt: "Solve for x",
  choices: [
    { id: "a", text: "1" },
    { id: "b", text: "2" },
  ],
  correctChoiceId: "b",
  explanation: "x = 2",
  relatedNodeIds: ["st4"],
};

describe("satPretestMistake", () => {
  it("buildMistakeDraftFromResponse maps skill and nodeId", () => {
    const draft = buildMistakeDraftFromResponse(question, {
      questionId: "q1",
      selectedChoiceId: "a",
      rationale: "I divided wrong when isolating x.",
      answeredAt: "2026-05-24T12:00:00.000Z",
      timeSpentSeconds: 30,
    });

    expect(draft).toMatchObject({
      section: "math",
      category: "Linear equations",
      nodeId: "st4",
    });
    expect(draft.note).toContain("Diagnostic miss");
    expect(draft.note).toContain("I divided wrong");
  });

  it("listMissedPretestItems returns only incorrect responses", () => {
    const attempt = {
      id: "a1",
      draftId: "draft-1",
      status: "completed" as const,
      startedAt: "2026-05-24T12:00:00.000Z",
      completedAt: "2026-05-24T12:10:00.000Z",
      questionOrder: ["q1", "q2"],
      currentIndex: 1,
      responses: {
        q1: {
          questionId: "q1",
          selectedChoiceId: "a",
          rationale: "wrong",
          answeredAt: "2026-05-24T12:00:00.000Z",
          timeSpentSeconds: 10,
        },
        q2: {
          questionId: "q2",
          selectedChoiceId: "b",
          rationale: "right",
          answeredAt: "2026-05-24T12:01:00.000Z",
          timeSpentSeconds: 10,
        },
      },
    };

    const q2 = { ...question, id: "q2", correctChoiceId: "b" };
    const missed = listMissedPretestItems(attempt, [question, q2]);

    expect(missed).toHaveLength(1);
    expect(missed[0]?.question.id).toBe("q1");
  });
});
