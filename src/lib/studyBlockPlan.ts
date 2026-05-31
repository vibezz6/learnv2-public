import type { SkillNode, Subject } from "@/curriculum/types";
import type { NodeStatus } from "@/lib/campusHome";
import { getBlockingApplicationItem } from "@/lib/admissionsSummary";
import { loadCollegeChecklist } from "@/lib/collegeChecklist";
import { loadEssayTracker } from "@/lib/essayTracker";
import {
  getSatDailyStudyCommand,
  type SatDailyStudyCommand,
} from "@/lib/satDailyStudy";
import type { PlacementGoal } from "@/lib/placement";

export type StudyBlockStepSource = "sat" | "college";

export interface StudyBlockStep {
  id: string;
  title: string;
  detail: string;
  href: string;
  minutes: number;
  source: StudyBlockStepSource;
  ctaLabel: string;
}

export interface StudyBlockPlan {
  title: string;
  rationale: string;
  totalMinutes: number;
  steps: StudyBlockStep[];
  primaryHref: string;
  primaryLabel: string;
}

export interface StudyBlockPlanInput {
  subjects: Subject[];
  getNodeStatus: (node: SkillNode) => NodeStatus;
  placementGoal?: PlacementGoal | null;
  storage?: Storage;
  now?: Date;
}

function satStepTitle(command: SatDailyStudyCommand): string {
  switch (command.kind) {
    case "resume_draft1":
    case "resume_draft2":
      return "SAT: resume the active check";
    case "start_draft1":
      return "SAT: official practice block";
    case "track_lesson":
      return "SAT: next August track lesson";
    case "gap_lesson":
      return "SAT: targeted gap drill";
    case "mistake_review":
      return "SAT: mistake review";
    case "diagnostic_optional":
      return "SAT: optional diagnostic follow-up";
    case "college_blocking":
      return "College: urgent application step";
  }
}

function duePhrase(daysUntil: number, overdue: boolean): string {
  if (overdue) {
    const days = Math.abs(daysUntil);
    return `${days} day${days === 1 ? "" : "s"} overdue`;
  }
  if (daysUntil === 0) return "Due today";
  return `Due in ${daysUntil} day${daysUntil === 1 ? "" : "s"}`;
}

/** Build one concrete short-session plan from local SAT and admissions state. */
export function buildStudyBlockPlan(input: StudyBlockPlanInput): StudyBlockPlan {
  const storage = input.storage ?? localStorage;
  const satCommand = getSatDailyStudyCommand({
    subjects: input.subjects,
    getNodeStatus: input.getNodeStatus,
    storage,
  });
  const blocker = getBlockingApplicationItem(
    input.now ?? new Date(),
    loadCollegeChecklist(storage),
    loadEssayTracker(storage),
  );

  const steps: StudyBlockStep[] = [
    {
      id: `sat-${satCommand.kind}`,
      title: satStepTitle(satCommand),
      detail: satCommand.detail,
      href: satCommand.href,
      minutes: 15,
      source: "sat",
      ctaLabel: satCommand.buttonLabel,
    },
  ];

  if (blocker) {
    const detailParts = [
      blocker.nextStep,
      blocker.detail,
      duePhrase(blocker.daysUntil, blocker.overdue),
    ].filter(Boolean);
    steps.push({
      id: `college-${blocker.id}`,
      title: `College: ${blocker.title}`,
      detail: detailParts.join(" · "),
      href: blocker.href,
      minutes: 5,
      source: "college",
      ctaLabel: "Open college step",
    });
  } else {
    steps.push({
      id: "sat-log-takeaway",
      title: "SAT: log one miss or takeaway",
      detail: "Capture one mistake pattern so tomorrow's drill stays targeted.",
      href: "/subjects/sat-prep#mistakes",
      minutes: 5,
      source: "sat",
      ctaLabel: "Open mistake log",
    });
  }

  const totalMinutes = steps.reduce((sum, step) => sum + step.minutes, 0);
  const rationale = blocker
    ? "SAT first, then clear the closest college blocker before it grows."
    : satCommand.intensity === "minimum"
      ? "Light day: keep the SAT streak alive with review and one concrete takeaway."
      : "A short SAT-first block for August prep, with the log step that makes tomorrow easier.";

  return {
    title: `${totalMinutes}-minute study block`,
    rationale,
    totalMinutes,
    steps,
    primaryHref: steps[0]?.href ?? "/subjects/sat-prep",
    primaryLabel: steps[0]?.ctaLabel ?? "Start studying",
  };
}
