import { loadStudyActivities } from "@/lib/studyActivity";
import { getTopMistakeCategories, type MistakeCategorySummary } from "@/lib/satMistakeTriage";
import { getLatestCompletedSatPretestAttempt } from "@/lib/satPretest";
import { getSatCountdown } from "@/lib/satCountdown";
import { getDueDrillCount } from "@/lib/satDrillSchedule";
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

export type SatReadinessTone = "crunch" | "strong" | "on-track" | "building";

export interface SatReadinessSignal {
  tone: SatReadinessTone;
  label: string;
  detail: string;
}

/**
 * An honest, qualitative readiness signal (NOT a predicted score — the in-app
 * diagnostics are short samplers). Combines weekly consistency, the diagnostic
 * trend, due re-drills, and the countdown.
 */
export function getSatReadinessSignal(
  satTestDate: string | null | undefined,
  storage: Storage = localStorage,
  now: number = Date.now(),
): SatReadinessSignal {
  const p = getSatWeeklyProgress(storage, now);
  const countdown = getSatCountdown(satTestDate);
  const due = getDueDrillCount(storage, now);
  const days = countdown && !countdown.past ? countdown.daysUntil : null;
  const trendUp = p.deltaPct != null && p.deltaPct > 0;

  if (days != null && days <= 7) {
    return {
      tone: "crunch",
      label: "Test week",
      detail:
        due > 0
          ? `Prioritize review — ${due} categor${due === 1 ? "y" : "ies"} due to re-drill. Protect sleep.`
          : "Light timed review and Bluebook practice. Protect your sleep.",
    };
  }
  if (p.activeDays >= 6) {
    return {
      tone: "strong",
      label: "Strong rhythm",
      detail: trendUp
        ? `${p.activeDays}/7 active days and your retest is up ${p.deltaPct} pts.`
        : `${p.activeDays}/7 active days this week — keep the chain going.`,
    };
  }
  if (p.activeDays >= 3) {
    return {
      tone: "on-track",
      label: "On track",
      detail:
        due > 0
          ? `${p.activeDays}/7 active days. ${due} categor${due === 1 ? "y" : "ies"} ready to re-drill.`
          : `${p.activeDays}/7 active days — one more session pushes you ahead.`,
    };
  }
  return {
    tone: "building",
    label: "Building the habit",
    detail: "Aim for a short SAT session most days — consistency is what moves the score.",
  };
}
