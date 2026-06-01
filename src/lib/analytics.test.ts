import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { recordStudyActivity } from "@/lib/studyActivity";
import { maybeTrackMinimumMet, trackStudyEvent } from "@/lib/analytics";

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
    expect(() => trackStudyEvent("backup_export")).not.toThrow();
  });

  it("maybeTrackMinimumMet is a no-op when minimum is not met", () => {
    maybeTrackMinimumMet(storage);
    expect(sessionStorage.setItem).not.toHaveBeenCalled();
  });

  it("maybeTrackMinimumMet stays disabled even when qualifying activity exists", () => {
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

    expect(sessionStore.size).toBe(0);
  });
});
