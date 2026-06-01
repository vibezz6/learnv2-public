import { describe, expect, it } from "vitest";
import {
  getNodeSkillId,
  getPicklistSkills,
  isSatSkillId,
  resolveSkillId,
  SAT_NODE_SKILLS,
  SAT_SKILLS,
} from "@/lib/satSkills";

describe("satSkills", () => {
  it("maps known nodes to skills and unknown to null", () => {
    expect(getNodeSkillId("st4")).toBe("linear-equations");
    expect(getNodeSkillId("st27")).toBe("sentence-boundaries");
    expect(getNodeSkillId("st80")).toBe("quadratics");
    expect(getNodeSkillId("nope")).toBeNull();
    expect(getNodeSkillId(undefined)).toBeNull();
  });

  it("covers all 80 sat-prep nodes with valid skill ids", () => {
    expect(Object.keys(SAT_NODE_SKILLS)).toHaveLength(80);
    for (let i = 1; i <= 80; i++) {
      const skill = SAT_NODE_SKILLS[`st${i}`];
      expect(skill, `st${i} should map to a skill`).toBeDefined();
      expect(isSatSkillId(skill!)).toBe(true);
    }
  });

  it("resolves free-text and pretest labels to canonical skills", () => {
    expect(resolveSkillId("commas")).toBe("sentence-boundaries");
    expect(resolveSkillId("comma splices")).toBe("sentence-boundaries");
    expect(resolveSkillId("Linear equations")).toBe("linear-equations");
    expect(resolveSkillId("Mean and median")).toBe("statistics-data");
    expect(resolveSkillId("Right triangles")).toBe("geometry-trig");
    expect(resolveSkillId("Words in context")).toBe("words-in-context");
    expect(resolveSkillId("linear-equations")).toBe("linear-equations");
    expect(resolveSkillId("zzz nonsense")).toBeNull();
    expect(resolveSkillId("")).toBeNull();
  });

  it("picklist returns only content skills for the section", () => {
    const math = getPicklistSkills("math");
    expect(math.length).toBeGreaterThan(0);
    expect(math.every((s) => SAT_SKILLS[s.id].section === "math")).toBe(true);
    expect(math.some((s) => s.id === "math-mixed")).toBe(false);
    expect(math.some((s) => s.id === "linear-equations")).toBe(true);

    const rw = getPicklistSkills("rw");
    expect(rw.every((s) => SAT_SKILLS[s.id].section === "rw")).toBe(true);
    expect(rw.some((s) => s.id === "rw-mixed")).toBe(false);
    expect(rw.some((s) => s.id === "sentence-boundaries")).toBe(true);
  });
});
