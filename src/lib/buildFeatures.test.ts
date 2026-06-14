import { describe, expect, it } from "vitest";
import { includeSat } from "@/lib/buildFeatures";

describe("buildFeatures", () => {
  it("includes SAT by default in dev/test builds", () => {
    expect(includeSat).toBe(true);
  });
});
