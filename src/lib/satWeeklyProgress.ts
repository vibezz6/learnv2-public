import { loadStudyActivities } from "@/lib/studyActivity";
import { getTopMistakeCategories, type MistakeCategorySummary } from "@/lib/satMistakeTriage";
import { getLatestCompletedSatPretestAttempt } from "@/lib/satPretest";
import { SAT_PRETEST_DRAFT_3_ID } from "@/data/satPretestDrafts";
import { SAT_PRETEST_DRAFT_1_ID } from "@/data/satPretestDraft1";

export interface SatWeeklyProgress {
  /** SAT mistakes logged in the last 7 days. */
  mistakesLogged: number;
  /** Official-practice sessions logged in the last 7 days. */
  practiceSessions: number;
  /** Daily-5 warm-ups completed in the last 7 days. */
  dailyQuizzes: number;
  /** SAT lessons completed in the last 7 days (by subject tag). */
  satLessons: number;
  /** Distinct days with any SAT signal in the last 7 days. */
  activeDays: number;
  hasAnySignal: boolean;
  baselinePct: number | null;
  retestPct: number | null;
  deltaPct: number | null;
  topCategories: MistakeCategorySummary[];
}

const WEEK_MS = 7 * 86_400_000;

export function getSatWeeklyProgress(
  storage: Storage = localStorage,
  now: number = Date.now(),
): SatWeeklyProgress {
  const cutoff = now - WEEK_MS;
  const days = new Set<string>();
  let mistakesLogged = 0;
  let practiceSessions = 0;
  let dailyQuizzes = 0;
  let satLessons = 0;

  for (const event of loadStudyActivities(storage)) {
    if (event.at < cutoff) continue;
    if (event.type === "sat_mistake_logged") {
      mistakesLogged++;
      days.add(event.date);
    } else if (event.type === "sat_practice_logged") {
      practiceSessions++;
      days.add(event.date);
    } else if (event.type === "quiz_completed" && event.nodeId?.startsWith("sat-daily")) {
      dailyQuizzes++;
      days.add(event.date);
    } else if (event.type === "lesson_completed" && event.subjectId === "sat-prep") {
      satLessons++;
      days.add(event.date);
    }
  }

  const baseline = getLatestCompletedSatPretestAttempt(SAT_PRETEST_DRAFT_1_ID, storage);
  const retest = getLatestCompletedSatPretestAttempt(SAT_PRETEST_DRAFT_3_ID, storage);
  const baselinePct = baseline?.scoreSummary?.pct ?? null;
  const retestPct = retest?.scoreSummary?.pct ?? null;
  const deltaPct = baselinePct != null && retestPct != null ? retestPct - baselinePct : null;
  const topCategories = getTopMistakeCategories(3, storage);

  return {
    mistakesLogged,
    practiceSessions,
    dailyQuizzes,
    satLessons,
    activeDays: days.size,
    hasAnySignal:
      mistakesLogged > 0 ||
      practiceSessions > 0 ||
      dailyQuizzes > 0 ||
      satLessons > 0 ||
      baselinePct != null ||
      topCategories.length > 0,
    baselinePct,
    retestPct,
    deltaPct,
    topCategories,
  };
}
