import { describe, expect, it } from "vitest";
import type { SkillNode } from "@/curriculum/types";
import { getLockTooltip, getMissingParents, isNodeLocked } from "./lockRules";

function node(id: string, parentIds: string[] = []): SkillNode {
  return {
    id,
    name: `Lesson ${id}`,
    description: "",
    xpValue: 10,
    parentIds,
    estimatedMinutes: 10,
    resources: [],
    keyConcepts: [],
    whyItMatters: "",
    practiceProblems: [],
    difficulty: "beginner",
  };
}

describe("lockRules", () => {
  const reader = (completed: string[]) => (id: string) => ({
    completedAt: completed.includes(id) ? "2026-01-01" : null,
  });

  it("lists incomplete parents", () => {
    const child = node("c", ["a", "b"]);
    expect(getMissingParents(child, reader([]))).toEqual(["a", "b"]);
    expect(getMissingParents(child, reader(["a"]))).toEqual(["b"]);
  });

  it("builds tooltip from parent names", () => {
    const child = node("c", ["a"]);
    const names = (id: string) => (id === "a" ? "Algebra basics" : id);
    expect(getLockTooltip(child, reader([]), names)).toBe('Complete "Algebra basics" first');
  });

  it("isNodeLocked respects completion", () => {
    const child = node("c", ["a"]);
    expect(isNodeLocked(child, reader([]))).toBe(true);
    expect(isNodeLocked(child, reader(["a"]))).toBe(false);
    expect(isNodeLocked(node("root"), reader([]))).toBe(false);
  });
});
