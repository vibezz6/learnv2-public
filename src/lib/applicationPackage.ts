import { daysUntilDue } from "@/lib/campusAdmissionsNudges";
import {
  getChecklistProgress,
  groupBuiltInByCategory,
  loadCollegeChecklist,
  type CollegeChecklistState,
} from "@/lib/collegeChecklist";
import {
  ESSAY_STATUS_LABELS,
  loadEssayTracker,
  wordLimitForEntry,
  type EssayEntry,
  type EssayTrackerState,
} from "@/lib/essayTracker";
import { getBlockingApplicationItem } from "@/lib/admissionsSummary";
import { collegeDeadlineForPackage } from "@/lib/colleges";

export const GENERAL_APPLICATION_COLLEGE = "General application";

export interface ApplicationPackageEssayRow {
  id: string;
  title: string;
  statusLabel: string;
  dueDate?: string;
  wordLimit?: number;
}

export interface ApplicationPackageChecklistRow {
  id: string;
  title: string;
  done: boolean;
  dueDate?: string;
  isCustom: boolean;
}

export type ApplicationPackageDeadlineTone = "muted" | "active" | "overdue";

export interface ApplicationPackageDeadline {
  label: string;
  overdue: boolean;
  daysUntil: number | null;
  tone: ApplicationPackageDeadlineTone;
}

/** Human-readable deadline badge from days-until (essay-min source in B61). */
export function formatPackageDeadlineAriaLabel(deadline: ApplicationPackageDeadline): string {
  if (deadline.daysUntil === null) return "No deadline set for this school";
  return `Application deadline: ${deadline.label}`;
}

export function formatPackageDeadline(daysUntil: number | null): ApplicationPackageDeadline {
  if (daysUntil === null) {
    return { label: "No deadline set", overdue: false, daysUntil: null, tone: "muted" };
  }
  if (daysUntil < 0) {
    const days = Math.abs(daysUntil);
    return {
      label: `Overdue by ${days} day${days === 1 ? "" : "s"}`,
      overdue: true,
      daysUntil,
      tone: "overdue",
    };
  }
  if (daysUntil === 0) {
    return { label: "Due today", overdue: false, daysUntil: 0, tone: "active" };
  }
  if (daysUntil === 1) {
    return { label: "Due tomorrow", overdue: false, daysUntil: 1, tone: "active" };
  }
  return {
    label: `${daysUntil} days until deadline`,
    overdue: false,
    daysUntil,
    tone: daysUntil <= 30 ? "active" : "muted",
  };
}

export interface ApplicationPackageDoFirst {
  title: string;
  detail?: string;
  href: string;
}

export interface ApplicationPackageView {
  college: string;
  deadline: ApplicationPackageDeadline;
  doThisFirst: ApplicationPackageDoFirst | null;
  essays: ApplicationPackageEssayRow[];
  checklistRows: ApplicationPackageChecklistRow[];
  checklistDone: number;
  checklistTotal: number;
  checklistPct: number;
  checklistHasMore: boolean;
}

/** Distinct college names from essays; includes General when unassigned essays exist. */
export function listApplicationColleges(
  essays: EssayTrackerState = loadEssayTracker(),
): string[] {
  const names = new Set<string>();
  let hasUnassigned = false;
  for (const essay of essays.essays) {
    const trimmed = essay.college?.trim();
    if (trimmed) names.add(trimmed);
    else hasUnassigned = true;
  }
  const list = [...names].sort((a, b) => a.localeCompare(b));
  if (hasUnassigned || list.length === 0) {
    if (!list.includes(GENERAL_APPLICATION_COLLEGE)) {
      list.unshift(GENERAL_APPLICATION_COLLEGE);
    }
  }
  return list.length > 0 ? list : [GENERAL_APPLICATION_COLLEGE];
}

function essaysForCollege(college: string, essays: EssayTrackerState): EssayEntry[] {
  if (college === GENERAL_APPLICATION_COLLEGE) {
    return essays.essays.filter((e) => !e.college?.trim());
  }
  return essays.essays.filter((e) => e.college?.trim() === college);
}

function minEssayDaysUntil(essayRows: EssayEntry[], now: Date): number | null {
  let bestDays: number | null = null;
  for (const essay of essayRows) {
    if (!essay.dueDate || essay.status === "final") continue;
    const days = daysUntilDue(essay.dueDate, now);
    if (days === null) continue;
    if (bestDays === null || days < bestDays) bestDays = days;
  }
  return bestDays;
}

function deadlineForCollege(essayRows: EssayEntry[], now: Date): ApplicationPackageDeadline {
  return formatPackageDeadline(minEssayDaysUntil(essayRows, now));
}

function countChecklistRows(checklist: CollegeChecklistState): number {
  let n = 0;
  for (const [, items] of groupBuiltInByCategory()) n += items.length;
  return n + checklist.customItems.length;
}

