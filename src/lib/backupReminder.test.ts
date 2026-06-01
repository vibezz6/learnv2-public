import { describe, expect, it } from "vitest";
import {
  getDaysSinceBackup,
  isBackupOverdue,
  markBackupDone,
} from "@/lib/backupReminder";

function mapStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k) => map.get(k) ?? null,
    key: (i) => [...map.keys()][i] ?? null,
    removeItem: (k) => map.delete(k),
    setItem: (k, v) => map.set(k, v),
  } as Storage;
}

const DAY = 86_400_000;

describe("backupReminder", () => {
  it("is overdue when no backup has ever been made", () => {
    expect(isBackupOverdue(7, Date.now(), mapStorage())).toBe(true);
    expect(getDaysSinceBackup(Date.now(), mapStorage())).toBeNull();
  });

  it("is not overdue right after a backup", () => {
    const storage = mapStorage();
    const now = Date.now();
    markBackupDone(now, storage);
    expect(isBackupOverdue(7, now, storage)).toBe(false);
    expect(getDaysSinceBackup(now, storage)).toBe(0);
  });

  it("becomes overdue after the interval elapses", () => {
    const storage = mapStorage();
    const start = Date.now();
    markBackupDone(start, storage);
    const later = start + 8 * DAY;
    expect(isBackupOverdue(7, later, storage)).toBe(true);
    expect(getDaysSinceBackup(later, storage)).toBe(8);
  });
});
