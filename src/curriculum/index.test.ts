import { describe, expect, it } from "vitest";
import { manifest } from "@/curriculum";

describe("curriculum", () => {
  it("loads manifest with all v1 subjects", () => {
    expect(manifest.length).toBe(9);
    expect(manifest.find((m) => m.id === "math")?.nodeCount).toBe(55);
    expect(manifest.reduce((n, m) => n + m.nodeCount, 0)).toBe(237);
  });
});
