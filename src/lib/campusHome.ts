import type { LearningTrack } from "@/data/tracks";
import { tracks } from "@/data/tracks";
import type { SkillNode, Subject } from "@/curriculum/types";
import { includeSat, SAT_TRACK_ID } from "@/lib/buildFeatures";
import {
  COMING_SOON_TITLE,
  countAvailableTrackLessons,
  resolveTrackLesson,
} from "@/lib/trackIntegrity";

export type NodeStatus = "locked" | "available" | "completed" | "coming_soon";

export interface TrackProgress {
  completed: number;
  total: number;
  pct: number;
}

export interface SyllabusNode {
  subjectId: string;
  nodeId: string;
  title: string;
  status: NodeStatus;
}

export const DEFAULT_TRACK_ID = includeSat ? SAT_TRACK_ID : "foundation";

export function getTrackById(id: string): LearningTrack | undefined {
  return tracks.find((track) => track.id === id);
}

export function getTrackProgress(
  track: LearningTrack,
  subjects: Subject[],
  getNodeStatus: (node: SkillNode) => NodeStatus,
): TrackProgress {
  let completed = 0;

  for (const { subjectId, nodeId } of track.lessons) {
    const resolved = resolveTrackLesson(subjectId, nodeId, subjects);
    if (resolved && getNodeStatus(resolved.node) === "completed") {
      completed++;
    }
  }

  const total = countAvailableTrackLessons(track, subjects);
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { completed, total, pct };
}

export function getWeeklySyllabusNodes(
  track: LearningTrack,
  subjects: Subject[],
  getNodeStatus: (node: SkillNode) => NodeStatus,
  limit = 5,
): SyllabusNode[] {
  const nodes: SyllabusNode[] = [];

  for (const { subjectId, nodeId } of track.lessons) {
    const resolved = resolveTrackLesson(subjectId, nodeId, subjects);
    if (!resolved) {
      nodes.push({
        subjectId,
        nodeId,
        title: COMING_SOON_TITLE,
        status: "coming_soon",
      });
      if (nodes.length >= limit) break;
      continue;
    }

    const status = getNodeStatus(resolved.node);
    if (status === "completed") continue;

    nodes.push({
      subjectId,
      nodeId,
      title: resolved.node.name,
      status,
    });

    if (nodes.length >= limit) break;
  }

  return nodes;
}

export function getSatNextLesson(
  subjects: Subject[],
  getNodeStatus: (node: SkillNode) => NodeStatus,
): SyllabusNode | null {
  const track = getTrackById(DEFAULT_TRACK_ID);
  if (!track) return null;

  for (const { subjectId, nodeId } of track.lessons) {
    if (subjectId !== "sat-prep") continue;

    const resolved = resolveTrackLesson(subjectId, nodeId, subjects);
    if (!resolved) {
      return {
        subjectId,
        nodeId,
        title: COMING_SOON_TITLE,
        status: "coming_soon",
      };
    }

    const status = getNodeStatus(resolved.node);
    if (status !== "completed") {
      return {
        subjectId,
        nodeId,
        title: resolved.node.name,
        status,
      };
    }
  }

  return null;
}
