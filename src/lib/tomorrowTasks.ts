import type { SkillNode, Subject } from "@/curriculum/types";
import { SAT_PRETEST_DRAFT_1_ID } from "@/data/satPretestDraft1";
import { SAT_PRETEST_DRAFT_2_ID } from "@/data/satPretestDraft2";
import { getUrgentCollegeDeadlines } from "@/lib/admissionsSummary";
import { getSatRecommendedLessons } from "@/lib/satRecommendedLessons";
import { getPrimaryMistakeCategory } from "@/lib/satMistakeTriage";
import { getSatNextLesson, type NodeStatus } from "@/lib/campusHome";
import { getReadinessNudge } from "@/lib/satReadiness";
import {
  getActiveSatPretestAttempt,
  getLatestCompletedSatPretestAttempt,
} from "@/lib/satPretest";
import type { PlacementGoal } from "@/lib/placement";
import { getLastActivity, listActivitiesForDate } from "@/lib/studyActivity";
import { getToday } from "@/stores/progress";

export type TomorrowTaskSource = "college" | "review" | "sat" | "pretest";

export interface TomorrowTask {
  id: string;
  title: string;
  detail?: string;
  href: string;
  source: TomorrowTaskSource;
}

export interface TomorrowTasksInput {
  subjects: Subject[];
  getNodeStatus: (node: SkillNode) => NodeStatus;
  reviewDueCount: number;
  placementGoal?: PlacementGoal | null;
  storage?: Storage;
}

export function buildTomorrowTasks(
  input: TomorrowTasksInput,
  maxTasks = 3,
  now = new Date(),
): TomorrowTask[] {
  const storage = input.storage ?? localStorage;
  const tasks: TomorrowTask[] = [];
  const used = new Set<string>();

  const push = (task: TomorrowTask) => {
    if (tasks.length >= maxTasks || used.has(task.id)) return;
    used.add(task.id);
    tasks.push(task);
  };

  const todayActivity = listActivitiesForDate(getToday(), storage);
  const lastLesson = getLastActivity(["lesson_completed", "lesson_started"], storage);
  if (lastLesson?.nodeId) {
    const found = input.subjects
      .flatMap((s) => s.nodes.map((n) => ({ subject: s, node: n })))
      .find((x) => x.node.id === lastLesson.nodeId);
    if (found && input.getNodeStatus(found.node) !== "locked") {
      push({
        id: `activity-${lastLesson.nodeId}`,
        title: found.node.name,
        detail: "Continue from today’s study log",
        href: `/subjects/${found.subject.id}/${found.node.id}`,
        source: "sat",
      });
    }
  }

  if (todayActivity.some((e) => e.type === "notes_updated")) {
    const notes = todayActivity.find((e) => e.type === "notes_updated");
    if (notes?.nodeId) {
      const found = input.subjects
        .flatMap((s) => s.nodes.map((n) => ({ subject: s, node: n })))
        .find((x) => x.node.id === notes.nodeId);
      if (found) {
        push({
          id: `tomorrow-notes-${notes.nodeId}`,
          title: `Finish notes on ${found.node.name}`,
          detail: "You started office hours today",
          href: `/subjects/${found.subject.id}/${found.node.id}/notes`,
          source: "review",
        });
      }
    }
  }

  for (const row of getUrgentCollegeDeadlines(now, maxTasks)) {
    push({
      id: row.id,
      title: row.title,
      detail: row.overdue ? "Overdue" : row.daysUntil === 0 ? "Due today" : "Due tomorrow",
      href: row.href,
      source: "college",
    });
    if (tasks.length >= maxTasks) return tasks;
  }

  if (input.reviewDueCount > 0) {
    push({
      id: "review-due",
      title: `Spaced review (${input.reviewDueCount} due)`,
      href: "/review",
      source: "review",
    });
  }

  const satNext = getSatNextLesson(input.subjects, input.getNodeStatus);
  const satFocus = input.placementGoal === "sat" || !!satNext;
  if (satFocus && satNext && satNext.status === "available") {
    push({
      id: `sat-lesson-${satNext.nodeId}`,
      title: satNext.title,
      detail: "Next SAT track lesson",
      href: `/subjects/${satNext.subjectId}/${satNext.nodeId}`,
      source: "sat",
    });
  }

  const draft1Active = getActiveSatPretestAttempt(SAT_PRETEST_DRAFT_1_ID, storage);
  const draft1Done = getLatestCompletedSatPretestAttempt(SAT_PRETEST_DRAFT_1_ID, storage);
  const draft2Active = getActiveSatPretestAttempt(SAT_PRETEST_DRAFT_2_ID, storage);
  const draft2Done = getLatestCompletedSatPretestAttempt(SAT_PRETEST_DRAFT_2_ID, storage);
  const readinessNudge = satFocus ? getReadinessNudge(storage) : null;

  if (satFocus && draft1Active) {
    push({
      id: "sat-pretest-resume-draft1",
      title: "Resume SAT Draft 1",
      detail: "Diagnostic in progress",
      href: "/subjects/sat-prep#diagnostic",
      source: "pretest",
    });
  } else if (satFocus && draft2Active) {
    push({
      id: "sat-pretest-resume-draft2",
      title: "Resume SAT Draft 2",
      detail: "Gap follow-up in progress",
      href: "/subjects/sat-prep#diagnostic",
      source: "pretest",
    });
  } else if (satFocus && !draft1Done && !draft1Active) {
    push({
      id: "sat-pretest-draft1",
      title: "Optional SAT baseline",
      detail: readinessNudge ?? "On SAT Prep when ready",
      href: "/subjects/sat-prep#diagnostic",
      source: "pretest",
    });
  } else if (draft1Done) {
    const topMistake = getPrimaryMistakeCategory(storage);
    if (topMistake) {
      push({
        id: `sat-mistake-${topMistake.category}`,
        title: `Review ${topMistake.category}`,
        detail: `${topMistake.count} logged miss${topMistake.count === 1 ? "" : "es"} · retarget before next module`,
        href: topMistake.nodeId
          ? `/subjects/sat-prep/${topMistake.nodeId}`
          : "/subjects/sat-prep#mistakes",
        source: "sat",
      });
    }

    const gapLesson = getSatRecommendedLessons(input.subjects, input.getNodeStatus).lessons[0];
    if (gapLesson && !used.has(`sat-lesson-${gapLesson.nodeId}`)) {
      const weak = draft1Done.scoreSummary?.weakSkills[0]?.label;
      push({
        id: `sat-gap-${gapLesson.nodeId}`,
        title: gapLesson.title,
        detail: weak ? `${gapLesson.reason} · gap: ${weak}` : gapLesson.reason,
        href: `/subjects/${gapLesson.subjectId}/${gapLesson.nodeId}`,
        source: "sat",
      });
    }

    if (satFocus && !draft2Done && !draft2Active && tasks.length < maxTasks) {
      const weak = draft1Done.scoreSummary?.weakSkills[0]?.label;
      push({
        id: "sat-pretest-draft2",
        title: "SAT Draft 2 from gaps (optional)",
        detail: weak ? `When ready · ${weak}` : "Optional gap follow-up",
        href: "/subjects/sat-prep#diagnostic",
        source: "pretest",
      });
    }
  }

  return tasks.slice(0, maxTasks);
}
