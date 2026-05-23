import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeMode = "dark" | "light" | "system";

interface PreferencesState {
  theme: ThemeMode;
  focusMode: boolean;
  onboardingCompleted: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleFocusMode: () => void;
  setFocusMode: (value: boolean) => void;
  completeOnboarding: () => void;
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
    }),
    {
      name: "learnv2_preferences",
      partialize: (s) => ({ theme: s.theme, onboardingCompleted: s.onboardingCompleted }),
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme);
      },
    },
  ),
);

export function initTheme() {
  applyTheme(usePreferences.getState().theme);
}
