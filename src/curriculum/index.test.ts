import { describe, expect, it } from "vitest";
import { getSubject, mathSubject, subjects } from "@/curriculum";

describe("curriculum", () => {
  it("loads math subject stub", () => {
    expect(subjects).toHaveLength(1);
    expect(mathSubject.id).toBe("math");
    expect(mathSubject.nodes.length).toBeGreaterThan(0);
  });

  it("finds subject by id", () => {
    expect(getSubject("math")?.name).toBe("Mathematics");
    expect(getSubject("missing")).toBeUndefined();
  });
});
