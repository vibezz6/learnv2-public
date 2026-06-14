import type { LearningTrack } from "@/data/tracks";
import type { SkillNode, Subject } from "@/curriculum/types";
import {
  COMING_SOON_TITLE,
  resolveTrackLesson,
} from "@/lib/trackIntegrity";
import type { NodeStatus } from "@/lib/campusHome";

export type { NodeStatus };

export interface WeekAssignment {
  subjectId: string;
  nodeId: string;
  title: string;
  status: NodeStatus;
}

export interface WeekAssignments {
  assignments: WeekAssignment[];
  dailyChallengeCategory: string | null;
}

/** Lessons assigned per calendar week on a track roadmap. */
export const LESSONS_PER_WEEK = 5;

const TRACK_CHALLENGE_CATEGORY: Record<string, string> = {
  "sat-august": "SAT",
  trader: "Trading",
  "algo-lab": "CS",
  developer: "CS",
  wealth: "Finance",
  foundation: "Math",
};

/** Map enrolled track id → daily-challenge category label. */
export function getTrackChallengeCategory(trackId: string): string | null {
  return TRACK_CHALLENGE_CATEGORY[trackId] ?? null;
}

function firstIncompleteLessonIndex(
  track: LearningTrack,
  subjects: Subject[],
  getNodeStatus: (node: SkillNode) => NodeStatus,
): number {
  for (let i = 0; i < track.lessons.length; i++) {
    const { subjectId, nodeId } = track.lessons[i];
    const resolved = resolveTrackLesson(subjectId, nodeId, subjects);
    if (!resolved) return i;

    if (getNodeStatus(resolved.node) !== "completed") return i;
  }

  return track.lessons.length;
}

/** Incomplete lessons due in the current week slice of the track, plus challenge category. */
export function getWeekAssignments(
  track: LearningTrack,
  subjects: Subject[],
  getNodeStatus: (node: SkillNode) => NodeStatus,
  limit = 5,
): WeekAssignments {
  const dailyChallengeCategory = getTrackChallengeCategory(track.id);
  const firstIncomplete = firstIncompleteLessonIndex(track, subjects, getNodeStatus);

  if (firstIncomplete >= track.lessons.length) {
    return { assignments: [], dailyChallengeCategory };
  }

  const weekStart =
    Math.floor(firstIncomplete / LESSONS_PER_WEEK) * LESSONS_PER_WEEK;
  const weekEnd = Math.min(weekStart + LESSONS_PER_WEEK, track.lessons.length);
  const assignments: WeekAssignment[] = [];

  for (let i = weekStart; i < weekEnd && assignments.length < limit; i++) {
    const { subjectId, nodeId } = track.lessons[i];
    const resolved = resolveTrackLesson(subjectId, nodeId, subjects);

    if (!resolved) {
      assignments.push({
        subjectId,
        nodeId,
        title: COMING_SOON_TITLE,
        status: "coming_soon",
      });
      continue;
    }

    const status = getNodeStatus(resolved.node);
    if (status === "completed") continue;

    assignments.push({
      subjectId,
      nodeId,
      title: resolved.node.name,
      status,
    });
  }

  return { assignments, dailyChallengeCategory };
}
