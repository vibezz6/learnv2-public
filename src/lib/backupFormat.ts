export const BACKUP_FORMAT_VERSION = 3;

export interface BackupImportReport {
  restored: string[];
  skipped: string[];
  removed: string[];
  formatVersion: number;
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
