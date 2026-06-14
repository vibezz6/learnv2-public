import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initTheme, usePreferences } from "@/stores/preferences";

function mockMatchMedia(initialDark = false) {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  let matches = initialDark;
  const mediaQueryList = {
    get matches() {
      return matches;
    },
    media: "(prefers-color-scheme: dark)",
    addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.add(listener);
    },
    removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.delete(listener);
    },
    dispatchChange(dark: boolean) {
      matches = dark;
      for (const listener of listeners) {
        listener({ matches } as MediaQueryListEvent);
      }
    },
  };
  vi.stubGlobal("window", { matchMedia: () => mediaQueryList });
  return mediaQueryList;
}

function mockLocalStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k) => map.get(k) ?? null,
    key: (i) => [...map.keys()][i] ?? null,
    removeItem: (k) => map.delete(k),
    setItem: (k, v) => map.set(k, v),
  };
}

describe("preferences", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", mockLocalStorage());
    vi.stubGlobal("document", {
      documentElement: { dataset: {} as DOMStringMap },
      body: { classList: { toggle: vi.fn() } },
    });
    mockMatchMedia(false);
    usePreferences.setState({
      theme: "dark",
      focusMode: false,
      uiMode: "simple",
      onboardingCompleted: false,
      enrolledTrackId: null,
      placementGoal: null,
    });
    delete document.documentElement.dataset.theme;
  });

  afterEach(() => {
    usePreferences.getState().setTheme("dark");
    vi.unstubAllGlobals();
  });

  it("completeOnboarding sets onboardingCompleted", () => {
    expect(usePreferences.getState().onboardingCompleted).toBe(false);
    usePreferences.getState().completeOnboarding();
    expect(usePreferences.getState().onboardingCompleted).toBe(true);
  });

  it("completeOnboardingWithPlacement enrolls SAT track", () => {
    usePreferences.getState().completeOnboardingWithPlacement("sat");
    const s = usePreferences.getState();
    expect(s.onboardingCompleted).toBe(true);
    expect(s.placementGoal).toBe("sat");
    expect(s.enrolledTrackId).toBe("sat-august");
  });

  it("completeOnboardingWithPlacement explore leaves track unset", () => {
    usePreferences.getState().completeOnboardingWithPlacement("explore");
    expect(usePreferences.getState().enrolledTrackId).toBeNull();
  });

  it("setPlacementGoal updates track without replaying onboarding", () => {
    usePreferences.getState().completeOnboardingWithPlacement("sat");
    usePreferences.getState().setPlacementGoal("foundation");
    const s = usePreferences.getState();
    expect(s.onboardingCompleted).toBe(true);
    expect(s.placementGoal).toBe("foundation");
    expect(s.enrolledTrackId).toBe("foundation");
  });

  it("learnv2_preferences includes onboardingCompleted in persisted shape", () => {
    localStorage.setItem(
      "learnv2_preferences",
      JSON.stringify({ state: { theme: "dark", onboardingCompleted: true }, version: 0 }),
    );
    const parsed = JSON.parse(localStorage.getItem("learnv2_preferences")!) as {
      state: { theme: string; onboardingCompleted: boolean };
    };
    expect(parsed.state.onboardingCompleted).toBe(true);
  });

  it("setTheme applies explicit light and dark themes", () => {
    usePreferences.getState().setTheme("light");
    expect(document.documentElement.dataset.theme).toBe("light");

    usePreferences.getState().setTheme("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("setTheme system resolves from prefers-color-scheme", () => {
    const mediaQueryList = mockMatchMedia(true);
    usePreferences.getState().setTheme("system");
    expect(document.documentElement.dataset.theme).toBe("dark");

    mediaQueryList.dispatchChange(false);
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("initTheme attaches the system theme listener when theme is system", () => {
    usePreferences.setState({ theme: "system" });
    const mediaQueryList = mockMatchMedia(false);

    initTheme();
    expect(document.documentElement.dataset.theme).toBe("light");

    mediaQueryList.dispatchChange(true);
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("defaults uiMode to simple for new users", () => {
    expect(usePreferences.getState().uiMode).toBe("simple");
  });

  it("setUiMode updates interface mode", () => {
    usePreferences.getState().setUiMode("full");
    expect(usePreferences.getState().uiMode).toBe("full");
    usePreferences.getState().setUiMode("simple");
    expect(usePreferences.getState().uiMode).toBe("simple");
  });

  it("leaving system theme stops OS theme changes from updating the document", () => {
    const mediaQueryList = mockMatchMedia(false);
    usePreferences.getState().setTheme("system");
    usePreferences.getState().setTheme("dark");

    mediaQueryList.dispatchChange(true);
    expect(document.documentElement.dataset.theme).toBe("dark");
  });
});
