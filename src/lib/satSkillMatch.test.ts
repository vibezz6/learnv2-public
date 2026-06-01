import { describe, expect, it } from "vitest";
import { bestNodeTier, nodeRelevanceTier, type WeakTarget } from "@/lib/satSkillMatch";

describe("satSkillMatch", () => {
  const target: WeakTarget = { skillId: "linear-equations", section: "math", nodeId: "st17" };

  it("ranks exact node > same skill > same domain > same section > none", () => {
    expect(nodeRelevanceTier("st17", target)).toBe(4); // exact node
    expect(nodeRelevanceTier("st4", target)).toBe(3); // same skill (linear-equations)
    expect(nodeRelevanceTier("st18", target)).toBe(2); // same domain (Algebra: systems)
    expect(nodeRelevanceTier("st5", target)).toBe(1); // same section (math)
    expect(nodeRelevanceTier("st27", target)).toBe(0); // R&W node
    expect(nodeRelevanceTier("st1", target)).toBe(1); // general node counts as a section match
  });

  it("matches by section when the target has no skill", () => {
    const sectionOnly: WeakTarget = { skillId: null, section: "rw" };
    expect(nodeRelevanceTier("st27", sectionOnly)).toBe(1);
    expect(nodeRelevanceTier("st4", sectionOnly)).toBe(0);
  });

  it("bestNodeTier takes the max across targets", () => {
    const rw: WeakTarget = { skillId: "inference", section: "rw" };
    expect(bestNodeTier("st4", [target, rw])).toBe(3); // st4 = linear-equations
    expect(bestNodeTier("st32", [target, rw])).toBe(3); // st32 = inference
  });
});
