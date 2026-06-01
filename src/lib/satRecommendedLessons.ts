import { tracks } from "@/data/tracks";
import { SAT_PRETEST_DRAFT_1_ID } from "@/data/satPretestDraft1";
import type { SkillNode, Subject } from "@/curriculum/types";
import {
  DEFAULT_TRACK_ID,
  getSatNextLesson,
  type NodeStatus,
} from "@/lib/campusHome";
import { loadSatLessonPlan } from "@/lib/satLessonPlan";
import { getLatestCompletedSatPretestAttempt } from "@/lib/satPretest";
import { resolveTrackLesson } from "@/lib/trackIntegrity";

export type SatRecommendedSource = "pretest_gaps" | "lesson_plan" | "track_next" | "empty";

export interface SatRecommendedLesson {
  subjectId: string;
  nodeId: string;
  title: string;
  reason: string;
  status: NodeStatus;
}

export interface SatRecommendedPlan {
  source: SatRecommendedSource;
  draft1Complete: boolean;
  lessons: SatRecommendedLesson[];
  emptyMessage: string;
}

const MAX_LESSONS = 3;

function satTrackOrder(nodeId: string): number {
  const track = tracks.find((candidate) => candidate.id === DEFAULT_TRACK_ID);
  if (!track) return 9999;
  return track.lessons.findIndex(
    (lesson) => lesson.subjectId === "sat-prep" && lesson.nodeId === nodeId,
  );
}

function lessonsFromLessonPlan(
  subjects: Subject[],
  getNodeStatus: (node: SkillNode) => NodeStatus,
): SatRecommendedLesson[] {
  const plan = loadSatLessonPlan();
  if (!plan) return [];

  const satSubject = subjects.find((subject) => subject.id === "sat-prep");
  if (!satSubject) return [];

  const byId = new Map(satSubject.nodes.map((node) => [node.id, node]));
  const lessons: SatRecommendedLesson[] = [];

  for (const entry of plan.entries) {
    const node = byId.get(entry.nodeId);
    if (!node) continue;
    const status = getNodeStatus(node);
    if (status === "completed") continue;

    lessons.push({
      subjectId: "sat-prep",
      nodeId: entry.nodeId,
      title: node.name,
      reason: entry.reason,
      status,
    });
    if (lessons.length >= MAX_LESSONS) break;
  }

  return lessons;
}

function lessonsFromPretestGaps(
  subjects: Subject[],
  getNodeStatus: (node: SkillNode) => NodeStatus,
  recommendedNodeIds: string[],
): SatRecommendedLesson[] {
  const satSubject = subjects.find((subject) => subject.id === "sat-prep");
  if (!satSubject) return [];

  const byId = new Map(satSubject.nodes.map((node) => [node.id, node]));
  const lessons: SatRecommendedLesson[] = [];

  for (const nodeId of [...recommendedNodeIds].sort(
    (a, b) => satTrackOrder(a) - satTrackOrder(b),
  )) {
    const node = byId.get(nodeId);
    if (!node) continue;
    const status = getNodeStatus(node);
    if (status === "completed") continue;

    lessons.push({
      subjectId: "sat-prep",
      nodeId,
      title: node.name,
      reason: "Linked from a missed Draft 1 question",
      status,
    });
    if (lessons.length >= MAX_LESSONS) break;
  }

  return lessons;
}

/** True when this SAT lesson is a gap or imported plan target (show post-complete follow-up). */
export function isSatTargetedLesson(
  nodeId: string,
  subjects: Subject[],
  getNodeStatus: (node: SkillNode) => NodeStatus,
): boolean {
  const plan = getSatRecommendedLessons(subjects, getNodeStatus);
  if (plan.source !== "pretest_gaps" && plan.source !== "lesson_plan") return false;
  return plan.lessons.some((lesson) => lesson.nodeId === nodeId);
}

export function getSatRecommendedLessons(
  subjects: Subject[],
  getNodeStatus: (node: SkillNode) => NodeStatus,
): SatRecommendedPlan {
  const draft1Done = getLatestCompletedSatPretestAttempt(SAT_PRETEST_DRAFT_1_ID);
  const draft1Complete = !!draft1Done;

  const planLessons = lessonsFromLessonPlan(subjects, getNodeStatus);
  if (planLessons.length > 0) {
    return {
      source: "lesson_plan",
      draft1Complete,
      lessons: planLessons,
      emptyMessage: "",
    };
  }

  const gapIds = draft1Done?.scoreSummary?.recommendedNodeIds ?? [];
  if (draft1Complete && gapIds.length > 0) {
    const gapLessons = lessonsFromPretestGaps(subjects, getNodeStatus, gapIds);
    if (gapLessons.length > 0) {
      return {
        source: "pretest_gaps",
        draft1Complete,
        lessons: gapLessons,
        emptyMessage: "",
      };
    }
  }

  const next = getSatNextLesson(subjects, getNodeStatus);
  if (next) {
    const resolved = resolveTrackLesson(next.subjectId, next.nodeId, subjects);
    if (next.status !== "coming_soon" && resolved) {
      return {
        source: "track_next",
        draft1Complete,
        lessons: [
          {
            subjectId: next.subjectId,
            nodeId: next.nodeId,
            title: next.title,
            reason: draft1Complete
              ? "Next lesson on the August SAT track"
              : "Follow the August SAT track until you take Draft 1",
            status: next.status,
          },
        ],
        emptyMessage: "",
      };
    }
  }

  return {
    source: "empty",
    draft1Complete,
    lessons: [],
    emptyMessage: draft1Complete
      ? "Draft 1 gaps are covered here — keep going on the skill tree or run Draft 2."
      : "Take Draft 1 when you want gap-targeted lessons, or follow the skill tree below.",
  };
}
