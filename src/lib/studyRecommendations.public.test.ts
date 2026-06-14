import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("buildStudyRecommendations public profile", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_APP_PROFILE", "public");
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("does not recommend college or SAT actions", async () => {
    const { buildStudyRecommendations } = await import("@/lib/studyRecommendations");
    const recs = buildStudyRecommendations({
      subjects: [],
      getNodeStatus: () => "available",
      reviewDueCount: 0,
    });
    expect(recs.some((r) => r.id === "college-blocker")).toBe(false);
    expect(recs.some((r) => r.id === "sat-micro-drill")).toBe(false);
  });
});
