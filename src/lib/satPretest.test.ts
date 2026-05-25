import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  SAT_PRETEST_STORAGE_KEY,
  buildDraft2FromGaps,
  buildSatPretestExportPayload,
  buildSatPretestScoreSummary,
  compareDraftScores,
  completeSatPretestAttempt,
  buildCursorAnalysisPrompt,
  formatSatPretestMarkdown,
  getSatPretestCursorResponseTemplate,
  getActiveSatPretestAttempt,
  getLatestCompletedSatPretestAttempt,
  listSatPretestAttempts,
  loadSatPretestState,
  parseSatPretestDraft2ImportJson,
  recordSatPretestResponse,
  clearAllSatPretestData,
  resetSatPretestDraft,
  startSatPretestAttempt,
  type SatPretestQuestion,
} from "@/lib/satPretest";

function mockLocalStorage(): Storage {
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
  };
}

const questions: SatPretestQuestion[] = [
  {
    id: "sp1",
    draftId: "draft-1",
    section: "math",
    domain: "Algebra",
    skill: "Linear equations",
    difficulty: "easy",
    prompt: "Solve 2x + 3 = 11.",
    choices: [
      { id: "a", text: "3" },
      { id: "b", text: "4" },
      { id: "c", text: "7" },
      { id: "d", text: "8" },
    ],
    correctChoiceId: "b",
    explanation: "Subtract 3, then divide by 2.",
    relatedNodeIds: ["st4", "st17"],
  },
  {
    id: "sp2",
    draftId: "draft-1",
    section: "rw",
    domain: "Standard English Conventions",
    skill: "Sentence boundaries",
    difficulty: "medium",
    prompt: "Choose the option that correctly joins the clauses.",
    choices: [
      { id: "a", text: "however" },
      { id: "b", text: "and" },
      { id: "c", text: "; however," },
      { id: "d", text: "because" },
    ],
    correctChoiceId: "c",
    explanation: "A semicolon can join two independent clauses before a transition.",
    relatedNodeIds: ["st27"],
  },
];

