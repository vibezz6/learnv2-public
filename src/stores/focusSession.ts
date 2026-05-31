import { create } from "zustand";
import { persist } from "zustand/middleware";
import { usePreferences } from "@/stores/preferences";
import { useProgress } from "@/stores/progress";

/** Hard cap so a session left open overnight can't log absurd minutes. */
const MAX_SESSION_SECONDS = 3 * 60 * 60;

export interface ActiveFocusSession {
  id: string;
  /** Short human label, e.g. "SAT · Linear equations". */
  label: string;
  href: string;
  nodeId?: string;
  startedAt: number;
}

export interface FocusSessionSummary {
  label: string;
  href: string;
  minutes: number;
  endedAt: number;
}

interface FocusSessionState {
  active: ActiveFocusSession | null;
  summary: FocusSessionSummary | null;
  startSession: (input: {
    label: string;
    href: string;
    nodeId?: string;
    /** Enter deep-focus mode (hide chrome). Only sensible for real study pages. */
    focus?: boolean;
  }) => void;
  finishSession: () => void;
  cancelSession: () => void;
  dismissSummary: () => void;
}

function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `focus-${Date.now()}`;
}

export const useFocusSession = create<FocusSessionState>()(
  persist(
    (set, get) => ({
      active: null,
      summary: null,

      startSession: ({ label, href, nodeId, focus = true }) => {
        if (focus) usePreferences.getState().setFocusMode(true);
        set({
          active: { id: newId(), label, href, nodeId, startedAt: Date.now() },
          summary: null,
        });
      },

      finishSession: () => {
        const active = get().active;
        if (!active) return;
        const elapsedSeconds = Math.min(
          MAX_SESSION_SECONDS,
          Math.max(0, Math.round((Date.now() - active.startedAt) / 1000)),
        );
        // Measured minutes — the honest source that advances the streak + goal.
        useProgress.getState().addStudyTime(elapsedSeconds, active.nodeId);
        usePreferences.getState().setFocusMode(false);
        set({
          active: null,
          summary: {
            label: active.label,
            href: active.href,
            minutes: Math.round(elapsedSeconds / 60),
            endedAt: Date.now(),
          },
        });
      },

      cancelSession: () => {
        if (!get().active) return;
        usePreferences.getState().setFocusMode(false);
        set({ active: null });
      },

      dismissSummary: () => set({ summary: null }),
    }),
    {
      name: "learnv2_focus_session_v1",
      partialize: (s) => ({ active: s.active }),
    },
  ),
);

/** Parse a node id from a study href like `/subjects/sat-prep/st4`. */
export function nodeIdFromHref(href: string): string | undefined {
  const match = href.match(/^\/subjects\/[^/#?]+\/([^/#?]+)/);
  return match?.[1];
}
