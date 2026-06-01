import {
  listActivitiesForDate,
  REAL_STUDY_ACTIVITY_TYPES,
  type StudyActivityEvent,
} from "@/lib/studyActivity";
import { getToday } from "@/stores/progress";

/**
 * The "minimum viable day" — the smallest amount of real work that keeps the
 * chain alive. Intentionally low so there is never an excuse to skip entirely:
 * a single genuine study action (an SAT lesson, a quiz, a review, a logged
 * mistake, an official-practice log, or a timed session) counts.
 */
export const MINIMUM_VIABLE_ACTIONS = 1;

export interface DailyMinimumStatus {
  date: string;
  met: boolean;
  actionsToday: number;
  remaining: number;
}

export function getDailyMinimumStatus(
  date: string = getToday(),
  storage: Storage = localStorage,
): DailyMinimumStatus {
  const qualifying = listActivitiesForDate(date, storage).filter(
    (event: StudyActivityEvent) => REAL_STUDY_ACTIVITY_TYPES.includes(event.type),
  );
  const actionsToday = qualifying.length;
  return {
    date,
    met: actionsToday >= MINIMUM_VIABLE_ACTIONS,
    actionsToday,
    remaining: Math.max(0, MINIMUM_VIABLE_ACTIONS - actionsToday),
  };
}

export function isMinimumMet(
  date: string = getToday(),
  storage: Storage = localStorage,
): boolean {
  return getDailyMinimumStatus(date, storage).met;
}
