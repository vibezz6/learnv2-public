import { ROUTES } from "@/app/navigation";
import type { SkillNode, Subject } from "@/curriculum/types";
import { collectUrgentAdmissionsRows, type WeekDeadlineRow } from "@/lib/admissionsSummary";
import type { NodeStatus } from "@/lib/campusHome";
import type { PlacementGoal } from "@/lib/placement";
import { getSatDailyStudyCommand, shouldShowSatTodayCard, type SatDailyStudyCommand } from "@/lib/satDailyStudy";
import { getStudyIntentSubtitle, loadStudyIntent, type StudyIntentFocus } from "@/lib/studyIntent";
import { includeSat, includeCollege } from "@/lib/buildFeatures";

export type TodayPriorityKind =
  | "urgent_college"
  | "college_focus"
  | "catch_up"
  | "sat"
  | "review"
  | "continue"
  | "empty";

export type TodayPrioritySurface = "sat" | "college" | "continue" | "review" | "empty";

export interface ContinueTarget {
  subject: Subject;
  node: SkillNode;
}

export interface TodayPriority {
  kind: TodayPriorityKind;
  surface: TodayPrioritySurface;
  headline: string;
  detail: string;
  href: string;
  buttonLabel: string;
  intentFocus: StudyIntentFocus;
  pageSubtitle: string;
  satCommand?: SatDailyStudyCommand;
  continueTarget?: ContinueTarget | null;
  collegeRow?: WeekDeadlineRow | null;
}

export interface TodayPriorityInput {
  subjects: Subject[];
  getNodeStatus: (node: SkillNode) => NodeStatus;
  placementGoal?: PlacementGoal | null;
  continueTarget?: ContinueTarget | null;
  reviewDueCount?: number;
  storage?: Storage;
}

function deadlineDetail(row: WeekDeadlineRow): string {
  if (row.overdue) return "overdue";
  if (row.daysUntil === 0) return "due today";
  if (row.daysUntil === 1) return "due tomorrow";
  return `due in ${row.daysUntil} days`;
}

function firstCollegeFocusRow(storage: Storage): WeekDeadlineRow | null {
  return (
    collectUrgentAdmissionsRows(14, new Date(), undefined, undefined, storage).find(
      (row) => !row.overdue && row.daysUntil > 7,
    ) ??
    collectUrgentAdmissionsRows(14, new Date(), undefined, undefined, storage)[0] ??
    null
  );
}

export function buildTodayPriority(input: TodayPriorityInput): TodayPriority {
  const storage = input.storage ?? localStorage;
  const intentFocus = loadStudyIntent(storage).focus;
  const satCommand = getSatDailyStudyCommand({
    subjects: input.subjects,
    getNodeStatus: input.getNodeStatus,
    storage,
  });

  if (includeCollege && satCommand.kind === "college_blocking") {
    return {
      kind: "urgent_college",
      surface: "college",
      headline: satCommand.headline,
      detail: satCommand.detail,
      href: satCommand.href,
      buttonLabel: satCommand.buttonLabel,
      intentFocus,
      pageSubtitle: "College deadline first. SAT can wait until this is handled.",
      satCommand,
      continueTarget: input.continueTarget ?? null,
    };
  }

  if (intentFocus === "catch_up" && input.continueTarget) {
    return {
      kind: "catch_up",
      surface: "continue",
      headline: "Catch up today",
      detail: `Finish ${input.continueTarget.node.name} before opening anything new.`,
      href: `/subjects/${input.continueTarget.subject.id}/${input.continueTarget.node.id}`,
      buttonLabel: "Continue lesson",
      intentFocus,
      pageSubtitle: getStudyIntentSubtitle(intentFocus) ?? "Finish what is already in progress.",
      continueTarget: input.continueTarget,
      satCommand,
    };
  }

  if (includeCollege && intentFocus === "college") {
    const collegeRow = firstCollegeFocusRow(storage);
    return {
      kind: "college_focus",
      surface: "college",
      headline: collegeRow ? "College focus" : "College check-in",
      detail: collegeRow
        ? `${collegeRow.title}${collegeRow.detail ? ` — ${collegeRow.detail}` : ""} (${deadlineDetail(collegeRow)})`
        : "Review checklist, essays, and deadlines before optional SAT extras.",
      href: collegeRow?.href ?? ROUTES.collegeChecklist,
      buttonLabel: collegeRow ? "Open college task" : "Open college checklist",
      intentFocus,
      pageSubtitle: getStudyIntentSubtitle(intentFocus) ?? "Today favors college work.",
      satCommand,
      continueTarget: input.continueTarget ?? null,
      collegeRow,
    };
  }

  if (includeSat && shouldShowSatTodayCard(input.placementGoal, input.subjects, input.getNodeStatus, storage)) {
    return {
      kind: "sat",
      surface: "sat",
      headline: satCommand.headline,
      detail: satCommand.detail,
      href: satCommand.href,
      buttonLabel: satCommand.buttonLabel,
      intentFocus,
      pageSubtitle:
        getStudyIntentSubtitle(intentFocus) ??
        "One move now. Everything else can wait until the minimum is done.",
      satCommand,
      continueTarget: input.continueTarget ?? null,
    };
  }

  if (input.reviewDueCount && input.reviewDueCount > 0) {
    return {
      kind: "review",
      surface: "review",
      headline: "Spaced review",
      detail: `${input.reviewDueCount} item${input.reviewDueCount === 1 ? "" : "s"} due — clear the queue before new work.`,
      href: ROUTES.review,
      buttonLabel: "Review now",
      intentFocus,
      pageSubtitle:
        getStudyIntentSubtitle(intentFocus) ??
        "One move now. Everything else can wait until the minimum is done.",
      satCommand,
      continueTarget: input.continueTarget ?? null,
    };
  }

  if (input.continueTarget) {
    return {
      kind: "continue",
      surface: "continue",
      headline: "Continue",
      detail: input.continueTarget.node.name,
      href: `/subjects/${input.continueTarget.subject.id}/${input.continueTarget.node.id}`,
      buttonLabel: "Continue lesson",
      intentFocus,
      pageSubtitle:
        getStudyIntentSubtitle(intentFocus) ??
        "One move now. Everything else can wait until the minimum is done.",
      continueTarget: input.continueTarget,
      satCommand,
    };
  }

  return {
    kind: "empty",
    surface: "empty",
    headline: "Pick a starting point",
    detail: includeCollege
      ? "Choose a lesson, SAT task, or college deadline."
      : includeSat
        ? "Choose a lesson or SAT task."
        : "Choose a lesson or review task.",
    href: ROUTES.subjects,
    buttonLabel: "Browse subjects",
    intentFocus,
    pageSubtitle:
      getStudyIntentSubtitle(intentFocus) ??
      "One move now. Everything else can wait until the minimum is done.",
    satCommand,
    continueTarget: null,
  };
}

export function shouldShowSecondaryDrill(priority: TodayPriority): boolean {
  if (priority.kind !== "sat" || !priority.satCommand) return false;
  return priority.satCommand.kind !== "mistake_review" && priority.satCommand.kind !== "gap_lesson";
}
