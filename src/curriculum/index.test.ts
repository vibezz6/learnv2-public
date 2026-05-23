import { describe, expect, it } from "vitest";
import { manifest } from "@/curriculum";

describe("curriculum", () => {
  it("loads manifest with all subjects including SAT prep", () => {
    expect(manifest.length).toBe(10);
    expect(manifest.find((m) => m.id === "sat-prep")?.nodeCount).toBe(15);
    expect(manifest.find((m) => m.id === "math")?.nodeCount).toBe(55);
    expect(manifest.reduce((n, m) => n + m.nodeCount, 0)).toBe(253);
  });
});
