import type { SkillNode, Subject } from "@/curriculum/types";
import { SAT_PRETEST_DRAFT_1_ID } from "@/data/satPretestDraft1";
import { SAT_PRETEST_DRAFT_2_ID } from "@/data/satPretestDraft2";
import { getSatNextLesson, type NodeStatus } from "@/lib/campusHome";
import type { PlacementGoal } from "@/lib/placement";
import { getPrimaryMistakeCategory } from "@/lib/satMistakeTriage";
import { getSatRecommendedLessons } from "@/lib/satRecommendedLessons";
import { getTodayReadinessEntry } from "@/lib/satReadiness";
import { hasActivitySince, listActivitiesForDate } from "@/lib/studyActivity";
import {
  getActiveSatPretestAttempt,
  getLatestCompletedSatPretestAttempt,
} from "@/lib/satPretest";
import { getToday } from "@/stores/progress";

export type SatDailyStudyIntensity = "minimum" | "normal" | "stretch";

export type SatDailyStudyPrimaryKind =
  | "resume_draft1"
  | "resume_draft2"
  | "start_draft1"
  | "track_lesson"
  | "gap_lesson"
  | "mistake_review"
  | "diagnostic_optional";

export interface SatDailyStudyCommand {
  headline: string;
  detail: string;
  href: string;
  buttonLabel: string;
  kind: SatDailyStudyPrimaryKind;
  intensity: SatDailyStudyIntensity;
  diagnosticNote?: string;
}

export interface SatDailyStudyInput {
  subjects: Subject[];
  getNodeStatus: (node: SkillNode) => NodeStatus;
  storage?: Storage;
}

function studyIntensity(storage: Storage): SatDailyStudyIntensity {
  const today = getTodayReadinessEntry(storage);
  if (!today) return "normal";
  if (today.rating <= 2) return "minimum";
  if (today.rating >= 4) return "stretch";
  return "normal";
}

function intensityLabel(intensity: SatDailyStudyIntensity): string {
  if (intensity === "minimum") return "Bad-day minimum (~20 min)";
  if (intensity === "stretch") return "Good-day stretch";
  return "Today's focus";
}

