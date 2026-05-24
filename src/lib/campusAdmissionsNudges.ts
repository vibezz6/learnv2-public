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

const BUILTIN_NUDGE_IDS = ["fafsa-submit", "essay-draft", "sat-send-scores"] as const;

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
  const satFocus = placementGoal === "sat" || placementGoal === null;

  for (const id of BUILTIN_NUDGE_IDS) {
    if (state.completed[id]) continue;
    const def = DEFAULT_COLLEGE_CHECKLIST.find((i) => i.id === id);
    if (!def) continue;
    if (!satFocus && (id === "sat-send-scores" || id === "essay-draft")) continue;

    out.push({
      id: `checklist-builtin-${id}`,
      title: def.title,
      detail: def.category,
      href: "/campus/college-checklist",
      priority: id === "essay-draft" ? 42 : id === "fafsa-submit" ? 44 : 46,
    });
  }

  const doneBuiltIn = DEFAULT_COLLEGE_CHECKLIST.filter((i) => state.completed[i.id]).length;
  if (doneBuiltIn < 2) {
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
  checklist: CollegeChecklistState,
  placementGoal: PlacementGoal | null | undefined,
): CampusAdmissionsNudge[] {
  const out: CampusAdmissionsNudge[] = [];
  const hasEssays = essays.essays.length > 0;
  const draftIncomplete = !checklist.completed["essay-draft"];
  const satFocus = placementGoal === "sat";

  if (!hasEssays && (satFocus || draftIncomplete)) {
    out.push({
      id: "essay-tracker-empty",
      title: "Track your application essays",
      detail: "Add prompts and deadlines in the essay tracker",
      href: "/campus/essay-tracker",
      priority: 50,
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
    ...essayPipelineNudges(essays, checklist, options?.placementGoal),
    ...checklistBuiltInNudges(checklist, options?.placementGoal),
  ];

  const byId = new Map<string, CampusAdmissionsNudge>();
  for (const nudge of all) {
    const existing = byId.get(nudge.id);
    if (!existing || nudge.priority < existing.priority) {
      byId.set(nudge.id, nudge);
    }
  }

  return [...byId.values()].sort((a, b) => a.priority - b.priority).slice(0, max);
}
