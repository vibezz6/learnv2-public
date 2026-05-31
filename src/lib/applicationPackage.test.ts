import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadCollegeChecklist, saveCollegeChecklist } from "@/lib/collegeChecklist";
import {
  addEssayFromTemplate,
  loadEssayTracker,
  saveEssayTracker,
} from "@/lib/essayTracker";
import {
  buildApplicationPackage,
  formatPackageDeadline,
  GENERAL_APPLICATION_COLLEGE,
  getPackageDoThisFirst,
  listApplicationColleges,
  resolveApplicationCollege,
} from "@/lib/applicationPackage";

function mockStorage(): Storage {
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

describe("applicationPackage", () => {
  let storage: Storage;

  beforeEach(() => {
    storage = mockStorage();
    vi.stubGlobal("localStorage", storage);
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-24T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("formatPackageDeadline covers ladder", () => {
    expect(formatPackageDeadline(null).label).toBe("No deadline set");
    expect(formatPackageDeadline(-2).label).toBe("Overdue by 2 days");
    expect(formatPackageDeadline(0).label).toBe("Due today");
    expect(formatPackageDeadline(1).label).toBe("Due tomorrow");
    expect(formatPackageDeadline(14).label).toBe("14 days until deadline");
  });

  it("lists colleges from essays and General for unassigned", () => {
    let essays = loadEssayTracker(storage);
    essays = addEssayFromTemplate(essays, "why-us", {
      college: "Stanford University",
      dueDate: "2026-06-01",
    });
    essays = addEssayFromTemplate(essays, "common-app-personal", {
      dueDate: "2026-06-15",
    });
    saveEssayTracker(essays, storage);

    const colleges = listApplicationColleges(loadEssayTracker(storage));
    expect(colleges).toContain("Stanford University");
    expect(colleges).toContain(GENERAL_APPLICATION_COLLEGE);
  });

  it("resolveApplicationCollege returns null without query param", () => {
    expect(resolveApplicationCollege(["Alpha U"], null)).toBeNull();
    expect(resolveApplicationCollege(["Alpha U"], "")).toBeNull();
    expect(resolveApplicationCollege(["Alpha U"], "Alpha U")).toBe("Alpha U");
  });

  it("builds package with essays for one college", () => {
    let essays = loadEssayTracker(storage);
    essays = addEssayFromTemplate(essays, "why-us", {
      college: "Stanford University",
      dueDate: "2026-05-25",
    });
    saveEssayTracker(essays, storage);
    saveCollegeChecklist({ completed: {}, customItems: [] }, storage);

    const pkg = buildApplicationPackage("Stanford University", {
      essays: loadEssayTracker(storage),
      checklist: loadCollegeChecklist(storage),
    });

    expect(pkg.essays).toHaveLength(1);
    expect(pkg.deadline.label).toBe("Due tomorrow");
    expect(pkg.checklistTotal).toBeGreaterThan(0);
  });

  it("getPackageDoThisFirst matches essay blocker for that college", () => {
    let essays = loadEssayTracker(storage);
    essays = addEssayFromTemplate(essays, "why-us", {
      college: "MIT",
      dueDate: "2026-05-20",
    });
    saveEssayTracker(essays, storage);
    const row = essays.essays[0]!;
    const first = getPackageDoThisFirst("MIT", [row], new Date("2026-05-24T12:00:00.000Z"));
    expect(first?.title).toContain("Why");
  });

  it("prefers school deadline when provided", () => {
    saveCollegeChecklist({ completed: {}, customItems: [] }, storage);
    const pkg = buildApplicationPackage("MIT", {
      essays: loadEssayTracker(storage),
      checklist: loadCollegeChecklist(storage),
      schoolDeadline: "2026-05-26",
    });
    expect(pkg.deadline.label).toBe("2 days until deadline");
  });
});
