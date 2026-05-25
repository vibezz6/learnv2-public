import { daysUntilDue } from "@/lib/campusAdmissionsNudges";
import {
  getChecklistProgress,
  loadCollegeChecklist,
  type CollegeChecklistState,
} from "@/lib/collegeChecklist";
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

export interface BlockingApplicationItem {
  id: string;
  title: string;
  detail?: string;
  href: string;
  nextStep?: string;
  overdue: boolean;
  daysUntil: number;
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

/** Single highest-priority admissions action for dashboard/campus triage. */
export function getBlockingApplicationItem(
  now = new Date(),
  checklist: CollegeChecklistState = loadCollegeChecklist(),
  essays: EssayTrackerState = loadEssayTracker(),
): BlockingApplicationItem | null {
  const rows = getWeekDeadlineRows(14, now, checklist, essays);
  const urgent = rows.filter((row) => row.overdue || row.daysUntil <= 7);
  if (urgent.length === 0) return null;

  const top = urgent[0]!;
  let nextStep: string | undefined;

  if (top.id.startsWith("essay-")) {
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
        href: top.href,
        nextStep,
        overdue: top.overdue,
        daysUntil: top.daysUntil,
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
    href: top.href,
    nextStep,
    overdue: top.overdue,
    daysUntil: top.daysUntil,
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
    rows.push({
      id: `essay-${essay.id}`,
      title: essay.title,
      detail: essay.college,
      dueDate: essay.dueDate,
      daysUntil,
      href: "/campus/essay-tracker",
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
      href: "/campus/college-checklist",
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
): WeekDeadlineRow[] {
  return getWeekDeadlineRows(14, now, checklist, essays)
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
