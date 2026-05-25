import type { SkillNode, Subject } from "@/curriculum/types";
import { getWeekDeadlineRows, type WeekDeadlineRow } from "@/lib/admissionsSummary";
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
  const rows: WeekPlanRow[] = [];
  const used = new Set<string>();

  const push = (row: WeekPlanRow) => {
    const key = row.href;
    if (rows.length >= maxRows || used.has(key)) return;
    used.add(key);
    rows.push(row);
  };

  for (const deadline of getWeekDeadlineRows(7)) {
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
