import type { SatMistakeSection } from "@/lib/satMistakeLog";
import { getNodeSkillId, SAT_SKILLS, type SatSkillId } from "@/lib/satSkills";

/** A weak area to target, derived from a logged mistake. */
export interface WeakTarget {
  skillId: SatSkillId | null;
  section: SatMistakeSection;
  nodeId?: string;
}

/**
 * Relevance of a node's questions to a weak target, highest first:
 *   4 = exact node, 3 = same skill, 2 = same domain, 1 = same section
 *   (general/strategy nodes count as a section match), 0 = unrelated.
 */
export function nodeRelevanceTier(nodeId: string, target: WeakTarget): number {
  if (target.nodeId && nodeId === target.nodeId) return 4;
  const skillId = getNodeSkillId(nodeId);
  if (!skillId) return 0;
  const meta = SAT_SKILLS[skillId];
  if (target.skillId) {
    if (skillId === target.skillId) return 3;
    const targetMeta = SAT_SKILLS[target.skillId];
    if (meta.domain !== "Mixed" && meta.domain === targetMeta.domain) return 2;
  }
  if (meta.section === target.section || meta.section === "general") return 1;
  return 0;
}

/** Best relevance tier across several weak targets (for the multi-target Daily 5). */
export function bestNodeTier(nodeId: string, targets: WeakTarget[]): number {
  let best = 0;
  for (const target of targets) {
    const tier = nodeRelevanceTier(nodeId, target);
    if (tier > best) best = tier;
  }
  return best;
}
