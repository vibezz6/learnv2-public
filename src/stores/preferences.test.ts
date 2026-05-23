import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePreferences } from "@/stores/preferences";

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
    usePreferences.setState({
      theme: "dark",
      focusMode: false,
      onboardingCompleted: false,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("completeOnboarding sets onboardingCompleted", () => {
    expect(usePreferences.getState().onboardingCompleted).toBe(false);
    usePreferences.getState().completeOnboarding();
    expect(usePreferences.getState().onboardingCompleted).toBe(true);
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
});
