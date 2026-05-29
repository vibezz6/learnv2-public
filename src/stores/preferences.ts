import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { PlacementGoal } from "@/lib/placement";
import { trackIdForPlacement } from "@/lib/placement";
import { createSafeStorage } from "@/lib/storageSafety";

export type ThemeMode = "dark" | "light" | "system";

/** How hard the app pushes you: gentle nudges, balanced, or unrelenting. */
export type AccountabilityLevel = "gentle" | "standard" | "strict";

interface PreferencesState {
  theme: ThemeMode;
  focusMode: boolean;
  onboardingCompleted: boolean;
  enrolledTrackId: string | null;
  placementGoal: PlacementGoal | null;
  /** ISO date (YYYY-MM-DD) of the target SAT, used for the countdown. */
  satTestDate: string | null;
  accountabilityLevel: AccountabilityLevel;
  setTheme: (theme: ThemeMode) => void;
  toggleFocusMode: () => void;
  setFocusMode: (value: boolean) => void;
  completeOnboarding: () => void;
  completeOnboardingWithPlacement: (goal: PlacementGoal) => void;
  setPlacementGoal: (goal: PlacementGoal) => void;
  setEnrolledTrack: (id: string | null) => void;
  setSatTestDate: (date: string | null) => void;
  setAccountabilityLevel: (level: AccountabilityLevel) => void;
}

const SYSTEM_THEME_QUERY = "(prefers-color-scheme: dark)";

let systemThemeListener: ((event: MediaQueryListEvent) => void) | null = null;

function teardownSystemThemeListener() {
  if (!systemThemeListener) return;
  window.matchMedia(SYSTEM_THEME_QUERY).removeEventListener("change", systemThemeListener);
  systemThemeListener = null;
}

function syncDocumentTheme(theme: ThemeMode) {
  const resolved =
    theme === "system"
      ? window.matchMedia(SYSTEM_THEME_QUERY).matches
        ? "dark"
        : "light"
      : theme;
  document.documentElement.dataset.theme = resolved === "light" ? "light" : "dark";
}

function applyTheme(theme: ThemeMode) {
  syncDocumentTheme(theme);
  if (theme === "system") {
    if (!systemThemeListener) {
      systemThemeListener = () => {
        if (usePreferences.getState().theme === "system") {
          syncDocumentTheme("system");
        }
      };
      window.matchMedia(SYSTEM_THEME_QUERY).addEventListener("change", systemThemeListener);
    }
  } else {
    teardownSystemThemeListener();
  }
}

export const usePreferences = create<PreferencesState>()(
  persist(
    (set, get) => ({
      theme: "dark",
      focusMode: false,
      onboardingCompleted: false,
      enrolledTrackId: null,
      placementGoal: null,
      satTestDate: null,
      accountabilityLevel: "standard",
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
      toggleFocusMode: () => {
        const next = !get().focusMode;
        document.body.classList.toggle("focus-shell-active", next);
        set({ focusMode: next });
      },
      setFocusMode: (value) => {
        document.body.classList.toggle("focus-shell-active", value);
        set({ focusMode: value });
      },
      completeOnboarding: () => set({ onboardingCompleted: true }),
      completeOnboardingWithPlacement: (goal) =>
        set({
          onboardingCompleted: true,
          placementGoal: goal,
          enrolledTrackId: trackIdForPlacement(goal),
        }),
      setPlacementGoal: (goal) =>
        set({
          placementGoal: goal,
          enrolledTrackId: trackIdForPlacement(goal),
        }),
      setEnrolledTrack: (id) => set({ enrolledTrackId: id }),
      setSatTestDate: (date) => set({ satTestDate: date && date.trim() ? date : null }),
      setAccountabilityLevel: (level) => set({ accountabilityLevel: level }),
    }),
    {
      name: "learnv2_preferences",
      storage: createJSONStorage(() => createSafeStorage()),
      partialize: (s) => ({
        theme: s.theme,
        focusMode: s.focusMode,
        onboardingCompleted: s.onboardingCompleted,
        enrolledTrackId: s.enrolledTrackId,
        placementGoal: s.placementGoal,
        satTestDate: s.satTestDate,
        accountabilityLevel: s.accountabilityLevel,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        applyTheme(state.theme);
        if (typeof document !== "undefined") {
          document.body.classList.toggle("focus-shell-active", state.focusMode);
        }
      },
    },
  ),
);

export function initTheme() {
  applyTheme(usePreferences.getState().theme);
}
