import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  canAccessMentor,
  canAccessReview,
  clearMentorSession,
  countFilledResponses,
  getInitialNotesView,
  getSession,
  hasMinNotesContent,
  upsertSession,
} from "@/stores/noteSessions";

const STORAGE_KEY = "learnapp_note_sessions_v2";

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

describe("noteSessions flow helpers", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", mockLocalStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("countFilledResponses ignores blank lines", () => {
    expect(countFilledResponses({ a: "hello", b: "  ", c: "" })).toBe(1);
  });

  it("gates review and mentor by session progress", () => {
    expect(canAccessReview(null)).toBe(false);
    expect(canAccessMentor(null)).toBe(false);

    upsertSession({
      nodeId: "n1",
      subjectId: "math",
      responses: { "core-idea": "test" },
      review: null,
      mentorSession: null,
      tags: [],
      createdAt: 1,
      updatedAt: 1,
    });

    const session = getSession("n1")!;
    expect(hasMinNotesContent(session.responses)).toBe(true);
    expect(canAccessReview(session)).toBe(true);
    expect(canAccessMentor(session)).toBe(false);
  });

  it("getInitialNotesView resumes at review when notes exist but no review", () => {
    upsertSession({
      nodeId: "n2",
      subjectId: "math",
      responses: { a: "notes" },
      review: null,
      mentorSession: null,
      tags: [],
      createdAt: 1,
      updatedAt: 1,
    });
    expect(getInitialNotesView("n2")).toBe("review");
  });

  it("getInitialNotesView resumes mentor when quiz is in progress", () => {
    upsertSession({
      nodeId: "n3",
      subjectId: "math",
      responses: { a: "notes" },
      review: {
        score: 80,
        strengths: [],
        gaps: [],
        suggestions: [],
        deeperQuestions: [],
        generatedAt: 1,
        completedAt: null,
      },
      mentorSession: {
        questions: ["Q1", "Q2"],
        messages: [{ question: "Q1", answer: "A1", feedback: "Good", quality: "solid" }],
        startedAt: 1,
        completedAt: null,
      },
      tags: [],
      createdAt: 1,
      updatedAt: 1,
    });
    expect(getInitialNotesView("n3")).toBe("mentor");
  });

  it("getInitialNotesView resumes review when mentor quiz is completed", () => {
    upsertSession({
      nodeId: "n5",
      subjectId: "math",
      responses: { a: "notes" },
      review: {
        score: 80,
        strengths: [],
        gaps: [],
        suggestions: [],
        deeperQuestions: [],
        generatedAt: 1,
        completedAt: null,
      },
      mentorSession: {
        questions: ["Q1"],
        messages: [{ question: "Q1", answer: "A1", feedback: "Good", quality: "solid" }],
        startedAt: 1,
        completedAt: 2,
      },
      tags: [],
      createdAt: 1,
      updatedAt: 1,
    });

    expect(getInitialNotesView("n5")).toBe("review");
  });

  it("clearMentorSession removes mentor data", () => {
    upsertSession({
      nodeId: "n4",
      subjectId: "math",
      responses: { a: "notes" },
      review: {
        score: 70,
        strengths: [],
        gaps: [],
        suggestions: [],
        deeperQuestions: [],
        generatedAt: 1,
        completedAt: null,
      },
      mentorSession: {
        questions: ["Q1"],
        messages: [],
        startedAt: 1,
        completedAt: null,
      },
      tags: [],
      createdAt: 1,
      updatedAt: 1,
    });

    clearMentorSession("n4");
    expect(getSession("n4")?.mentorSession).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toContain('"mentorSession":null');
  });
});
