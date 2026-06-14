import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { recordStudyActivity } from "@/lib/studyActivity";
import { maybeTrackMinimumMet, trackStudyEvent } from "@/lib/analytics";

vi.mock("@vercel/analytics", () => ({
  track: vi.fn(),
}));

import { track } from "@vercel/analytics";

describe("analytics", () => {
  const storage = {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    key: vi.fn(),
    length: 0,
  } as unknown as Storage;

  beforeEach(() => {
    vi.mocked(track).mockClear();
    vi.stubGlobal("sessionStorage", {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not call track outside production builds", () => {
    trackStudyEvent("backup_export");
    expect(track).not.toHaveBeenCalled();
  });

  it("maybeTrackMinimumMet is a no-op when minimum is not met", () => {
    maybeTrackMinimumMet(storage);
    expect(track).not.toHaveBeenCalled();
  });

  it("maybeTrackMinimumMet fires once when qualifying activity exists", () => {
    const activityStore = new Map<string, string>();
    const mem = {
      getItem: (k: string) => activityStore.get(k) ?? null,
      setItem: (k: string, v: string) => {
        activityStore.set(k, v);
      },
      removeItem: (k: string) => {
        activityStore.delete(k);
      },
      clear: () => activityStore.clear(),
      key: () => null,
      length: activityStore.size,
    } as Storage;

    const sessionStore = new Map<string, string>();
    vi.stubGlobal("sessionStorage", {
      getItem: (k: string) => sessionStore.get(k) ?? null,
      setItem: (k: string, v: string) => {
        sessionStore.set(k, v);
      },
      removeItem: (k: string) => {
        sessionStore.delete(k);
      },
      clear: () => sessionStore.clear(),
      key: () => null,
      length: sessionStore.size,
    });

    vi.stubEnv("PROD", true);
    recordStudyActivity({ type: "quiz_completed" }, mem);

    maybeTrackMinimumMet(mem);
    maybeTrackMinimumMet(mem);

    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith("minimum_met", expect.objectContaining({ date: expect.any(String) }));
  });
});