export function getSatDailyStudyCommand(input: SatDailyStudyInput): SatDailyStudyCommand {
  const storage = input.storage ?? localStorage;
  const intensity = studyIntensity(storage);
  const focusPrefix = intensityLabel(intensity);

  const draft1Active = getActiveSatPretestAttempt(SAT_PRETEST_DRAFT_1_ID, storage);
  const draft1Done = getLatestCompletedSatPretestAttempt(SAT_PRETEST_DRAFT_1_ID, storage);
  const draft2Active = getActiveSatPretestAttempt(SAT_PRETEST_DRAFT_2_ID, storage);

  if (draft1Active) {
    return {
      headline: focusPrefix,
      detail: "Draft 1 in progress — open SAT Prep to resume your optional baseline.",
      href: "/subjects/sat-prep#diagnostic",
      buttonLabel: "Open SAT Prep",
      kind: "resume_draft1",
      intensity,
    };
  }

  if (draft2Active) {
    return {
      headline: focusPrefix,
      detail: "Draft 2 gap follow-up in progress — continue from SAT Prep.",
      href: "/subjects/sat-prep#diagnostic",
      buttonLabel: "Open SAT Prep",
      kind: "resume_draft2",
      intensity,
    };
  }

  if (!draft1Done) {
    return {
      headline: focusPrefix,
      detail: "Optional one-time baseline — daily study is track, mistake log, and official practice.",
      href: "/subjects/sat-prep#official",
      buttonLabel: "Official practice",
      kind: "start_draft1",
      intensity,
      diagnosticNote: "Optional baseline lives on SAT Prep when you want it.",
    };
  }

  const topMistake = getPrimaryMistakeCategory(storage);
  const recommended = getSatRecommendedLessons(input.subjects, input.getNodeStatus);
  const topLesson = recommended.lessons[0];
  const satNext = getSatNextLesson(input.subjects, input.getNodeStatus);
  const since24h = Date.now() - 86_400_000;
  const recentMistake = hasActivitySince(["sat_mistake_logged"], since24h, storage);
  const lessonToday = listActivitiesForDate(getToday(), storage).some(
    (e) => e.type === "lesson_completed" || e.type === "lesson_started",
  );

  let diagnosticNote: string | undefined;
  if (draft1Done?.scoreSummary) {
    const score = `${draft1Done.scoreSummary.correctAnswers}/${draft1Done.scoreSummary.totalQuestions} (${draft1Done.scoreSummary.pct}%)`;
    diagnosticNote = `Baseline done: ${score} — optional retest on SAT diagnostic when ready.`;
  }

  if (intensity === "minimum" && topMistake) {
    return {
      headline: focusPrefix,
      detail: `Review ${topMistake.category} (${topMistake.count} logged) — light day, skip new material.`,
      href: "/subjects/sat-prep#mistakes",
      buttonLabel: "Review mistake log",
      kind: "mistake_review",
      intensity,
      diagnosticNote,
    };
  }

  if (recentMistake && !lessonToday && topMistake && intensity === "normal") {
    return {
      headline: focusPrefix,
      detail: `You logged a mistake recently — review ${topMistake.category} before new lessons.`,
      href: topMistake.nodeId
        ? `/subjects/sat-prep/${topMistake.nodeId}`
        : "/subjects/sat-prep#mistakes",
      buttonLabel: topMistake.nodeId ? "Gap drill lesson" : "Review mistake log",
      kind: topMistake.nodeId ? "gap_lesson" : "mistake_review",
      intensity,
      diagnosticNote,
    };
  }

  if (topLesson && recommended.source !== "track_next") {
    const gapLabel =
      recommended.source === "pretest_gaps" ? "Gap lesson" : "Recommended lesson";
    return {
      headline: focusPrefix,
      detail: `${gapLabel}: ${topLesson.title} — ${topLesson.reason}`,
      href: `/subjects/${topLesson.subjectId}/${topLesson.nodeId}`,
      buttonLabel: gapLabel,
      kind: "gap_lesson",
      intensity,
      diagnosticNote,
    };
  }

  if (topMistake) {
    return {
      headline: focusPrefix,
      detail: `Retarget ${topMistake.category} (${topMistake.count} miss${topMistake.count === 1 ? "" : "es"} in log).`,
      href: topMistake.nodeId
        ? `/subjects/sat-prep/${topMistake.nodeId}`
        : "/subjects/sat-prep#mistakes",
      buttonLabel: topMistake.nodeId ? "Gap drill lesson" : "Review mistake log",
      kind: topMistake.nodeId ? "gap_lesson" : "mistake_review",
      intensity,
      diagnosticNote,
    };
  }

  if (satNext && satNext.status === "available") {
    return {
      headline: focusPrefix,
      detail: `August track: ${satNext.title}`,
      href: `/subjects/${satNext.subjectId}/${satNext.nodeId}`,
      buttonLabel: "Next track lesson",
      kind: "track_lesson",
      intensity,
      diagnosticNote,
    };
  }

  return {
    headline: focusPrefix,
    detail: "Log Bluebook/Khan misses, then pick the next August track lesson.",
    href: "/subjects/sat-prep#official",
    buttonLabel: "SAT study hub",
    kind: "mistake_review",
    intensity,
    diagnosticNote,
  };
}

/** True when the dashboard SAT today card should render (Campus home hides duplicate SAT block). */
export function shouldShowSatTodayCard(
  placementGoal: PlacementGoal | null | undefined,
  subjects: Subject[],
  getNodeStatus: (node: SkillNode) => NodeStatus,
  storage: Storage = localStorage,
): boolean {
  const satNext = getSatNextLesson(subjects, getNodeStatus);
  const draft1Active = getActiveSatPretestAttempt(SAT_PRETEST_DRAFT_1_ID, storage);
  const draft1Done = getLatestCompletedSatPretestAttempt(SAT_PRETEST_DRAFT_1_ID, storage);
  const draft2Active = getActiveSatPretestAttempt(SAT_PRETEST_DRAFT_2_ID, storage);
  return (
    placementGoal === "sat" ||
    !!satNext ||
    !!draft1Active ||
    !!draft1Done ||
    !!draft2Active
  );
}
