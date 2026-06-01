import { ROUTES } from "@/app/navigation";
import { daysUntilDue } from "@/lib/campusAdmissionsNudges";
import {
  getChecklistProgress,
  loadCollegeChecklist,
  type CollegeChecklistState,
} from "@/lib/collegeChecklist";
import { listCollegeRegistryDeadlines } from "@/lib/colleges";
import {
  ESSAY_STATUS_LABELS,
  getEssayTrackerProgress,
  loadEssayTracker,
  type EssayDraftStatus,
  type EssayTrackerState,
} from "@/lib/essayTracker";

export interface AdmissionsSummary {
  checklistDone: number;
  checklistTotal: number;
  checklistPct: number;
  essaysTracked: number;
  essaysFinal: number;
  essayLines: Array<{
    title: string;
    statusLabel: string;
    dueDate?: string;
    college?: string;
  }>;
  hasActivity: boolean;
}

export interface WeekDeadlineRow {
  id: string;
  title: string;
  detail?: string;
  dueDate: string;
  daysUntil: number;
  href: string;
  overdue: boolean;
}

export type BlockerKind = "essay" | "checklist" | "registry";

export interface BlockingApplicationItem {
  id: string;
  title: string;
  detail?: string;
  href: string;
  nextStep?: string;
  overdue: boolean;
  daysUntil: number;
  blockerKind: BlockerKind;
  collegeName?: string;
}

const ESSAY_NEXT_STEP: Record<EssayDraftStatus, string | null> = {
  not_started: "Move to outline",
  outline: "Write first draft",
  draft: "Start revision pass",
  revision: "Mark final when ready",
  final: null,
};

function essayNextStep(status: EssayDraftStatus): string | undefined {
  const step = ESSAY_NEXT_STEP[status];
  return step ?? undefined;
}

export function applicationPackageHref(collegeName: string): string {
  return `${ROUTES.applicationPackage}?college=${encodeURIComponent(collegeName)}`;
}

function blockerKindFromRowId(id: string): BlockerKind {
  if (id.startsWith("essay-")) return "essay";
  if (id.startsWith("college-")) return "registry";
  return "checklist";
}

/** Essays, checklist, and registry school deadlines merged and deduped by college key. */
export function collectUrgentAdmissionsRows(
  withinDays = 14,
  now = new Date(),
  checklist: CollegeChecklistState = loadCollegeChecklist(),
  essays: EssayTrackerState = loadEssayTracker(),
  storage: Storage = localStorage,
): WeekDeadlineRow[] {
  const seen = new Set<string>();
  const rows: WeekDeadlineRow[] = [];

  const push = (row: WeekDeadlineRow, collegeKey?: string) => {
    const key = (collegeKey ?? row.detail ?? row.id).toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    rows.push(row);
  };

  for (const school of listCollegeRegistryDeadlines(withinDays, now, storage)) {
    push(
      {
        id: school.id,
        title: school.title,
        detail: school.collegeName,
        dueDate: school.dueDate,
        daysUntil: school.daysUntil,
        href: applicationPackageHref(school.collegeName),
        overdue: school.overdue,
      },
      school.collegeName.toLowerCase(),
    );
  }

  for (const deadline of getWeekDeadlineRows(withinDays, now, checklist, essays)) {
    const college = deadline.detail?.trim();
    const href = college ? applicationPackageHref(college) : deadline.href;
    push({ ...deadline, href }, college?.toLowerCase());
  }

  return rows.sort((a, b) => a.daysUntil - b.daysUntil);
}

function collegeNameForRow(
  row: WeekDeadlineRow,
  essays: EssayTrackerState,
): string | undefined {
  if (row.id.startsWith("essay-")) {
    const essayId = row.id.replace("essay-", "");
    const essay = essays.essays.find((e) => e.id === essayId);
    return essay?.college?.trim() || undefined;
  }
  if (row.id.startsWith("college-")) {
    return row.detail?.trim() || row.title.trim() || undefined;
  }
  return undefined;
}

function hrefForBlocker(
  kind: BlockerKind,
  collegeName: string | undefined,
): string {
  if (collegeName) return applicationPackageHref(collegeName);
  if (kind === "essay") return ROUTES.essayTracker;
  return ROUTES.collegeChecklist;
}

export function blockingButtonLabel(
  blocker: Pick<BlockingApplicationItem, "blockerKind" | "collegeName" | "nextStep">,
): string {
  if (blocker.collegeName) return `Open ${blocker.collegeName} package`;
  if (blocker.blockerKind === "essay") return "Open essay tracker";
  if (blocker.blockerKind === "checklist") return "Open checklist";
  return blocker.nextStep ?? "Open application task";
}

