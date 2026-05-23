import { describe, expect, it } from "vitest";
import { getAdjacentLessonNodes } from "@/curriculum/loader";
import type { Subject } from "@/curriculum/types";

const subject: Subject = {
  id: "test",
  name: "Test",
  description: "",
  color: "#000",
  icon: "book",
  nodes: [
    { id: "a", name: "A", description: "", xpValue: 10, parentIds: [], estimatedMinutes: 10, difficulty: "beginner", keyConcepts: [], resources: [], whyItMatters: "", practiceProblems: [] },
    { id: "b", name: "B", description: "", xpValue: 10, parentIds: ["a"], estimatedMinutes: 10, difficulty: "beginner", keyConcepts: [], resources: [], whyItMatters: "", practiceProblems: [] },
    { id: "c", name: "C", description: "", xpValue: 10, parentIds: ["b"], estimatedMinutes: 10, difficulty: "beginner", keyConcepts: [], resources: [], whyItMatters: "", practiceProblems: [] },
  ],
};

describe("getAdjacentLessonNodes", () => {
  it("returns previous and next siblings with wrap-around", () => {
    expect(getAdjacentLessonNodes(subject, "a")).toEqual({
      prev: subject.nodes[2],
      next: subject.nodes[1],
    });
    expect(getAdjacentLessonNodes(subject, "b")).toEqual({
      prev: subject.nodes[0],
      next: subject.nodes[2],
    });
    expect(getAdjacentLessonNodes(subject, "c")).toEqual({
      prev: subject.nodes[1],
      next: subject.nodes[0],
    });
  });

  it("returns null for unknown node", () => {
    expect(getAdjacentLessonNodes(subject, "missing")).toBeNull();
  });
});