function pickChecklistPreview(
  checklist: CollegeChecklistState,
  limit = 8,
): ApplicationPackageChecklistRow[] {
  const rows: ApplicationPackageChecklistRow[] = [];
  for (const [, items] of groupBuiltInByCategory()) {
    for (const item of items) {
      rows.push({
        id: item.id,
        title: item.title,
        done: !!checklist.completed[item.id],
        isCustom: false,
      });
    }
  }
  for (const item of checklist.customItems) {
    rows.push({
      id: item.id,
      title: item.title,
      done: item.completed,
      dueDate: item.dueDate,
      isCustom: true,
    });
  }
  const incomplete = rows.filter((r) => !r.done);
  const complete = rows.filter((r) => r.done);
  incomplete.sort((a, b) => {
    const da = a.dueDate ? daysUntilDue(a.dueDate) ?? 9999 : 9999;
    const db = b.dueDate ? daysUntilDue(b.dueDate) ?? 9999 : 9999;
    return da - db;
  });
  return [...incomplete, ...complete].slice(0, limit);
}

export function getPackageDoThisFirst(
  college: string,
  essayRows: EssayEntry[],
  now: Date = new Date(),
): ApplicationPackageDoFirst | null {
  const blocker = getBlockingApplicationItem(now);
  if (blocker) {
    if (blocker.id.startsWith("essay-")) {
      const essayId = blocker.id.replace("essay-", "");
      const matches = essayRows.some((e) => e.id === essayId);
      if (matches) {
        return {
          title: blocker.title,
          detail: blocker.nextStep ?? blocker.detail,
          href: blocker.href,
        };
      }
    } else if (blocker.id.startsWith("checklist-")) {
      const essayUrgent = minEssayDaysUntil(essayRows, now);
      const showChecklistBlocker =
        college === GENERAL_APPLICATION_COLLEGE ||
        essayRows.length === 0 ||
        essayUrgent === null ||
        essayUrgent > 7;
      if (showChecklistBlocker) {
        return {
          title: blocker.title,
          detail: blocker.nextStep ?? blocker.detail,
          href: blocker.href,
        };
      }
    }
  }

  const nextEssay = essayRows
    .filter((e) => e.status !== "final" && e.dueDate)
    .map((e) => ({ essay: e, days: daysUntilDue(e.dueDate!, now) ?? 9999 }))
    .sort((a, b) => a.days - b.days)[0]?.essay;

  if (nextEssay) {
    return {
      title: nextEssay.title,
      detail: `Status: ${ESSAY_STATUS_LABELS[nextEssay.status]}`,
      href: "/campus/essay-tracker",
    };
  }

  const progress = getChecklistProgress(loadCollegeChecklist());
  if (progress.done < progress.total) {
    const preview = pickChecklistPreview(loadCollegeChecklist(), 1).find((r) => !r.done);
    if (preview) {
      return {
        title: preview.title,
        detail: "Next shared checklist step",
        href: "/campus/college-checklist",
      };
    }
  }

  return null;
}

const CHECKLIST_PREVIEW_LIMIT = 8;

export function buildApplicationPackage(
  college: string,
  options: {
    checklist?: CollegeChecklistState;
    essays?: EssayTrackerState;
    now?: Date;
    checklistPreviewLimit?: number;
    schoolDeadline?: string | null;
    storage?: Storage;
  } = {},
): ApplicationPackageView {
  const storage = options.storage ?? localStorage;
  const checklist = options.checklist ?? loadCollegeChecklist(storage);
  const essays = options.essays ?? loadEssayTracker(storage);
  const now = options.now ?? new Date();
  const essayEntries = essaysForCollege(college, essays);
  const progress = getChecklistProgress(checklist);
  const previewLimit = options.checklistPreviewLimit ?? CHECKLIST_PREVIEW_LIMIT;
  const totalRows = countChecklistRows(checklist);

  const registryDeadline =
    options.schoolDeadline ?? collegeDeadlineForPackage(college, storage);
  let deadline = deadlineForCollege(essayEntries, now);
  if (registryDeadline) {
    const schoolDays = daysUntilDue(registryDeadline, now);
    if (schoolDays !== null) deadline = formatPackageDeadline(schoolDays);
  }

  return {
    college,
    deadline,
    doThisFirst: getPackageDoThisFirst(college, essayEntries, now),
    essays: essayEntries.map((e) => ({
      id: e.id,
      title: e.title,
      statusLabel: ESSAY_STATUS_LABELS[e.status],
      dueDate: e.dueDate,
      wordLimit: wordLimitForEntry(e),
    })),
    checklistRows: pickChecklistPreview(checklist, previewLimit),
    checklistDone: progress.done,
    checklistTotal: progress.total,
    checklistPct: progress.pct,
    checklistHasMore: totalRows > previewLimit,
  };
}

export function decodeCollegeParam(raw: string | null): string | null {
  if (!raw?.trim()) return null;
  try {
    return decodeURIComponent(raw.trim());
  } catch {
    return raw.trim();
  }
}

export function resolveApplicationCollege(
  colleges: string[],
  requested?: string | null,
): string | null {
  const decoded = decodeCollegeParam(requested ?? null);
  if (!decoded) return null;
  if (colleges.includes(decoded)) return decoded;
  return null;
}
