import type { LearningTrack } from "@/data/tracks";
import { tracks } from "@/data/tracks";
import type { SkillNode, Subject } from "@/curriculum/types";

export type NodeStatus = "locked" | "available" | "completed";

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

export const DEFAULT_TRACK_ID = "sat-august";

export function getTrackById(id: string): LearningTrack | undefined {
  return tracks.find((track) => track.id === id);
}

function resolveTrackLesson(subjectId: string, nodeId: string, subjects: Subject[]) {
  const subject = subjects.find((s) => s.id === subjectId);
  const node = subject?.nodes.find((n) => n.id === nodeId);
  if (!subject || !node) return null;
  return { subject, node };
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

  const total = track.lessons.length;
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
    if (!resolved) continue;

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
    if (!resolved) continue;

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
