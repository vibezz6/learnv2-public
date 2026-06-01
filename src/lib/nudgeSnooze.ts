import { notifyAdmissionsUpdated } from "@/lib/admissionsSync";
import type { CampusAdmissionsNudge } from "@/lib/campusAdmissionsNudges";

export const NUDGE_SNOOZE_KEY = "learnv2_nudge_snooze_v1";
export const DEFAULT_SNOOZE_DAYS = 7;

export interface NudgeSnoozeState {
  snoozes: Record<string, number>;
}

function emptyState(): NudgeSnoozeState {
  return { snoozes: {} };
}

function isValidState(value: unknown): value is NudgeSnoozeState {
  if (!value || typeof value !== "object") return false;
  const o = value as NudgeSnoozeState;
  return typeof o.snoozes === "object" && o.snoozes !== null;
}

export function loadNudgeSnooze(storage: Storage = localStorage): NudgeSnoozeState {
  try {
    const raw = storage.getItem(NUDGE_SNOOZE_KEY);
    if (!raw) return emptyState();
    const parsed: unknown = JSON.parse(raw);
    if (!isValidState(parsed)) return emptyState();
    return { snoozes: { ...parsed.snoozes } };
  } catch {
    return emptyState();
  }
}

export function saveNudgeSnooze(state: NudgeSnoozeState, storage: Storage = localStorage): void {
  try {
    storage.setItem(NUDGE_SNOOZE_KEY, JSON.stringify(state));
    notifyAdmissionsUpdated();
  } catch {
    // ignore quota errors
  }
}

export function pruneExpiredSnoozes(
  state: NudgeSnoozeState,
  now = Date.now(),
): NudgeSnoozeState {
  const snoozes: Record<string, number> = {};
  for (const [id, expiresAt] of Object.entries(state.snoozes)) {
    if (typeof expiresAt === "number" && expiresAt > now) {
      snoozes[id] = expiresAt;
    }
  }
  return { snoozes };
}

export function isNudgeSnoozed(
  nudgeId: string,
  state: NudgeSnoozeState,
  now = Date.now(),
): boolean {
  const expiresAt = state.snoozes[nudgeId];
  return typeof expiresAt === "number" && expiresAt > now;
}

export function snoozeNudge(
  nudgeId: string,
  days = DEFAULT_SNOOZE_DAYS,
  storage: Storage = localStorage,
  now = Date.now(),
): NudgeSnoozeState {
  const msPerDay = 86400000;
  let state = pruneExpiredSnoozes(loadNudgeSnooze(storage), now);
  state = {
    snoozes: {
      ...state.snoozes,
      [nudgeId]: now + days * msPerDay,
    },
  };
  saveNudgeSnooze(state, storage);
  return state;
}

export function filterSnoozedNudges(
  nudges: CampusAdmissionsNudge[],
  storage: Storage = localStorage,
  now = Date.now(),
): CampusAdmissionsNudge[] {
  const loaded = loadNudgeSnooze(storage);
  const state = pruneExpiredSnoozes(loaded, now);
  if (Object.keys(state.snoozes).length !== Object.keys(loaded.snoozes).length) {
    try {
      storage.setItem(NUDGE_SNOOZE_KEY, JSON.stringify(state));
    } catch {
      // ignore quota errors
    }
  }
  return nudges.filter((n) => !isNudgeSnoozed(n.id, state, now));
}

export function getActiveSnoozes(
  now = Date.now(),
  storage: Storage = localStorage,
): Array<{ id: string; expiresAt: number; daysLeft: number }> {
  const state = pruneExpiredSnoozes(loadNudgeSnooze(storage), now);
  const msPerDay = 86400000;
  return Object.entries(state.snoozes)
    .map(([id, expiresAt]) => ({
      id,
      expiresAt,
      daysLeft: Math.max(0, Math.ceil((expiresAt - now) / msPerDay)),
    }))
    .sort((a, b) => a.expiresAt - b.expiresAt);
}

export function clearAllNudgeSnoozes(storage: Storage = localStorage): void {
  saveNudgeSnooze(emptyState(), storage);
}
