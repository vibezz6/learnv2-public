import { describe, expect, it } from "vitest";
import { getNavSections } from "@/app/navigation";

describe("getNavSections simple mode", () => {
  it("returns five primary items in simple mode", () => {
    const sections = getNavSections({ simple: true });
    const labels = sections.flatMap((section) => section.items.map((item) => item.label));
    expect(labels).toHaveLength(5);
    expect(labels).toEqual(expect.arrayContaining(["Today", "SAT", "College", "Review", "Settings"]));
  });

  it("returns full navigation in full mode", () => {
    const sections = getNavSections({ simple: false });
    const labels = sections.flatMap((section) => section.items.map((item) => item.label));
    expect(labels).toContain("Subjects");
    expect(labels).toContain("Timer");
    expect(labels).toContain("Tracks");
  });
});
