import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SkillNode, Subject } from "@/curriculum/types";
import { ROUTES } from "@/app/navigation";
import { saveCollegeChecklist } from "@/lib/collegeChecklist";
import { addCollege } from "@/lib/colleges";
import { setStudyIntent } from "@/lib/studyIntent";
import { buildWeekPlan } from "@/lib/weekPlan";

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

function node(id: string): SkillNode {
  return {
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
  };
}

describe("weekPlan", () => {
  let storage: Storage;

  beforeEach(() => {
    storage = mockLocalStorage();
    vi.stubGlobal("localStorage", storage);
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-24T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("merges college deadlines with track lessons without review rows", () => {
    saveCollegeChecklist(
      {
        completed: {},
        customItems: [
          {
            id: "c1",
            title: "Submit FAFSA",
            completed: false,
            dueDate: "2026-05-25",
            createdAt: 1,
          },
        ],
      },
      storage,
    );

    const subjects: Subject[] = [
      {
        id: "sat-prep",
        name: "SAT Prep",
        description: "",
        color: "#000",
        icon: "book",
        nodes: [node("st1"), node("st2")],
      },
    ];

    const { rows } = buildWeekPlan(
      {
        subjects,
        getNodeStatus: (n) => (n.id === "st1" ? "available" : "locked"),
        enrolledTrackId: "sat-august",
        placementGoal: "sat",
        storage,
      },
      6,
    );

    expect(rows.some((r) => r.source === "college" && r.title === "Submit FAFSA")).toBe(true);
    expect(rows.some((r) => r.source === "track")).toBe(true);
    expect(rows.some((r) => r.id === "review-due")).toBe(false);
  });

  it("does not throw when building rows (regression: undefined admissions args)", () => {
    expect(() =>
      buildWeekPlan({
        subjects: [],
        getNodeStatus: () => "available",
        storage,
      }),
    ).not.toThrow();
  });

  it("caps college rows at 3 and links registry schools to application package", () => {
    addCollege("Alpha U", "2026-05-25", undefined, storage);
    addCollege("Beta U", "2026-05-26", undefined, storage);
    addCollege("Gamma U", "2026-05-27", undefined, storage);
    addCollege("Delta U", "2026-05-28", undefined, storage);

    const { rows, collegeOverflow } = buildWeekPlan(
      { subjects: [], getNodeStatus: () => "available", storage },
      6,
    );

    const collegeRows = rows.filter((r) => r.source === "college");
    expect(collegeRows).toHaveLength(3);
    expect(collegeOverflow).toBe(1);
    expect(collegeRows[0]?.href).toContain(ROUTES.applicationPackage);
    expect(collegeRows[0]?.href).toContain("college=");
  });

  it("prioritizes non-urgent college rows before track when study intent is college", () => {
    setStudyIntent("college", storage);
    addCollege("Far U", "2026-06-03", undefined, storage);

    const subjects: Subject[] = [
      {
        id: "sat-prep",
        name: "SAT Prep",
        description: "",
        color: "#000",
        icon: "book",
        nodes: [node("st1"), node("st2")],
      },
    ];

    const { rows } = buildWeekPlan(
      {
        subjects,
        getNodeStatus: (n) => (n.id === "st1" ? "available" : "locked"),
        enrolledTrackId: "sat-august",
        storage,
      },
      6,
    );

    const collegeIntentIdx = rows.findIndex((r) => r.id.startsWith("college-intent"));
    const trackIdx = rows.findIndex((r) => r.source === "track");
    expect(collegeIntentIdx).toBeGreaterThanOrEqual(0);
    expect(trackIdx).toBeGreaterThan(collegeIntentIdx);
    expect(rows[collegeIntentIdx]?.detail).toContain("College focus today");
  });

  it("prioritizes continue lesson before track when study intent is catch_up", () => {
    setStudyIntent("catch_up", storage);

    const subjects: Subject[] = [
      {
        id: "sat-prep",
        name: "SAT Prep",
        description: "",
        color: "#000",
        icon: "book",
        nodes: [node("st1"), node("st2")],
      },
    ];

    const { rows } = buildWeekPlan(
      {
        subjects,
        getNodeStatus: () => "available",
        enrolledTrackId: "sat-august",
        continueLesson: {
          nodeId: "st1",
          title: "Lesson st1",
          href: "/subjects/sat-prep/st1",
        },
        storage,
      },
      6,
    );

    const catchUpIdx = rows.findIndex((r) => r.id.startsWith("catch-up"));
    const trackIdx = rows.findIndex((r) => r.id.startsWith("track-"));
    expect(catchUpIdx).toBeGreaterThanOrEqual(0);
    expect(rows[catchUpIdx]?.title).toBe("Continue Lesson st1");
    expect(rows[catchUpIdx]?.detail).toContain("Catch up today");
    expect(trackIdx).toBeGreaterThan(catchUpIdx);
  });
});
