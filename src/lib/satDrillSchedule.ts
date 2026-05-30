import { getTopMistakeCategories, type MistakeCategorySummary } from "@/lib/satMistakeTriage";

/**
 * Spaced re-drill scheduling (B28). Tracks when each mistake category was last
 * drilled so weak areas resurface on a cadence — you cycle through everything
 * you keep missing instead of only hammering the single top category.
 */
export const SAT_DRILL_LOG_KEY = "learnv2_sat_drill_log_v1";
export const RE_DRILL_INTERVAL_DAYS = 2;
const DAY_MS = 86_400_000;

type DrillLog = Record<string, number>;

function loadLog(storage: Storage = localStorage): DrillLog {
  try {
    const raw = storage.getItem(SAT_DRILL_LOG_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const out: DrillLog = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof v === "number") out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

function saveLog(log: DrillLog, storage: Storage = localStorage): void {
  try {
    storage.setItem(SAT_DRILL_LOG_KEY, JSON.stringify(log));
  } catch {
    /* quota */
  }
}

/** Stable log key for a mistake bucket: its canonical skill, else the raw category. */
export function getDrillKey(summary: Pick<MistakeCategorySummary, "skillId" | "category">): string {
  return summary.skillId ?? summary.category;
}

export function markCategoryDrilled(
  key: string,
  at: number = Date.now(),
  storage: Storage = localStorage,
): void {
  if (!key.trim()) return;
  const log = loadLog(storage);
  log[key] = at;
  saveLog(log, storage);
}

export interface ScheduledDrillCategory extends MistakeCategorySummary {
  lastDrilledAt: number | null;
  due: boolean;
}

/** All logged mistake categories, ordered by what to drill next (due, then most-missed). */
export function getDrillSchedule(
  storage: Storage = localStorage,
  now: number = Date.now(),
): ScheduledDrillCategory[] {
  const log = loadLog(storage);
  return getTopMistakeCategories(10, storage)
    .map((cat): ScheduledDrillCategory => {
      const logKey = getDrillKey(cat);
      const lastDrilledAt = typeof log[logKey] === "number" ? log[logKey] : null;
      const due = lastDrilledAt == null || now - lastDrilledAt >= RE_DRILL_INTERVAL_DAYS * DAY_MS;
      return { ...cat, lastDrilledAt, due };
    })
    .sort(
      (a, b) =>
        Number(b.due) - Number(a.due) ||
        b.count - a.count ||
        (a.lastDrilledAt ?? 0) - (b.lastDrilledAt ?? 0),
    );
}

export function getNextDrillCategory(
  storage: Storage = localStorage,
  now: number = Date.now(),
): ScheduledDrillCategory | null {
  return getDrillSchedule(storage, now)[0] ?? null;
}

export function getDueDrillCount(
  storage: Storage = localStorage,
  now: number = Date.now(),
): number {
  return getDrillSchedule(storage, now).filter((c) => c.due).length;
}
