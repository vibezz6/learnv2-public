import type { SkillNode } from "@/curriculum/types";

export type NodeProgressReader = (nodeId: string) => { completedAt: string | null };

/** Parent node ids that are not yet completed for this node. */
export function getMissingParents(
  node: SkillNode,
  getNodeProgress: NodeProgressReader,
): string[] {
  return node.parentIds.filter((pid) => !getNodeProgress(pid).completedAt);
}

export function getLockTooltip(
  node: SkillNode,
  getNodeProgress: NodeProgressReader,
  resolveName: (nodeId: string) => string,
): string | null {
  const missing = getMissingParents(node, getNodeProgress);
  if (missing.length === 0) return null;
  const names = missing.map((id) => resolveName(id) || id);
  if (names.length === 1) return `Complete "${names[0]}" first`;
  return `Complete first: ${names.join(", ")}`;
}

export function isNodeLocked(node: SkillNode, getNodeProgress: NodeProgressReader): boolean {
  if (getNodeProgress(node.id).completedAt) return false;
  if (node.parentIds.length === 0) return false;
  return getMissingParents(node, getNodeProgress).length > 0;
}
