import { describe, expect, it } from "vitest";
import type { SkillNode, Subject } from "@/curriculum/types";
import { tracks } from "@/data/tracks";
import {
  DEFAULT_TRACK_ID,
  getSatNextLesson,
  getTrackById,
  getTrackProgress,
  getWeeklySyllabusNodes,
  type NodeStatus,
} from "@/lib/campusHome";

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
  return {
    id: "sat-prep",
    name: "SAT Prep",
    description: "",
    color: "#000",
    icon: "graduation-cap",
    nodes: [node("st1", "Lesson 1"), node("st2", "Lesson 2"), node("st3", "Lesson 3"), ...extraNodes],
  };
}

function statusMap(entries: Record<string, NodeStatus>) {
  return (n: SkillNode) => entries[n.id] ?? "locked";
}

describe("campusHome", () => {
  it("getTrackById resolves the default SAT track", () => {
    const track = getTrackById(DEFAULT_TRACK_ID);
    expect(track?.id).toBe("sat-august");
    expect(track?.lessons[0]).toEqual({ subjectId: "sat-prep", nodeId: "st1" });
  });

  it("getTrackProgress counts completed lessons in track order", () => {
    const track = tracks.find((t) => t.id === "trader")!;
    const subjects: Subject[] = [
      {
        id: "math",
        name: "Math",
        description: "",
        color: "#000",
        icon: "function",
        nodes: [node("m1"), node("m2"), node("m3")],
      },
      {
        id: "probability",
        name: "Probability",
        description: "",
        color: "#000",
        icon: "function",
        nodes: [node("pr1"), node("pr2"), node("pr4")],
      },
      {
        id: "trading",
        name: "Trading",
        description: "",
        color: "#000",
        icon: "trending-up",
        nodes: [node("t1")],
      },
    ];

    const progress = getTrackProgress(track, subjects, statusMap({ m1: "completed", m2: "available" }));
    expect(progress).toEqual({ completed: 1, total: track.lessons.length, pct: 7 });
  });

  it("getWeeklySyllabusNodes returns up to five upcoming incomplete lessons", () => {
    const track = getTrackById(DEFAULT_TRACK_ID)!;
    const subjects = [satSubject()];

    const syllabus = getWeeklySyllabusNodes(
      track,
      subjects,
      statusMap({ st1: "completed", st2: "available", st3: "locked" }),
      2,
    );

    expect(syllabus).toEqual([
      { subjectId: "sat-prep", nodeId: "st2", title: "Lesson 2", status: "available" },
      { subjectId: "sat-prep", nodeId: "st3", title: "Lesson 3", status: "locked" },
    ]);
  });

  it("getSatNextLesson returns the first incomplete SAT lesson in track order", () => {
    const subjects = [satSubject()];

    expect(getSatNextLesson(subjects, statusMap({ st1: "completed", st2: "available" }))).toEqual({
      subjectId: "sat-prep",
      nodeId: "st2",
      title: "Lesson 2",
      status: "available",
    });

    expect(getSatNextLesson(subjects, statusMap({ st1: "available" }))).toEqual({
      subjectId: "sat-prep",
      nodeId: "st1",
      title: "Lesson 1",
      status: "available",
    });
  });
});
