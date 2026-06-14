import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("buildFeatures full profile", () => {
  it("includes SAT and college by default in dev/test builds", async () => {
    const { appProfile, includeSat, includeCollege, isSubjectAllowed, isTrackAllowed } =
      await import("@/lib/buildFeatures");
    expect(appProfile).toBe("full");
    expect(includeSat).toBe(true);
    expect(includeCollege).toBe(true);
    expect(isSubjectAllowed("sat-prep")).toBe(true);
    expect(isSubjectAllowed("trading")).toBe(true);
    expect(isTrackAllowed("sat-august")).toBe(true);
    expect(isTrackAllowed("trader")).toBe(true);
  });
});

describe("buildFeatures public profile", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_APP_PROFILE", "public");
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("disables SAT and college surfaces", async () => {
    const { appProfile, includeSat, includeCollege } = await import("@/lib/buildFeatures");
    expect(appProfile).toBe("public");
    expect(includeSat).toBe(false);
    expect(includeCollege).toBe(false);
  });

  it("allows only foundation subjects and track", async () => {
    const { isSubjectAllowed, isTrackAllowed, FOUNDATION_SUBJECT_IDS } =
      await import("@/lib/buildFeatures");
    expect(FOUNDATION_SUBJECT_IDS).toEqual(["math", "cs", "probability"]);
    expect(isSubjectAllowed("math")).toBe(true);
    expect(isSubjectAllowed("cs")).toBe(true);
    expect(isSubjectAllowed("probability")).toBe(true);
    expect(isSubjectAllowed("sat-prep")).toBe(false);
    expect(isSubjectAllowed("trading")).toBe(false);
    expect(isTrackAllowed("foundation")).toBe(true);
    expect(isTrackAllowed("trader")).toBe(false);
  });

  it("filters manifest and tracks for public deploy", async () => {
    const { manifest } = await import("@/curriculum/loader");
    const { tracks } = await import("@/data/tracks");
    expect(manifest.map((entry) => entry.id)).toEqual(["math", "cs", "probability"]);
    expect(tracks.map((track) => track.id)).toEqual(["foundation"]);
  });
});
