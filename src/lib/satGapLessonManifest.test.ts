import { describe, expect, it } from "vitest";
import type { Subject } from "@/curriculum/types";
import { buildSatGapLessonManifest } from "@/lib/satGapLessonManifest";

const satSubject: Subject = {
  id: "sat-prep",
  name: "SAT Prep",
  description: "",
  color: "#000",
  icon: "book",
  nodes: [
    {
      id: "st4",
      name: "Linear Equations",
      description: "",
      xpValue: 10,
      parentIds: [],
      estimatedMinutes: 10,
      resources: [],
      keyConcepts: [],
      whyItMatters: "",
      practiceProblems: [],
      difficulty: "beginner",
    },
  ],
};

describe("satGapLessonManifest", () => {
  it("marks unknown node ids as proposed_new", () => {
    const manifest = buildSatGapLessonManifest(
      [satSubject],
      [
        { nodeId: "st4", reason: "Exists" },
        { nodeId: "st99", reason: "Needs authoring" },
      ],
    );

    expect(manifest?.proposedCount).toBe(1);
    expect(manifest?.existingCount).toBe(1);
    expect(manifest?.rows[1]?.status).toBe("proposed_new");
  });
});
