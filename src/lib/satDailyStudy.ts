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
import { getBlockingApplicationItem } from "@/lib/admissionsSummary";
import { getToday } from "@/stores/progress";

export type SatDailyStudyIntensity = "minimum" | "normal" | "stretch";

export type SatDailyStudyPrimaryKind =
  | "resume_draft1"
  | "resume_draft2"
  | "start_draft1"
  | "track_lesson"
  | "gap_lesson"
  | "mistake_review"
  | "diagnostic_optional"
  | "college_blocking";

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
  if (intensity === "minimum") return "Light day — keep the streak alive";
  if (intensity === "stretch") return "Good day — push hard";
  return "Today's SAT focus";
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
      detail: "Finish your in-progress diagnostic — pick up right where you left off.",
      href: "/subjects/sat-prep#diagnostic",
      buttonLabel: "Resume diagnostic",
      kind: "resume_draft1",
      intensity,
    };
  }

  if (draft2Active) {
    return {
      headline: focusPrefix,
      detail: "Finish your Draft 2 gap follow-up — you're mid-attempt.",
      href: "/subjects/sat-prep#diagnostic",
      buttonLabel: "Resume Draft 2",
      kind: "resume_draft2",
      intensity,
    };
  }

  const blocker = getBlockingApplicationItem(new Date());
  if (blocker && (blocker.overdue || blocker.daysUntil <= 7)) {
    const headline = blocker.overdue ? "College — overdue" : "College — due this week";
    const detailParts = [blocker.title, blocker.detail].filter(Boolean);
    if (blocker.nextStep) detailParts.push(blocker.nextStep);
    return {
      headline,
      detail: detailParts.join(" · "),
      href: blocker.href,
      buttonLabel: blocker.nextStep ?? "Open application task",
      kind: "college_blocking",
      intensity,
    };
  }

  if (!draft1Done) {
    return {
      headline: focusPrefix,
      detail: "Run one official-practice set, then log every miss — that's today's win.",
      href: "/subjects/sat-prep#official",
      buttonLabel: "Start practice",
      kind: "start_draft1",
      intensity,
      diagnosticNote: "Want a baseline score? The SAT Prep diagnostic is there when you do.",
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
    diagnosticNote = `Baseline: ${score}. Retest on the SAT diagnostic whenever you want a fresh read.`;
  }

  if (intensity === "minimum" && topMistake) {
    return {
      headline: focusPrefix,
      detail: `Light day: clear ${topMistake.category} (${topMistake.count} logged). Skip new material.`,
      href: "/subjects/sat-prep#mistakes",
      buttonLabel: "Review mistakes",
      kind: "mistake_review",
      intensity,
      diagnosticNote,
    };
  }

  if (recentMistake && !lessonToday && topMistake && intensity === "normal") {
    return {
      headline: focusPrefix,
      detail: `You logged a mistake recently — clear ${topMistake.category} before anything new.`,
      href: topMistake.nodeId
        ? `/subjects/sat-prep/${topMistake.nodeId}`
        : "/subjects/sat-prep#mistakes",
      buttonLabel: topMistake.nodeId ? "Drill this gap" : "Review mistakes",
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
      detail: `Retarget ${topMistake.category} — ${topMistake.count} miss${topMistake.count === 1 ? "" : "es"} in the log.`,
      href: topMistake.nodeId
        ? `/subjects/sat-prep/${topMistake.nodeId}`
        : "/subjects/sat-prep#mistakes",
      buttonLabel: topMistake.nodeId ? "Drill this gap" : "Review mistakes",
      kind: topMistake.nodeId ? "gap_lesson" : "mistake_review",
      intensity,
      diagnosticNote,
    };
  }

  if (satNext && satNext.status === "available") {
    return {
      headline: focusPrefix,
      detail: `August track — up next: ${satNext.title}`,
      href: `/subjects/${satNext.subjectId}/${satNext.nodeId}`,
      buttonLabel: "Start lesson",
      kind: "track_lesson",
      intensity,
      diagnosticNote,
    };
  }

  return {
    headline: focusPrefix,
    detail: "Log your latest Bluebook or Khan misses, then take the next track lesson.",
    href: "/subjects/sat-prep#official",
    buttonLabel: "Open SAT hub",
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
