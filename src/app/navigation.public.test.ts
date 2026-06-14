import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("getNavSections public profile", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_APP_PROFILE", "public");
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("simple mode omits SAT and College", async () => {
    const { getNavSections } = await import("@/app/navigation");
    const labels = getNavSections({ simple: true }).flatMap((section) =>
      section.items.map((item) => item.label),
    );
    expect(labels).toEqual(["Today", "Review", "Settings"]);
    expect(labels).not.toContain("SAT");
    expect(labels).not.toContain("College");
  });
});
