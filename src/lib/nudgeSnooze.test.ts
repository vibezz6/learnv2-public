import { beforeEach, describe, expect, it } from "vitest";
import type { CampusAdmissionsNudge } from "./campusAdmissionsNudges";
import {
  DEFAULT_SNOOZE_DAYS,
  filterSnoozedNudges,
  isNudgeSnoozed,
  loadNudgeSnooze,
  snoozeNudge,
} from "./nudgeSnooze";

function mockStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => map.set(k, v),
    removeItem: (k) => map.delete(k),
    key: (i) => [...map.keys()][i] ?? null,
  };
}

const sample: CampusAdmissionsNudge[] = [
  { id: "essay-tracker-empty", title: "Track essays", href: "/campus/essay-tracker", priority: 38 },
  { id: "checklist-start", title: "Start checklist", href: "/campus/college-checklist", priority: 55 },
];

describe("nudgeSnooze", () => {
  let storage: Storage;
  const now = new Date("2026-05-24T12:00:00Z").getTime();

  beforeEach(() => {
    storage = mockStorage();
  });

  it("snoozes a nudge for seven days by default", () => {
    snoozeNudge("essay-tracker-empty", DEFAULT_SNOOZE_DAYS, storage, now);
    const state = loadNudgeSnooze(storage);
    expect(isNudgeSnoozed("essay-tracker-empty", state, now)).toBe(true);
    expect(isNudgeSnoozed("essay-tracker-empty", state, now + 6 * 86400000)).toBe(true);
    expect(isNudgeSnoozed("essay-tracker-empty", state, now + 8 * 86400000)).toBe(false);
  });

  it("filterSnoozedNudges removes only snoozed ids", () => {
    snoozeNudge("essay-tracker-empty", 7, storage, now);
    const filtered = filterSnoozedNudges(sample, storage, now);
    expect(filtered.map((n) => n.id)).toEqual(["checklist-start"]);
  });
});
