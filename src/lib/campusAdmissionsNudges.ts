import type { CollegeChecklistState } from "./collegeChecklist";
import { DEFAULT_COLLEGE_CHECKLIST } from "./collegeChecklist";
import type { EssayEntry, EssayTrackerState } from "./essayTracker";
import type { PlacementGoal } from "./placement";

export interface CampusAdmissionsNudge {
  id: string;
  title: string;
  detail?: string;
  href: string;
  priority: number;
}

const SAT_BUILT_IN_IDS = ["essay-draft", "sat-send-scores"] as const;
const FAFSA_ID = "fafsa-submit";

function isDeadlineNudge(nudge: CampusAdmissionsNudge): boolean {
  return (
    nudge.id.startsWith("essay-overdue-") ||
    nudge.id.startsWith("essay-due-") ||
    nudge.id.startsWith("essay-soon-") ||
    nudge.id.startsWith("checklist-overdue-") ||
    nudge.id.startsWith("checklist-due-") ||
    nudge.id.startsWith("checklist-soon-")
  );
}

function isSoftNudge(nudge: CampusAdmissionsNudge): boolean {
  return (
    nudge.id.startsWith("checklist-builtin-") ||
    nudge.id === "checklist-start" ||
    nudge.id === "essay-tracker-empty"
  );
}

export function dueDateToUtcMs(dueDate: string): number | null {
  const parts = dueDate.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  return Date.UTC(parts[0]!, parts[1]! - 1, parts[2]!);
}

export function daysUntilDue(dueDate: string, now = new Date()): number | null {
  const due = dueDateToUtcMs(dueDate);
  if (due === null) return null;
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((due - today) / 86400000);
}

function essayNudges(essays: EssayEntry[], now: Date): CampusAdmissionsNudge[] {
  const out: CampusAdmissionsNudge[] = [];
  for (const essay of essays) {
    if (essay.status === "final" || !essay.dueDate) continue;
    const days = daysUntilDue(essay.dueDate, now);
    if (days === null) continue;
    const college = essay.college ? ` (${essay.college})` : "";
    if (days < 0) {
      out.push({
        id: `essay-overdue-${essay.id}`,
        title: `Essay overdue${college}`,
        detail: essay.title,
        href: "/campus/essay-tracker",
        priority: 10 + Math.min(9, -days),
      });
    } else if (days <= 7) {
      out.push({
        id: `essay-due-${essay.id}`,
        title: days === 0 ? `Essay due today${college}` : `Essay due in ${days} day${days === 1 ? "" : "s"}${college}`,
        detail: essay.title,
        href: "/campus/essay-tracker",
        priority: 20 + days,
      });
    } else if (days <= 14) {
      out.push({
        id: `essay-soon-${essay.id}`,
        title: `Essay due in ${days} days${college}`,
        detail: essay.title,
        href: "/campus/essay-tracker",
        priority: 35 + days,
      });
    }
  }
  return out;
}

function checklistCustomNudges(state: CollegeChecklistState, now: Date): CampusAdmissionsNudge[] {
  const out: CampusAdmissionsNudge[] = [];
  for (const item of state.customItems) {
    if (item.completed || !item.dueDate) continue;
    const days = daysUntilDue(item.dueDate, now);
    if (days === null) continue;
    if (days < 0) {
      out.push({
        id: `checklist-overdue-${item.id}`,
        title: "Checklist step overdue",
        detail: item.title,
        href: "/campus/college-checklist",
        priority: 15 + Math.min(9, -days),
      });
    } else if (days <= 7) {
      out.push({
        id: `checklist-due-${item.id}`,
        title: days === 0 ? "Checklist due today" : `Checklist due in ${days} day${days === 1 ? "" : "s"}`,
        detail: item.title,
        href: "/campus/college-checklist",
        priority: 25 + days,
      });
    } else if (days <= 14) {
      out.push({
        id: `checklist-soon-${item.id}`,
        title: `Checklist due in ${days} days`,
        detail: item.title,
        href: "/campus/college-checklist",
        priority: 45 + days,
      });
    }
  }
  return out;
}

function checklistBuiltInNudges(
  state: CollegeChecklistState,
  placementGoal: PlacementGoal | null | undefined,
): CampusAdmissionsNudge[] {
  const out: CampusAdmissionsNudge[] = [];
  const placement = placementGoal ?? null;

  if (!state.completed[FAFSA_ID] && placement !== "explore") {
    const def = DEFAULT_COLLEGE_CHECKLIST.find((i) => i.id === FAFSA_ID);
    if (def) {
      out.push({
        id: `checklist-builtin-${FAFSA_ID}`,
        title: def.title,
        detail: def.category,
        href: "/campus/college-checklist",
        priority: 44,
      });
    }
  }

  if (placement === "sat") {
    for (const id of SAT_BUILT_IN_IDS) {
      if (state.completed[id]) continue;
      const def = DEFAULT_COLLEGE_CHECKLIST.find((i) => i.id === id);
      if (!def) continue;
      out.push({
        id: `checklist-builtin-${id}`,
        title: def.title,
        detail: def.category,
        href: "/campus/college-checklist",
        priority: id === "essay-draft" ? 42 : 46,
      });
    }
  }

  const doneBuiltIn = DEFAULT_COLLEGE_CHECKLIST.filter((i) => state.completed[i.id]).length;
  if (doneBuiltIn < 2 && placement !== "explore") {
    out.push({
      id: "checklist-start",
      title: "Start your college checklist",
      detail: "FAFSA, counselor, and application steps",
      href: "/campus/college-checklist",
      priority: 55,
    });
  }

  return out;
}

function essayPipelineNudges(
  essays: EssayTrackerState,
  placementGoal: PlacementGoal | null | undefined,
): CampusAdmissionsNudge[] {
  const out: CampusAdmissionsNudge[] = [];
  const hasEssays = essays.essays.length > 0;
  const satFocus = placementGoal === "sat";

  if (!hasEssays && satFocus) {
    out.push({
      id: "essay-tracker-empty",
      title: "Track your application essays",
      detail: "Add prompts and deadlines in the essay tracker",
      href: "/campus/essay-tracker",
      priority: 38,
    });
  }

  return out;
}

export function getCampusAdmissionsNudges(
  checklist: CollegeChecklistState,
  essays: EssayTrackerState,
  options?: {
    placementGoal?: PlacementGoal | null;
    now?: Date;
    max?: number;
  },
): CampusAdmissionsNudge[] {
  const now = options?.now ?? new Date();
  const max = options?.max ?? 3;

  const all = [
    ...essayNudges(essays.essays, now),
    ...checklistCustomNudges(checklist, now),
    ...essayPipelineNudges(essays, options?.placementGoal),
    ...checklistBuiltInNudges(checklist, options?.placementGoal),
  ];

  const byId = new Map<string, CampusAdmissionsNudge>();
  for (const nudge of all) {
    const existing = byId.get(nudge.id);
    if (!existing || nudge.priority < existing.priority) {
      byId.set(nudge.id, nudge);
    }
  }

  const sorted = [...byId.values()].sort((a, b) => a.priority - b.priority);
  const deadline = sorted.filter(isDeadlineNudge);
  const soft = sorted.filter(isSoftNudge);
  const other = sorted.filter((n) => !isDeadlineNudge(n) && !isSoftNudge(n));

  const softCap = deadline.length > 0 ? 1 : 2;
  const merged = [...deadline, ...other, ...soft.slice(0, softCap)];
  return merged.slice(0, max);
}
