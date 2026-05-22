import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeMode = "dark" | "light" | "system";

interface PreferencesState {
  theme: ThemeMode;
  focusMode: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleFocusMode: () => void;
  setFocusMode: (value: boolean) => void;
}

function applyTheme(theme: ThemeMode) {
  const resolved =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;
  document.documentElement.dataset.theme = resolved === "light" ? "light" : "dark";
}

export const usePreferences = create<PreferencesState>()(
  persist(
    (set, get) => ({
      theme: "dark",
      focusMode: false,
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
    }),
    {
      name: "learnv2_preferences",
      partialize: (s) => ({ theme: s.theme }),
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme);
      },
    },
  ),
);

export function initTheme() {
  applyTheme(usePreferences.getState().theme);
}
