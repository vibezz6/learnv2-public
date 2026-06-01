import {
  getEntrySkillId,
  listMistakes,
  type SatMistakeEntry,
  type SatMistakeSection,
} from "@/lib/satMistakeLog";
import { getSkillMeta, type SatSkillId } from "@/lib/satSkills";

export interface MistakeCategorySummary {
  /** Display label: the skill's label when resolved, else the raw logged category. */
  category: string;
  skillId?: SatSkillId;
  count: number;
  latestDate: string;
  latestSection: SatMistakeSection;
  nodeId?: string;
}

/**
 * Top mistake areas, grouped by canonical skill (so "comma" / "commas" /
 * "Comma splice" all roll up into one bucket). Falls back to the raw category
 * string for entries whose category doesn't resolve to a known skill.
 */
export function getTopMistakeCategories(
  limit = 3,
  storage: Storage = localStorage,
): MistakeCategorySummary[] {
  const entries = listMistakes(storage); // already sorted newest-first
  const groups = new Map<string, { entries: SatMistakeEntry[]; skillId: SatSkillId | null }>();

  for (const entry of entries) {
    const skillId = getEntrySkillId(entry);
    const key = skillId ?? `raw:${entry.category.trim().toLowerCase()}`;
    const existing = groups.get(key);
    if (existing) existing.entries.push(entry);
    else groups.set(key, { entries: [entry], skillId });
  }

  const summaries: MistakeCategorySummary[] = [];
  for (const { entries: groupEntries, skillId } of groups.values()) {
    if (groupEntries.length === 0) continue;
    const latest = groupEntries[0]!;
    const withNode = groupEntries.find((entry) => entry.nodeId);
    summaries.push({
      category: skillId ? getSkillMeta(skillId).label : latest.category,
      skillId: skillId ?? undefined,
      count: groupEntries.length,
      latestDate: latest.date,
      latestSection: latest.section,
      nodeId: withNode?.nodeId,
    });
  }

  return summaries
    .sort((a, b) => b.count - a.count || b.latestDate.localeCompare(a.latestDate))
    .slice(0, limit);
}

export function getPrimaryMistakeCategory(
  storage: Storage = localStorage,
): MistakeCategorySummary | null {
  return getTopMistakeCategories(1, storage)[0] ?? null;
}
