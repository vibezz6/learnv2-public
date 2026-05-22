import { describe, expect, it } from "vitest";
import { manifest } from "@/curriculum";

describe("curriculum", () => {
  it("loads manifest with all v1 subjects", () => {
    expect(manifest.length).toBeGreaterThanOrEqual(8);
    expect(manifest.find((m) => m.id === "math")?.nodeCount).toBeGreaterThan(0);
  });
});
