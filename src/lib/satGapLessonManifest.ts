import type { Subject } from "@/curriculum/types";
import { loadSatLessonPlan, type SatLessonPlanEntry } from "@/lib/satLessonPlan";

export type SatGapManifestStatus = "existing_node" | "proposed_new";

export interface SatGapManifestRow {
  nodeId: string;
  reason: string;
  priority?: number;
  status: SatGapManifestStatus;
  title?: string;
}

export interface SatGapLessonManifest {
  rows: SatGapManifestRow[];
  proposedCount: number;
  existingCount: number;
}

function resolveStatus(
  nodeId: string,
  knownNodeIds: Set<string>,
): SatGapManifestStatus {
  return knownNodeIds.has(nodeId) ? "existing_node" : "proposed_new";
}

export function buildSatGapLessonManifest(
  subjects: Subject[],
  entries: SatLessonPlanEntry[] = loadSatLessonPlan()?.entries ?? [],
): SatGapLessonManifest | null {
  if (entries.length === 0) return null;

  const satSubject = subjects.find((subject) => subject.id === "sat-prep");
  const knownNodeIds = new Set(satSubject?.nodes.map((node) => node.id) ?? []);
  const byId = new Map(satSubject?.nodes.map((node) => [node.id, node.name]) ?? []);

  const rows: SatGapManifestRow[] = entries.map((entry) => {
    const status = resolveStatus(entry.nodeId, knownNodeIds);
    return {
      nodeId: entry.nodeId,
      reason: entry.reason,
      priority: entry.priority,
      status,
      title: byId.get(entry.nodeId),
    };
  });

  const proposedCount = rows.filter((row) => row.status === "proposed_new").length;

  return {
    rows,
    proposedCount,
    existingCount: rows.length - proposedCount,
  };
}
