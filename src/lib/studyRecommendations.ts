import type { SkillNode, Subject } from "@/curriculum/types";
import type { NodeStatus } from "@/lib/campusHome";
import { getBlockingApplicationItem } from "@/lib/admissionsSummary";
import { loadCollegeChecklist } from "@/lib/collegeChecklist";
import { loadEssayTracker } from "@/lib/essayTracker";
import { buildSatMicroDrill } from "@/lib/satMicroDrills";
import { getTodayStudySummary } from "@/lib/studyActivity";
import { includeSat, includeCollege } from "@/lib/buildFeatures";

export interface StudyRecommendation {
  id: string;
  title: string;
  reason: string;
  href: string;
  label: string;
}

export interface StudyRecommendationInput {
  subjects: Subject[];
  getNodeStatus: (node: SkillNode) => NodeStatus;
  reviewDueCount: number;
  storage?: Storage;
  now?: Date;
}

export function buildStudyRecommendations(
  input: StudyRecommendationInput,
  limit = 3,
): StudyRecommendation[] {
  const storage = input.storage ?? localStorage;
  const rows: StudyRecommendation[] = [];
  const blocker = getBlockingApplicationItem(
    input.now ?? new Date(),
    loadCollegeChecklist(storage),
    loadEssayTracker(storage),
  );
  if (includeCollege && blocker) {
    rows.push({
      id: "college-blocker",
      title: blocker.title,
      reason: blocker.nextStep ?? blocker.detail ?? "Closest college application blocker.",
      href: blocker.href,
      label: "Open college step",
    });
  }

  const drill = includeSat ? buildSatMicroDrill(input.subjects, storage, 3) : { questions: [], title: "", reason: "", href: "" };
  if (includeSat && drill.questions.length > 0) {
    rows.push({
      id: "sat-micro-drill",
      title: drill.title,
      reason: drill.reason,
      href: drill.href,
      label: "Open SAT drill",
    });
  }

  if (input.reviewDueCount > 0) {
    rows.push({
      id: "review-due",
      title: "Clear spaced review",
      reason: `${input.reviewDueCount} item${input.reviewDueCount === 1 ? "" : "s"} due.`,
      href: "/review",
      label: "Review now",
    });
  }

  const today = getTodayStudySummary(undefined, storage);
  if (today.eventCount === 0) {
    rows.push({
      id: "start-today",
      title: "Start one study action",
      reason: "No study logged yet today.",
      href: "/",
      label: "Open Today",
    });
  }

  const result = rows.slice(0, limit);
  return result;
}
