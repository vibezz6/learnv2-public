import { describe, expect, it } from "vitest";
import type { SkillNode, Subject } from "@/curriculum/types";
import { tracks } from "@/data/tracks";
import type { NodeStatus } from "@/lib/campusHome";
import {
  getTrackChallengeCategory,
  getWeekAssignments,
  LESSONS_PER_WEEK,
} from "@/lib/coursework";
import { subjectToChallengeCategory } from "@/lib/subjectProgress";

function node(id: string, name = id): SkillNode {
  return {
    id,
    name,
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

function satSubject(extraNodes: SkillNode[] = []): Subject {
  const nodes = Array.from({ length: LESSONS_PER_WEEK + 2 }, (_, i) =>
    node(`st${i + 1}`, `Lesson ${i + 1}`),
  );
  return {
    id: "sat-prep",
    name: "SAT Prep",
    description: "",
    color: "#000",
    icon: "graduation-cap",
    nodes: [...nodes, ...extraNodes],
  };
}

function statusMap(entries: Record<string, NodeStatus>) {
  return (n: SkillNode) => entries[n.id] ?? "locked";
}

describe("coursework", () => {
  it("getTrackChallengeCategory maps track ids to challenge labels", () => {
    expect(getTrackChallengeCategory("sat-august")).toBe("SAT");
    expect(getTrackChallengeCategory("developer")).toBe("CS");
    expect(getTrackChallengeCategory("wealth")).toBe("Finance");
    expect(getTrackChallengeCategory("unknown-track")).toBeNull();
  });

  it("subjectToChallengeCategory maps sat-prep to SAT", () => {
    expect(subjectToChallengeCategory("sat-prep")).toBe("SAT");
  });

  it("getWeekAssignments returns incomplete lessons from the current week slice", () => {
    const track = tracks.find((t) => t.id === "sat-august")!;
    const subjects = [satSubject()];

    const { assignments, dailyChallengeCategory } = getWeekAssignments(
      track,
      subjects,
      statusMap({
        st1: "completed",
        st2: "completed",
        st3: "available",
        st4: "locked",
      }),
    );

    expect(dailyChallengeCategory).toBe("SAT");
    expect(assignments).toEqual([
      { subjectId: "sat-prep", nodeId: "st3", title: "Lesson 3", status: "available" },
      { subjectId: "sat-prep", nodeId: "st4", title: "Lesson 4", status: "locked" },
      { subjectId: "sat-prep", nodeId: "st5", title: "Lesson 5", status: "locked" },
    ]);
  });

  it("getWeekAssignments advances to the next week slice after finishing the current one", () => {
    const track = tracks.find((t) => t.id === "sat-august")!;
    const subjects = [
      satSubject(
        Array.from({ length: 3 }, (_, i) => node(`st${i + 8}`, `Lesson ${i + 8}`)),
      ),
    ];

    const completedWeekOne = Object.fromEntries(
      Array.from({ length: LESSONS_PER_WEEK }, (_, i) => [`st${i + 1}`, "completed" as const]),
    );

    const { assignments } = getWeekAssignments(
      track,
      subjects,
      statusMap({ ...completedWeekOne, st6: "available", st7: "locked" }),
    );

    expect(assignments).toEqual([
      { subjectId: "sat-prep", nodeId: "st6", title: "Lesson 6", status: "available" },
      { subjectId: "sat-prep", nodeId: "st7", title: "Lesson 7", status: "locked" },
      { subjectId: "sat-prep", nodeId: "st8", title: "Lesson 8", status: "locked" },
      { subjectId: "sat-prep", nodeId: "st9", title: "Lesson 9", status: "locked" },
      { subjectId: "sat-prep", nodeId: "st10", title: "Lesson 10", status: "locked" },
    ]);
  });

  it("getWeekAssignments returns empty assignments when the track is fully completed", () => {
    const track = {
      id: "developer",
      name: "Developer",
      description: "",
      color: "#000",
      icon: "code",
      lessons: [
        { subjectId: "cs", nodeId: "c1" },
        { subjectId: "cs", nodeId: "c2" },
      ],
    };
    const subjects: Subject[] = [
      {
        id: "cs",
        name: "CS",
        description: "",
        color: "#000",
        icon: "code",
        nodes: [node("c1"), node("c2")],
      },
    ];

    const { assignments, dailyChallengeCategory } = getWeekAssignments(
      track,
      subjects,
      statusMap({ c1: "completed", c2: "completed" }),
    );

    expect(dailyChallengeCategory).toBe("CS");
    expect(assignments).toEqual([]);
  });
});