describe("satPretest", () => {
  let storage: Storage;

  beforeEach(() => {
    storage = mockLocalStorage();
    vi.stubGlobal("localStorage", storage);
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-24T18:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("starts an in-progress attempt under the learnv2 key", () => {
    const attempt = startSatPretestAttempt("draft-1", questions, storage)!;

    expect(attempt).toMatchObject({
      draftId: "draft-1",
      status: "in_progress",
      startedAt: "2026-05-24T18:00:00.000Z",
      questionOrder: ["sp1", "sp2"],
      currentIndex: 0,
      responses: {},
    });
    expect(storage.getItem(SAT_PRETEST_STORAGE_KEY)).toContain("draft-1");
    expect(getActiveSatPretestAttempt("draft-1", storage)?.id).toBe(attempt.id);
  });

  it("records trimmed rationales and rejects empty answers", () => {
    const attempt = startSatPretestAttempt("draft-1", questions, storage)!;

    expect(
      recordSatPretestResponse(
        {
          attemptId: attempt.id,
          questionId: "sp1",
          selectedChoiceId: "b",
          rationale: "   ",
          timeSpentSeconds: 12,
        },
        questions,
        storage,
      ),
    ).toBeNull();

    const updated = recordSatPretestResponse(
      {
        attemptId: attempt.id,
        questionId: "sp1",
        selectedChoiceId: "b",
        rationale: "  isolate x first  ",
        timeSpentSeconds: 12.4,
        confidence: "high",
      },
      questions,
      storage,
    )!;

    expect(updated.responses.sp1).toMatchObject({
      selectedChoiceId: "b",
      rationale: "isolate x first",
      timeSpentSeconds: 12,
      confidence: "high",
    });
  });

  it("completes only after every question has a response", () => {
    const attempt = startSatPretestAttempt("draft-1", questions, storage)!;
    recordSatPretestResponse(
      {
        attemptId: attempt.id,
        questionId: "sp1",
        selectedChoiceId: "b",
        rationale: "subtract 3 and divide",
        timeSpentSeconds: 10,
      },
      questions,
      storage,
    );

    expect(completeSatPretestAttempt(attempt.id, questions, storage)).toBeNull();

    recordSatPretestResponse(
      {
        attemptId: attempt.id,
        questionId: "sp2",
        selectedChoiceId: "a",
        rationale: "I thought however connects the ideas",
        timeSpentSeconds: 20,
      },
      questions,
      storage,
    );

    const completed = completeSatPretestAttempt(attempt.id, questions, storage)!;
    expect(completed.status).toBe("completed");
    expect(completed.completedAt).toBe("2026-05-24T18:00:00.000Z");
    expect(completed.scoreSummary).toMatchObject({
      totalQuestions: 2,
      correctAnswers: 1,
      pct: 50,
      recommendedNodeIds: ["st27"],
      timeSpentSeconds: 30,
    });
    expect(getLatestCompletedSatPretestAttempt("draft-1", storage)?.id).toBe(attempt.id);
  });

  it("builds section and skill breakdowns", () => {
    const attempt = {
      id: "attempt",
      draftId: "draft-1",
      status: "in_progress" as const,
      startedAt: "2026-05-24T18:00:00.000Z",
      questionOrder: ["sp1", "sp2"],
      currentIndex: 1,
      responses: {
        sp1: {
          questionId: "sp1",
          selectedChoiceId: "b",
          rationale: "isolate x",
          answeredAt: "2026-05-24T18:01:00.000Z",
          timeSpentSeconds: 15,
        },
        sp2: {
          questionId: "sp2",
          selectedChoiceId: "a",
          rationale: "transition seemed right",
          answeredAt: "2026-05-24T18:02:00.000Z",
          timeSpentSeconds: 30,
        },
      },
    };

    const summary = buildSatPretestScoreSummary(attempt, questions);
    expect(summary.sectionBreakdown).toEqual([
      { key: "math", label: "Math", correct: 1, total: 1, pct: 100 },
      { key: "rw", label: "Reading & Writing", correct: 0, total: 1, pct: 0 },
    ]);
    expect(summary.weakSkills).toEqual([
      { key: "Sentence boundaries", label: "Sentence boundaries", correct: 0, total: 1, pct: 0 },
    ]);
  });

  it("builds export payload and markdown for completed attempts", () => {
    const attempt = startSatPretestAttempt("draft-1", questions, storage)!;
    recordSatPretestResponse(
      {
        attemptId: attempt.id,
        questionId: "sp1",
        selectedChoiceId: "b",
        rationale: "subtract 3 and divide by 2",
        timeSpentSeconds: 10,
      },
      questions,
      storage,
    );
    recordSatPretestResponse(
      {
        attemptId: attempt.id,
        questionId: "sp2",
        selectedChoiceId: "a",
        rationale: "short",
        timeSpentSeconds: 8,
      },
      questions,
      storage,
    );
    const completed = completeSatPretestAttempt(attempt.id, questions, storage)!;

    const payload = buildSatPretestExportPayload(completed, questions, "2.0.23");
    expect(payload).toMatchObject({
      schemaVersion: 1,
      appVersion: "2.0.23",
      draftId: "draft-1",
      scoring: { totalQuestions: 2, correctAnswers: 1, pct: 50 },
    });
    expect(payload?.responses).toHaveLength(2);
    expect(payload?.recommendedNextSteps.length).toBeGreaterThan(0);

    const markdown = formatSatPretestMarkdown(completed, questions, "2.0.23");
    expect(markdown).toContain("# Learn v2 — SAT Pretest Draft 1 Export");
    expect(markdown).toContain("## Requested Cursor task");
    expect(markdown).toContain("Sentence boundaries");
    expect(markdown).toContain("sat-pretest-cursor-template.json");

    const prompt = buildCursorAnalysisPrompt(completed, questions, "2.0.30");
    expect(prompt).toContain("Cursor task");
    expect(prompt).toContain("lessonPlan");
    expect(prompt).toContain("Sentence boundaries");
    expect(getSatPretestCursorResponseTemplate().schemaVersion).toBe(1);
  });

  it("returns null export for incomplete attempts", () => {
    const attempt = startSatPretestAttempt("draft-1", questions, storage)!;
    expect(buildSatPretestExportPayload(attempt, questions, "2.0.23")).toBeNull();
    expect(formatSatPretestMarkdown(attempt, questions, "2.0.23")).toBeNull();
  });

  it("builds Draft 2 from Draft 1 weak skills", () => {
    const attempt = startSatPretestAttempt("draft-1", questions, storage)!;
    recordSatPretestResponse(
      {
        attemptId: attempt.id,
        questionId: "sp1",
        selectedChoiceId: "a",
        rationale: "guessed wrong",
        timeSpentSeconds: 5,
      },
      questions,
      storage,
    );
    recordSatPretestResponse(
      {
        attemptId: attempt.id,
        questionId: "sp2",
        selectedChoiceId: "c",
        rationale: "semicolon join",
        timeSpentSeconds: 5,
      },
      questions,
      storage,
    );
    const completed = completeSatPretestAttempt(attempt.id, questions, storage)!;

    const draft2Pool: SatPretestQuestion[] = [
      {
        id: "d2-linear",
        draftId: "draft-2",
        section: "math",
        domain: "Algebra",
        skill: "Linear equations",
        difficulty: "easy",
        prompt: "follow-up",
        choices: [
          { id: "a", text: "1" },
          { id: "b", text: "2" },
        ],
        correctChoiceId: "a",
        explanation: "x",
      },
      {
        id: "d2-rw",
        draftId: "draft-2",
        section: "rw",
        domain: "Grammar",
        skill: "Sentence boundaries",
        difficulty: "easy",
        prompt: "follow-up rw",
        choices: [
          { id: "a", text: "1" },
          { id: "b", text: "2" },
        ],
        correctChoiceId: "a",
        explanation: "x",
      },
    ];

    const built = buildDraft2FromGaps(completed, draft2Pool, 4)!;
    expect(built.questions.map((q) => q.id)).toEqual(["d2-linear", "d2-rw"]);
    expect(built.questionTargets[0].reason).toContain("Linear equations");
  });

  it("parses Draft 2 import JSON", () => {
    const result = parseSatPretestDraft2ImportJson(
      JSON.stringify({
        questions: [
          {
            id: "import-1",
            draftId: "draft-2",
            section: "math",
            domain: "Algebra",
            skill: "Linear equations",
            difficulty: "easy",
            prompt: "Imported",
            choices: [
              { id: "a", text: "1" },
              { id: "b", text: "2" },
            ],
            correctChoiceId: "a",
            explanation: "ok",
          },
        ],
      }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.questions).toHaveLength(1);
  });

  it("compares skill scores between drafts", () => {
    const draft1 = {
      id: "d1",
      draftId: "draft-1",
      status: "completed" as const,
      startedAt: "2026-05-24T18:00:00.000Z",
      questionOrder: ["sp1", "sp2"],
      currentIndex: 1,
      responses: {},
      scoreSummary: buildSatPretestScoreSummary(
        {
          id: "d1",
          draftId: "draft-1",
          status: "in_progress",
          startedAt: "2026-05-24T18:00:00.000Z",
          questionOrder: ["sp1", "sp2"],
          currentIndex: 1,
          responses: {
            sp1: {
              questionId: "sp1",
              selectedChoiceId: "b",
              rationale: "ok",
              answeredAt: "2026-05-24T18:00:00.000Z",
              timeSpentSeconds: 1,
            },
            sp2: {
              questionId: "sp2",
              selectedChoiceId: "a",
              rationale: "bad",
              answeredAt: "2026-05-24T18:00:00.000Z",
              timeSpentSeconds: 1,
            },
          },
        },
        questions,
      ),
    };
    const draft2 = { ...draft1, id: "d2", draftId: "draft-2" };
    const rows = compareDraftScores(draft1, draft2);
    expect(rows.some((row) => row.skill === "Linear equations")).toBe(true);
  });

  it("ignores corrupt stored data and can reset a draft", () => {
    storage.setItem(SAT_PRETEST_STORAGE_KEY, "{bad json");
    expect(loadSatPretestState(storage).attempts).toEqual([]);

    startSatPretestAttempt("draft-1", questions, storage);
    startSatPretestAttempt("draft-2", questions, storage);
    resetSatPretestDraft("draft-1", storage);

    expect(listSatPretestAttempts(storage).map((attempt) => attempt.draftId)).toEqual(["draft-2"]);
  });

  it("clearAllSatPretestData removes every attempt", () => {
    startSatPretestAttempt("draft-1", questions, storage);
    startSatPretestAttempt("draft-2", questions, storage);
    clearAllSatPretestData(storage);
    expect(storage.getItem(SAT_PRETEST_STORAGE_KEY)).toBeNull();
    expect(listSatPretestAttempts(storage)).toEqual([]);
  });
});
