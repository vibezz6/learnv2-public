/**
 * Tracks when the user last exported a backup so the UI can nudge them before
 * too long passes (the only safety net for the local-only durability model).
 */
export const LAST_BACKUP_KEY = "learnv2_last_backup_v1";
export const DEFAULT_BACKUP_INTERVAL_DAYS = 7;
const DAY_MS = 86_400_000;

export function markBackupDone(at: number = Date.now(), storage: Storage = localStorage): void {
  try {
    storage.setItem(LAST_BACKUP_KEY, JSON.stringify({ at }));
  } catch {
    /* non-fatal */
  }
}

export function getLastBackupAt(storage: Storage = localStorage): number | null {
  try {
    const raw = storage.getItem(LAST_BACKUP_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at?: number };
    return typeof parsed.at === "number" ? parsed.at : null;
  } catch {
    return null;
  }
}

export function getDaysSinceBackup(
  now: number = Date.now(),
  storage: Storage = localStorage,
): number | null {
  const at = getLastBackupAt(storage);
  if (at == null) return null;
  return Math.floor((now - at) / DAY_MS);
}

/**
 * Overdue when no backup has ever been made, or the last one is older than
 * `intervalDays`. A brand-new user with no real progress is not nagged.
 */
export function isBackupOverdue(
  intervalDays: number = DEFAULT_BACKUP_INTERVAL_DAYS,
  now: number = Date.now(),
  storage: Storage = localStorage,
): boolean {
  const at = getLastBackupAt(storage);
  if (at == null) return true;
  return now - at >= intervalDays * DAY_MS;
}
