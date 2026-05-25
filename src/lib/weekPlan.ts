import type { SkillNode, Subject } from "@/curriculum/types";
import { findNodeAcrossSubjects } from "@/curriculum/loader";
import { getWeekDeadlineRows, type WeekDeadlineRow } from "@/lib/admissionsSummary";
import { listActivitiesForDate } from "@/lib/studyActivity";
import { loadStudyIntent } from "@/lib/studyIntent";
import { getPrimaryMistakeCategory } from "@/lib/satMistakeTriage";
import { getToday } from "@/stores/progress";
import { DEFAULT_TRACK_ID, getTrackById } from "@/lib/campusHome";
import { getWeekAssignments } from "@/lib/coursework";
import type { PlacementGoal } from "@/lib/placement";
import { buildTomorrowTasks, type TomorrowTask } from "@/lib/tomorrowTasks";
import type { NodeStatus } from "@/lib/campusHome";

export type WeekPlanSource = "college" | "track" | "sat" | "pretest";

export interface WeekPlanRow {
  id: string;
  title: string;
  detail?: string;
  href: string;
  source: WeekPlanSource;
  overdue?: boolean;
  disabled?: boolean;
}

export interface WeekPlanInput {
  subjects: Subject[];
  getNodeStatus: (node: SkillNode) => NodeStatus;
  enrolledTrackId?: string | null;
  placementGoal?: PlacementGoal | null;
  storage?: Storage;
}

function dueDetail(row: WeekDeadlineRow): string {
  if (row.overdue) {
    const days = -row.daysUntil;
    return `${days} day${days === 1 ? "" : "s"} overdue`;
  }
  if (row.daysUntil === 0) return "Due today";
  return `Due in ${row.daysUntil} day${row.daysUntil === 1 ? "" : "s"}`;
}

function tomorrowToWeekRow(task: TomorrowTask): WeekPlanRow {
  const source: WeekPlanSource =
    task.source === "pretest" ? "pretest" : task.source === "college" ? "college" : "sat";
  return {
    id: task.id,
    title: task.title,
    detail: task.detail,
    href: task.href,
    source,
  };
}

/** Unified “this week” rows: admissions deadlines, track lessons, SAT follow-ups. */
export function buildWeekPlanRows(input: WeekPlanInput, maxRows = 6): WeekPlanRow[] {
  const storage = input.storage ?? localStorage;
  const intent = loadStudyIntent(storage);
  const rows: WeekPlanRow[] = [];
  const used = new Set<string>();

  const prioritizeSat = intent.focus === "sat";

  const push = (row: WeekPlanRow) => {
    const key = row.href;
    if (rows.length >= maxRows || used.has(key)) return;
    used.add(key);
    rows.push(row);
  };

  let hasUrgentCollege = false;
  for (const deadline of getWeekDeadlineRows(7)) {
    if (deadline.overdue || deadline.daysUntil <= 1) hasUrgentCollege = true;
    push({
      id: deadline.id,
      title: deadline.title,
      detail: deadline.detail ? `${deadline.detail} · ${dueDetail(deadline)}` : dueDetail(deadline),
      href: deadline.href,
      source: "college",
      overdue: deadline.overdue,
    });
    if (rows.length >= maxRows) return rows;
  }

  if (!hasUrgentCollege) {
    const todayNotes = listActivitiesForDate(getToday(), storage).find(
      (e) => e.type === "notes_updated",
    );
    if (todayNotes?.nodeId) {
      const found = findNodeAcrossSubjects(input.subjects, todayNotes.nodeId);
      if (found) {
        push({
          id: `notes-${todayNotes.nodeId}`,
          title: `Continue notes on ${found.node.name}`,
          detail: "Office hours — pick up where you left off",
          href: `/subjects/${found.subject.id}/${found.node.id}`,
          source: "track",
        });
        if (rows.length >= maxRows) return rows;
      }
    }
  }

  if (prioritizeSat && rows.length < maxRows) {
    const topMistake = getPrimaryMistakeCategory(storage);
    if (topMistake) {
      push({
        id: `sat-intent-${topMistake.category}`,
        title: `Retarget ${topMistake.category}`,
        detail: `${topMistake.count} in mistake log · SAT focus today`,
        href: topMistake.nodeId
          ? `/subjects/sat-prep/${topMistake.nodeId}`
          : "/subjects/sat-prep#mistakes",
        source: "sat",
      });
      if (rows.length >= maxRows) return rows;
    }
  }

  const track = getTrackById(input.enrolledTrackId ?? DEFAULT_TRACK_ID);
  if (track) {
    const { assignments } = getWeekAssignments(track, input.subjects, input.getNodeStatus, maxRows);
    for (const item of assignments) {
      const locked = item.status === "locked" || item.status === "coming_soon";
      push({
        id: `track-${item.subjectId}-${item.nodeId}`,
        title: item.title,
        detail:
          item.status === "coming_soon"
            ? "Coming soon"
            : item.status === "locked"
              ? "Locked"
              : "Due this week",
        href: locked ? "#" : `/subjects/${item.subjectId}/${item.nodeId}`,
        source: "track",
        disabled: locked,
      });
      if (rows.length >= maxRows) return rows;
    }
  }

  const extras = buildTomorrowTasks(
    {
      subjects: input.subjects,
      getNodeStatus: input.getNodeStatus,
      reviewDueCount: 0,
      placementGoal: input.placementGoal,
      storage,
    },
    maxRows,
  );

  for (const task of extras) {
    if (task.source === "review" || task.source === "college") continue;
    push(tomorrowToWeekRow(task));
    if (rows.length >= maxRows) return rows;
  }

  return rows;
}

export const WEEK_PLAN_SOURCE_LABELS: Record<WeekPlanSource, string> = {
  college: "College",
  track: "Track",
  sat: "SAT",
  pretest: "Optional diagnostic",
};
