export const RECENT_READ_KEYS = [
  "cmd-palette-recent",
  "learnapp_recent_searches",
  "learnapp_recent_searches_v1",
] as const;

export const RECENT_WRITE_KEYS = [
  "learnapp_recent_searches_v1",
  "learnapp_recent_searches",
  "cmd-palette-recent",
] as const;

export const MAX_RECENT_SEARCHES = 5;

export function fuzzyMatch(query: string, text: string): { match: boolean; score: number } {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (t.includes(q)) return { match: true, score: 100 + (q.length / Math.max(t.length, 1)) * 50 };

  let qi = 0;
  let score = 0;
  let lastMatchIdx = -1;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      score += 10;
      if (lastMatchIdx === ti - 1) score += 15;
      if (ti === 0 || t[ti - 1] === " " || t[ti - 1] === "-") score += 5;
      lastMatchIdx = ti;
      qi++;
    }
  }
  return { match: qi === q.length, score };
}

function parseRecentList(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  } catch {
    return [];
  }
}

export function getRecentSearches(): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];

  for (const key of RECENT_READ_KEYS) {
    for (const term of parseRecentList(localStorage.getItem(key))) {
      const trimmed = term.trim();
      const lower = trimmed.toLowerCase();
      if (seen.has(lower)) continue;
      seen.add(lower);
      merged.push(trimmed);
    }
  }

  return merged.slice(0, MAX_RECENT_SEARCHES);
}

export function addRecentSearch(term: string): void {
  const trimmed = term.trim();
  if (!trimmed) return;

  const next = [
    trimmed,
    ...getRecentSearches().filter((s) => s.toLowerCase() !== trimmed.toLowerCase()),
  ].slice(0, MAX_RECENT_SEARCHES);

  const json = JSON.stringify(next);
  for (const key of RECENT_WRITE_KEYS) {
    try {
      localStorage.setItem(key, json);
    } catch {
      /* quota exceeded */
    }
  }
}

export interface ScoredCommand<T> {
  item: T;
  score: number;
}

export function scoreCommandMatch<T extends { label: string; description?: string; id: string }>(
  query: string,
  item: T,
): ScoredCommand<T> | null {
  const q = query.trim();
  if (!q) return { item, score: 0 };

  const labelMatch = fuzzyMatch(q, item.label);
  const descMatch = item.description ? fuzzyMatch(q, item.description) : { match: false, score: 0 };
  if (!labelMatch.match && !descMatch.match) return null;

  return {
    item,
    score: Math.max(labelMatch.score, descMatch.score * 0.7),
  };
}
