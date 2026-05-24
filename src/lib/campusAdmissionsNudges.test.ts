import { beforeEach, describe, expect, it } from "vitest";
import { addCustomItem, loadCollegeChecklist } from "./collegeChecklist";
import { addEssayFromTemplate, loadEssayTracker } from "./essayTracker";
import { daysUntilDue, getCampusAdmissionsNudges } from "./campusAdmissionsNudges";
import { snoozeNudge } from "./nudgeSnooze";

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

describe("campusAdmissionsNudges", () => {
  let storage: Storage;
  const now = new Date("2026-05-24T12:00:00Z");

  beforeEach(() => {
    storage = mockStorage();
  });

  it("prioritizes overdue essay over checklist hints", () => {
    let essays = loadEssayTracker();
    essays = addEssayFromTemplate(essays, "common-app-personal", { dueDate: "2026-05-20" });
    const nudges = getCampusAdmissionsNudges(loadCollegeChecklist(), essays, {
      placementGoal: "sat",
      now,
      max: 3,
    });
    expect(nudges[0]?.id).toMatch(/^essay-overdue-/);
    expect(nudges[0]?.href).toBe("/campus/essay-tracker");
  });

  it("surfaces custom checklist due within a week", () => {
    let checklist = loadCollegeChecklist();
    checklist = addCustomItem(checklist, "Submit State U app", "2026-05-28");
    const nudges = getCampusAdmissionsNudges(checklist, loadEssayTracker(), { now, max: 5 });
    expect(nudges.some((n) => n.id.startsWith("checklist-due-"))).toBe(true);
  });

  it("suggests essay tracker when SAT focus and no essays", () => {
    const nudges = getCampusAdmissionsNudges(loadCollegeChecklist(), loadEssayTracker(), {
      placementGoal: "sat",
      max: 5,
    });
    expect(nudges.some((n) => n.id === "essay-tracker-empty")).toBe(true);
  });

  it("does not nag explore placement with essay tracker empty", () => {
    const nudges = getCampusAdmissionsNudges(loadCollegeChecklist(), loadEssayTracker(), {
      placementGoal: "explore",
      max: 5,
    });
    expect(nudges.some((n) => n.id === "essay-tracker-empty")).toBe(false);
    expect(nudges.some((n) => n.id.startsWith("checklist-builtin-essay"))).toBe(false);
  });

  it("limits soft nudges when deadlines exist", () => {
    let essays = loadEssayTracker();
    essays = addEssayFromTemplate(essays, "why-us", { dueDate: "2026-05-26" });
    const nudges = getCampusAdmissionsNudges(loadCollegeChecklist(), essays, {
      placementGoal: "sat",
      now,
      max: 3,
    });
    expect(nudges.some(isDeadline)).toBe(true);
    const soft = nudges.filter(
      (n) =>
        n.id.startsWith("checklist-builtin-") ||
        n.id === "checklist-start" ||
        n.id === "essay-tracker-empty",
    );
    expect(soft.length).toBeLessThanOrEqual(1);
  });

  it("daysUntilDue handles UTC dates", () => {
    expect(daysUntilDue("2026-05-28", now)).toBe(4);
    expect(daysUntilDue("2026-05-20", now)).toBe(-4);
  });

  it("hides snoozed nudges until expiry", () => {
    let essays = loadEssayTracker();
    essays = addEssayFromTemplate(essays, "common-app-personal", { dueDate: "2026-05-20" });
    const id = getCampusAdmissionsNudges(loadCollegeChecklist(), essays, {
      placementGoal: "sat",
      now,
      max: 5,
      storage,
    })[0]!.id;
    snoozeNudge(id, 7, storage, now.getTime());
    const after = getCampusAdmissionsNudges(loadCollegeChecklist(), essays, {
      placementGoal: "sat",
      now,
      max: 5,
      storage,
    });
    expect(after.some((n) => n.id === id)).toBe(false);
  });
});

function isDeadline(n: { id: string }) {
  return (
    n.id.startsWith("essay-due-") ||
    n.id.startsWith("essay-overdue-") ||
    n.id.startsWith("essay-soon-") ||
    n.id.startsWith("checklist-due-") ||
    n.id.startsWith("checklist-overdue-") ||
    n.id.startsWith("checklist-soon-")
  );
}
