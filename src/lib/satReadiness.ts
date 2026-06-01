export const SAT_READINESS_STORAGE_KEY = "learnv2_sat_readiness_v1";
export const SAT_READINESS_SCHEMA_VERSION = 1;
export const SAT_READINESS_LOG_MAX = 7;

export type SatReadinessRating = 1 | 2 | 3 | 4 | 5;

export interface SatReadinessEntry {
  date: string;
  rating: SatReadinessRating;
  bedTime?: string;
  wakeTime?: string;
  note?: string;
}

export interface SatReadinessState {
  schemaVersion: number;
  entries: SatReadinessEntry[];
}

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadRaw(storage: Storage = localStorage): SatReadinessState {
  try {
    const raw = storage.getItem(SAT_READINESS_STORAGE_KEY);
    if (!raw) return { schemaVersion: SAT_READINESS_SCHEMA_VERSION, entries: [] };
    const parsed = JSON.parse(raw) as Partial<SatReadinessState>;
    if (!parsed || !Array.isArray(parsed.entries)) {
      return { schemaVersion: SAT_READINESS_SCHEMA_VERSION, entries: [] };
    }
    const entries = parsed.entries.filter(
      (entry): entry is SatReadinessEntry =>
        !!entry &&
        typeof entry === "object" &&
        typeof (entry as SatReadinessEntry).date === "string" &&
        typeof (entry as SatReadinessEntry).rating === "number" &&
        (entry as SatReadinessEntry).rating >= 1 &&
        (entry as SatReadinessEntry).rating <= 5,
    );
    return { schemaVersion: SAT_READINESS_SCHEMA_VERSION, entries };
  } catch {
    return { schemaVersion: SAT_READINESS_SCHEMA_VERSION, entries: [] };
  }
}

function saveRaw(state: SatReadinessState, storage: Storage = localStorage): void {
  try {
    storage.setItem(SAT_READINESS_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

export function loadSatReadiness(storage: Storage = localStorage): SatReadinessState {
  return loadRaw(storage);
}

export function getTodayReadinessEntry(storage: Storage = localStorage): SatReadinessEntry | null {
  const today = todayDateString();
  return loadRaw(storage).entries.find((entry) => entry.date === today) ?? null;
}

export function logSatReadiness(
  input: {
    rating: SatReadinessRating;
    bedTime?: string;
    wakeTime?: string;
    note?: string;
    date?: string;
  },
  storage: Storage = localStorage,
): SatReadinessEntry {
  const state = loadRaw(storage);
  const date = input.date?.trim() || todayDateString();
  const entry: SatReadinessEntry = {
    date,
    rating: input.rating,
    bedTime: input.bedTime?.trim() || undefined,
    wakeTime: input.wakeTime?.trim() || undefined,
    note: input.note?.trim() || undefined,
  };

  const withoutToday = state.entries.filter((candidate) => candidate.date !== date);
  const entries = [entry, ...withoutToday]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, SAT_READINESS_LOG_MAX);

  saveRaw({ schemaVersion: SAT_READINESS_SCHEMA_VERSION, entries }, storage);
  return entry;
}

export function getReadinessNudge(storage: Storage = localStorage): string | null {
  const today = todayDateString();
  const entries = loadRaw(storage).entries;
  const todayEntry = entries.find((entry) => entry.date === today);

  if (!todayEntry) {
    return "Log how rested you feel — sleep affects tomorrow's study and test pacing.";
  }

  if (todayEntry.rating <= 2) {
    return "Low readiness today: aim for your bad-day minimum (20 min) and an early wind-down tonight.";
  }

  if (todayEntry.rating >= 4) {
    return "You logged solid readiness — good day for a timed block or Draft 2 follow-up.";
  }

  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);
  const yesterdayEntry = entries.find((entry) => entry.date === yesterdayKey);
  if (yesterdayEntry && yesterdayEntry.rating <= 2 && todayEntry.rating >= 3) {
    return "Readiness improved from yesterday — start with review before new material.";
  }

  return null;
}

export function clearSatReadiness(storage: Storage = localStorage): void {
  storage.removeItem(SAT_READINESS_STORAGE_KEY);
}
