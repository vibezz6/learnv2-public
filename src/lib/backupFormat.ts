import {
  V2_STORAGE_KEY,
  isBackupKeyAllowed,
  isManagedStorageKey,
} from "@/lib/storageRegistry";

export const BACKUP_FORMAT_VERSION = 3;

export interface BackupImportReport {
  restored: string[];
  skipped: string[];
  removed: string[];
  formatVersion: number;
}

export interface BackupRestoreResult {
  success: boolean;
  error?: string;
  importReport?: BackupImportReport;
  progressRaw?: string | null;
}

export function parseBackupKeys(
  parsed: { version?: number; keys?: Record<string, unknown> },
): { version: number; keys: Record<string, string | null> } | { error: string } {
  const version = parsed.version;
  if (version !== 2 && version !== 3) {
    return { error: "Unsupported export version." };
  }
  if (!parsed.keys || typeof parsed.keys !== "object") {
    return { error: "Invalid export format." };
  }
  const keys: Record<string, string | null> = {};
  for (const [key, value] of Object.entries(parsed.keys)) {
    if (value !== null && typeof value !== "string") {
      return { error: "Invalid export format." };
    }
    keys[key] = value === null ? null : value;
  }
  return { version, keys };
}

export function exportManagedStorage(storage: Storage = localStorage): string {
  const keys: Record<string, string | null> = {};
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key && isBackupKeyAllowed(key)) {
      keys[key] = storage.getItem(key);
    }
  }
  return JSON.stringify({ version: BACKUP_FORMAT_VERSION, keys }, null, 2);
}

export function restoreManagedStorageBackup(
  json: string,
  storage: Storage = localStorage,
): BackupRestoreResult {
  try {
    const parsed = JSON.parse(json) as { version?: number; keys?: Record<string, unknown> };
    const keysResult = parseBackupKeys(parsed);
    if ("error" in keysResult) return { success: false, error: keysResult.error };
    const report: BackupImportReport = {
      restored: [],
      skipped: [],
      removed: [],
      formatVersion: keysResult.version,
    };
    for (const [key] of Object.entries(keysResult.keys)) {
      if (!isManagedStorageKey(key)) {
        return { success: false, error: `Unsupported storage key: ${key}` };
      }
    }
    for (const [key] of Object.entries(keysResult.keys)) {
      if (!isBackupKeyAllowed(key)) {
        report.skipped.push(key);
      }
    }
    for (const [key, value] of Object.entries(keysResult.keys)) {
      if (!isBackupKeyAllowed(key)) continue;
      if (value === null) {
        storage.removeItem(key);
        report.removed.push(key);
      } else {
        storage.setItem(key, value);
        report.restored.push(key);
      }
    }
    return {
      success: true,
      importReport: report,
      progressRaw: storage.getItem(V2_STORAGE_KEY),
    };
  } catch {
    return { success: false, error: "Failed to parse import file." };
  }
}

export function clearManagedStorage(storage: Storage = localStorage): void {
  const keysToRemove: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key && isManagedStorageKey(key)) keysToRemove.push(key);
  }
  for (const key of keysToRemove) storage.removeItem(key);
}
