import type { SatSkillId } from "@/lib/satSkills";

export const SAT_QUESTION_HISTORY_KEY = "learnv2_sat_question_history_v1";
export const SAT_QUESTION_HISTORY_SCHEMA_VERSION = 1;
const DEFAULT_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;
const MAX_ENTRIES = 500;

export interface SatQuestionSeenEntry {
  questionId: string;
  skillId?: SatSkillId;
  at: number;
}

export interface SatQuestionHistoryState {
  schemaVersion: number;
  seen: SatQuestionSeenEntry[];
}

function emptyState(): SatQuestionHistoryState {
  return { schemaVersion: SAT_QUESTION_HISTORY_SCHEMA_VERSION, seen: [] };
}

function loadRaw(storage: Storage): SatQuestionHistoryState {
  try {
    const raw = storage.getItem(SAT_QUESTION_HISTORY_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<SatQuestionHistoryState>;
    if (!parsed || !Array.isArray(parsed.seen)) return emptyState();
    const seen = parsed.seen.filter(
      (e): e is SatQuestionSeenEntry =>
        !!e &&
        typeof e === "object" &&
        typeof (e as SatQuestionSeenEntry).questionId === "string" &&
        typeof (e as SatQuestionSeenEntry).at === "number",
    );
    return { schemaVersion: SAT_QUESTION_HISTORY_SCHEMA_VERSION, seen };
  } catch {
    return emptyState();
  }
}

function saveRaw(state: SatQuestionHistoryState, storage: Storage): void {
  try {
    storage.setItem(SAT_QUESTION_HISTORY_KEY, JSON.stringify(state));
  } catch {
    /* quota */
  }
}

/** Drop entries older than maxAgeMs and cap list length. */
export function pruneSatQuestionHistory(
  storage: Storage = localStorage,
  maxAgeMs: number = DEFAULT_MAX_AGE_MS,
  now: number = Date.now(),
): void {
  const state = loadRaw(storage);
  const cutoff = now - maxAgeMs;
  const seen = state.seen.filter((e) => e.at >= cutoff).slice(-MAX_ENTRIES);
  if (seen.length !== state.seen.length) {
    saveRaw({ ...state, seen }, storage);
  }
}

export function getRecentQuestionIds(options: {
  skillId?: SatSkillId | null;
  withinMs?: number;
  storage?: Storage;
  now?: number;
}): Set<string> {
  const storage = options.storage ?? localStorage;
  const now = options.now ?? Date.now();
  const withinMs = options.withinMs ?? DEFAULT_MAX_AGE_MS;
  pruneSatQuestionHistory(storage, withinMs, now);
  const cutoff = now - withinMs;
  const ids = new Set<string>();
  for (const entry of loadRaw(storage).seen) {
    if (entry.at < cutoff) continue;
    if (options.skillId && entry.skillId && entry.skillId !== options.skillId) continue;
    ids.add(entry.questionId);
  }
  return ids;
}

export function recordSatQuestionsSeen(
  questionIds: string[],
  options: { skillId?: SatSkillId | null; storage?: Storage; now?: number } = {},
): void {
  if (questionIds.length === 0) return;
  const storage = options.storage ?? localStorage;
  const now = options.now ?? Date.now();
  const state = loadRaw(storage);
  const skillId = options.skillId ?? undefined;
  for (const questionId of questionIds) {
    state.seen.push({ questionId, skillId, at: now });
  }
  state.seen = state.seen
    .filter((e) => e.at >= now - DEFAULT_MAX_AGE_MS)
    .slice(-MAX_ENTRIES);
  saveRaw(state, storage);
}

/**
 * Prefer items whose ids are not in recentIds; backfill from recent when needed.
 * Preserves relative order within each partition.
 */
export function deprioritizeRecent<T>(
  items: T[],
  getId: (item: T) => string,
  recentIds: Set<string>,
  limit: number,
): T[] {
  if (items.length === 0 || limit <= 0) return [];
  const fresh: T[] = [];
  const recent: T[] = [];
  for (const item of items) {
    if (recentIds.has(getId(item))) recent.push(item);
    else fresh.push(item);
  }
  const merged = [...fresh, ...recent];
  return merged.slice(0, limit);
}
