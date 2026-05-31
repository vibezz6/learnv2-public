import { describe, expect, it } from "vitest";
import {
  exportManagedStorage,
  listBackupRestoreKeys,
  parseBackupKeys,
  restoreManagedStorageBackup,
} from "@/lib/backupFormat";

function mapStorage(seed: Record<string, string> = {}): Storage {
  const map = new Map<string, string>(Object.entries(seed));
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

describe("backupFormat", () => {
  it("accepts version 2 and 3", () => {
    const v2 = parseBackupKeys({ version: 2, keys: { learnv2_progress: "{}" } });
    const v3 = parseBackupKeys({ version: 3, keys: { learnv2_activity_v1: "[]" } });
    expect("error" in v2).toBe(false);
    expect("error" in v3).toBe(false);
    if (!("error" in v2)) expect(v2.version).toBe(2);
    if (!("error" in v3)) expect(v3.version).toBe(3);
  });

  it("rejects unknown versions", () => {
    const result = parseBackupKeys({ version: 1, keys: {} });
    expect("error" in result).toBe(true);
  });

  it("listBackupRestoreKeys returns allowed keys only", () => {
    const json = JSON.stringify({
      version: 3,
      keys: {
        learnv2_progress: "{}",
        learnv2_focus_session_v1: "{}",
        learnv2_openrouter_key: "x",
      },
    });
    const result = listBackupRestoreKeys(json);
    expect("error" in result).toBe(false);
    if (!("error" in result)) {
      expect(result.keys).toContain("learnv2_progress");
      expect(result.keys).not.toContain("learnv2_focus_session_v1");
      expect(result.keys).not.toContain("learnv2_openrouter_key");
    }
  });

  it("excludes ephemeral and secret keys from export, includes real data", () => {
    const storage = mapStorage({
      learnv2_progress: JSON.stringify({ state: { data: { totalXp: 10 } } }),
      learnv2_reminders_v1: JSON.stringify({ enabled: true }),
      learnv2_focus_session_v1: JSON.stringify({ active: { id: "x" } }), // ephemeral
      learnv2_reminders_fired_v1: JSON.stringify({ daily: "2026-05-29" }), // ephemeral
      learnv2_openrouter_key: "sk-secret", // secret
    });
    const exported = JSON.parse(exportManagedStorage(storage)) as {
      keys: Record<string, string>;
    };
    expect(exported.keys.learnv2_progress).toBeTruthy();
    expect(exported.keys.learnv2_reminders_v1).toBeTruthy();
    expect(exported.keys.learnv2_focus_session_v1).toBeUndefined();
    expect(exported.keys.learnv2_reminders_fired_v1).toBeUndefined();
    expect(exported.keys.learnv2_openrouter_key).toBeUndefined();
  });

  it("round-trips real data through export -> clear -> import", () => {
    const source = mapStorage({
      learnv2_progress: JSON.stringify({ state: { data: { totalXp: 42 } } }),
      learnv2_sat_mistakes_v1: JSON.stringify([{ id: "m1" }]),
      learnv2_preferences: JSON.stringify({ state: { satTestDate: "2026-08-22" } }),
    });
    const exported = exportManagedStorage(source);

    const target = mapStorage();
    const result = restoreManagedStorageBackup(exported, target);
    expect(result.success).toBe(true);
    expect(target.getItem("learnv2_progress")).toBe(source.getItem("learnv2_progress"));
    expect(target.getItem("learnv2_sat_mistakes_v1")).toBe(
      source.getItem("learnv2_sat_mistakes_v1"),
    );
    expect(target.getItem("learnv2_preferences")).toBe(source.getItem("learnv2_preferences"));
  });
});
