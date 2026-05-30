import {
  ACTIVITY_UPDATED_EVENT,
  getLastActivity,
  REAL_STUDY_ACTIVITY_TYPES,
} from "@/lib/studyActivity";
import { getToday, useProgress } from "@/stores/progress";

let wired = false;

/**
 * Single source of truth for "real study advances the streak". Many study
 * actions are recorded by plain library functions (SAT mistake/practice logs,
 * office-hours notes, mentor recall) that don't touch the progress store. This
 * listens to the activity ledger and credits the streak whenever a genuine
 * study action lands today. Store mutations (lesson/quiz/review) also credit
 * synchronously; `creditStudyDay` is idempotent so the overlap is harmless.
 */
export function initStudyStreakSync(): void {
  if (wired || typeof window === "undefined") return;
  wired = true;
  window.addEventListener(ACTIVITY_UPDATED_EVENT, () => {
    // Defer so we never call store.set() re-entrantly from inside another set().
    queueMicrotask(() => {
      const last = getLastActivity(REAL_STUDY_ACTIVITY_TYPES);
      if (last && last.date === getToday()) {
        useProgress.getState().creditStudyDay();
      }
    });
  });
}
