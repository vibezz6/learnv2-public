import type { SkillNode, Subject } from "@/curriculum/types";
import { SAT_PRETEST_DRAFT_1_ID } from "@/data/satPretestDraft1";
import { getWeekDeadlineRows } from "@/lib/admissionsSummary";
import { daysUntilDue } from "@/lib/campusAdmissionsNudges";
import { getSatNextLesson, type NodeStatus } from "@/lib/campusHome";
import {
  getActiveSatPretestAttempt,
  getLatestCompletedSatPretestAttempt,
} from "@/lib/satPretest";
import type { PlacementGoal } from "@/lib/placement";

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

function isDueTodayOrTomorrow(dueDate: string, now: Date): boolean {
  const days = daysUntilDue(dueDate, now);
  return days !== null && days >= 0 && days <= 1;
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

  for (const row of getWeekDeadlineRows(14, now)) {
    if (!isDueTodayOrTomorrow(row.dueDate, now)) continue;
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
  if (satFocus && !draft1Done && !draft1Active) {
    push({
      id: "sat-pretest-draft1",
      title: "SAT Draft 1 diagnostic",
      detail: "15–20 min · answer + rationale",
      href: "/sat/pretest",
      source: "pretest",
    });
  } else if (draft1Done?.scoreSummary?.weakSkills[0]) {
    const weak = draft1Done.scoreSummary.weakSkills[0];
    const lessonId = draft1Done.scoreSummary.recommendedNodeIds[0];
    push({
      id: lessonId ? `sat-gap-${lessonId}` : `sat-gap-${weak.key}`,
      title: lessonId ? `Retarget ${lessonId}` : `Retarget ${weak.label}`,
      detail: `Draft 1 gap: ${weak.label}`,
      href: lessonId ? `/subjects/sat-prep/${lessonId}` : "/subjects/sat-prep",
      source: "pretest",
    });
  }

  return tasks.slice(0, maxTasks);
}