/** Single highest-priority admissions action for dashboard/campus triage. */
export function getBlockingApplicationItem(
  now = new Date(),
  checklist: CollegeChecklistState = loadCollegeChecklist(),
  essays: EssayTrackerState = loadEssayTracker(),
  storage: Storage = localStorage,
): BlockingApplicationItem | null {
  const urgent = collectUrgentAdmissionsRows(14, now, checklist, essays, storage).filter(
    (row) => row.overdue || row.daysUntil <= 7,
  );
  if (urgent.length === 0) return null;

  const top = urgent[0]!;
  const blockerKind = blockerKindFromRowId(top.id);
  const collegeName = collegeNameForRow(top, essays);
  const href = hrefForBlocker(blockerKind, collegeName);
  let nextStep: string | undefined;

  if (blockerKind === "essay") {
    const essayId = top.id.replace("essay-", "");
    const essay = essays.essays.find((e) => e.id === essayId);
    if (essay) {
      nextStep = essayNextStep(essay.status);
      const statusLabel = ESSAY_STATUS_LABELS[essay.status];
      const detailParts = [top.detail, `Status: ${statusLabel}`].filter(Boolean);
      return {
        id: top.id,
        title: top.title,
        detail: detailParts.join(" · "),
        href,
        nextStep,
        overdue: top.overdue,
        daysUntil: top.daysUntil,
        blockerKind,
        collegeName,
      };
    }
  }

  if (top.overdue) {
    nextStep = "Complete or reschedule this step";
  } else if (top.daysUntil === 0) {
    nextStep = "Due today — block 30–45 min";
  } else {
    nextStep = `Due in ${top.daysUntil} day${top.daysUntil === 1 ? "" : "s"}`;
  }

  return {
    id: top.id,
    title: top.title,
    detail: top.detail,
    href,
    nextStep,
    overdue: top.overdue,
    daysUntil: top.daysUntil,
    blockerKind,
    collegeName,
  };
}

export function buildAdmissionsSummary(
  checklist: CollegeChecklistState = loadCollegeChecklist(),
  essays: EssayTrackerState = loadEssayTracker(),
): AdmissionsSummary {
  const checklistProgress = getChecklistProgress(checklist);
  const essayProgress = getEssayTrackerProgress(essays);
  const essayLines = essays.essays.map((e) => ({
    title: e.title,
    statusLabel: ESSAY_STATUS_LABELS[e.status],
    dueDate: e.dueDate,
    college: e.college,
  }));

  const hasActivity = checklistProgress.done > 0 || essays.essays.length > 0;

  return {
    checklistDone: checklistProgress.done,
    checklistTotal: checklistProgress.total,
    checklistPct: checklistProgress.pct,
    essaysTracked: essayProgress.total,
    essaysFinal: essayProgress.finalCount,
    essayLines,
    hasActivity,
  };
}

export function getWeekDeadlineRows(
  withinDays = 7,
  now = new Date(),
  checklist: CollegeChecklistState = loadCollegeChecklist(),
  essays: EssayTrackerState = loadEssayTracker(),
): WeekDeadlineRow[] {
  const rows: WeekDeadlineRow[] = [];

  for (const essay of essays.essays) {
    if (essay.status === "final" || !essay.dueDate) continue;
    const daysUntil = daysUntilDue(essay.dueDate, now);
    if (daysUntil === null || daysUntil > withinDays) continue;
    const college = essay.college?.trim();
    rows.push({
      id: `essay-${essay.id}`,
      title: essay.title,
      detail: college,
      dueDate: essay.dueDate,
      daysUntil,
      href: college
        ? applicationPackageHref(college)
        : ROUTES.essayTracker,
      overdue: daysUntil < 0,
    });
  }

  for (const item of checklist.customItems) {
    if (item.completed || !item.dueDate) continue;
    const daysUntil = daysUntilDue(item.dueDate, now);
    if (daysUntil === null || daysUntil > withinDays) continue;
    rows.push({
      id: `checklist-${item.id}`,
      title: item.title,
      dueDate: item.dueDate,
      daysUntil,
      href: ROUTES.collegeChecklist,
      overdue: daysUntil < 0,
    });
  }

  return rows.sort((a, b) => a.daysUntil - b.daysUntil).slice(0, 6);
}

/** Overdue, due today, or due tomorrow — for campus and dashboard chips. */
export function getUrgentCollegeDeadlines(
  now = new Date(),
  max = 2,
  checklist: CollegeChecklistState = loadCollegeChecklist(),
  essays: EssayTrackerState = loadEssayTracker(),
  storage: Storage = localStorage,
): WeekDeadlineRow[] {
  return collectUrgentAdmissionsRows(14, now, checklist, essays, storage)
    .filter((row) => row.overdue || (row.daysUntil >= 0 && row.daysUntil <= 1))
    .slice(0, max);
}

export function formatAdmissionsTranscriptSection(summary: AdmissionsSummary): string[] {
  if (!summary.hasActivity) return [];

  const lines: string[] = [
    "## College applications",
    "",
    `- Admissions checklist: ${summary.checklistDone}/${summary.checklistTotal} complete (${summary.checklistPct}%)`,
    `- Essays tracked: ${summary.essaysTracked} (${summary.essaysFinal} marked final)`,
    "",
  ];

  if (summary.essayLines.length > 0) {
    lines.push("### Essay pipeline", "");
    for (const essay of summary.essayLines) {
      const due = essay.dueDate ? ` · due ${essay.dueDate}` : "";
      const school = essay.college ? ` (${essay.college})` : "";
      lines.push(`- ${essay.title}${school}: ${essay.statusLabel}${due}`);
    }
    lines.push("");
  }

  return lines;
}

export function buildAdmissionsExportPayload(
  checklist: CollegeChecklistState = loadCollegeChecklist(),
  essays: EssayTrackerState = loadEssayTracker(),
) {
  return {
    exportedAt: new Date().toISOString(),
    summary: buildAdmissionsSummary(checklist, essays),
    checklist,
    essays,
  };
}
