import { describe, expect, it } from "vitest";
import type { Subject } from "@/curriculum/types";
import {
  buildSatSkillCoverageReport,
  getContentPicklistSkillIds,
  getCoverageFailures,
} from "@/lib/satSkillCoverage";

function satSubject(nodes: Subject["nodes"]): Subject {
  return {
    id: "sat-prep",
    name: "SAT",
    description: "",
    color: "#000",
    icon: "g",
    nodes,
  } as Subject;
}

describe("satSkillCoverage", () => {
  it("lists only math and rw picklist skills", () => {
    const ids = getContentPicklistSkillIds();
    expect(ids).toContain("linear-equations");
    expect(ids).not.toContain("math-mixed");
    expect(ids).not.toContain("test-strategy");
    expect(ids.length).toBe(21);
  });

  it("computes deficit toward target", () => {
    const subject = satSubject([
      {
        id: "st17",
        name: "n",
        description: "desc here",
        keyConcepts: ["a", "b"],
        quiz: [
          {
            id: "q1",
            question: "Q?",
            options: ["1", "2"],
            correctIndex: 0,
            explanation: "Because yes.",
          },
        ],
      } as Subject["nodes"][0],
    ]);
    const rows = buildSatSkillCoverageReport(subject, 5);
    const linear = rows.find((r) => r.skillId === "linear-equations");
    expect(linear?.count).toBe(1);
    expect(linear?.deficit).toBe(4);
    expect(getCoverageFailures(rows, 5).length).toBeGreaterThan(0);
  });
});
