import {
  groupByCategory,
  listMistakes,
  type SatMistakeSection,
} from "@/lib/satMistakeLog";

export interface MistakeCategorySummary {
  category: string;
  count: number;
  latestDate: string;
  latestSection: SatMistakeSection;
  nodeId?: string;
}

export function getTopMistakeCategories(
  limit = 3,
  storage: Storage = localStorage,
): MistakeCategorySummary[] {
  const grouped = groupByCategory(listMistakes(storage));
  const summaries: MistakeCategorySummary[] = [];

  for (const [category, entries] of Object.entries(grouped)) {
    if (entries.length === 0) continue;
    const latest = entries[0]!;
    const withNode = entries.find((entry) => entry.nodeId);
    summaries.push({
      category,
      count: entries.length,
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
