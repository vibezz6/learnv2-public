import { describe, expect, it } from "vitest";
import { parseBackupKeys } from "@/lib/backupFormat";

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
});
