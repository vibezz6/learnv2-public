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
