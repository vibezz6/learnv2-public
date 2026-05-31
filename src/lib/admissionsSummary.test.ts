import { describe, expect, it, vi } from "vitest";
import { addCustomItem, loadCollegeChecklist, toggleBuiltInItem } from "./collegeChecklist";
import { addEssayFromTemplate, loadEssayTracker, updateEssayStatus } from "./essayTracker";
import { addCollege, saveColleges } from "./colleges";
import {
  applicationPackageHref,
  buildAdmissionsExportPayload,
  buildAdmissionsSummary,
  formatAdmissionsTranscriptSection,
  getBlockingApplicationItem,
  getUrgentCollegeDeadlines,
  getWeekDeadlineRows,
} from "./admissionsSummary";
import { ROUTES } from "@/app/navigation";

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

describe("admissionsSummary", () => {
  it("buildAdmissionsSummary reflects checklist and essays", () => {
    let checklist = loadCollegeChecklist();
    checklist = toggleBuiltInItem(checklist, "fafsa-account", true);
    let essays = loadEssayTracker();
    essays = addEssayFromTemplate(essays, "common-app-personal");
    essays = updateEssayStatus(essays, essays.essays[0]!.id, "draft");

    const summary = buildAdmissionsSummary(checklist, essays);
    expect(summary.hasActivity).toBe(true);
    expect(summary.checklistDone).toBeGreaterThanOrEqual(1);
    expect(summary.essaysTracked).toBe(1);
    expect(summary.essayLines[0]?.statusLabel).toBe("First draft");
  });

  it("getWeekDeadlineRows includes overdue and due soon", () => {
    const now = new Date("2026-05-24T12:00:00Z");
    let essays = loadEssayTracker();
    essays = addEssayFromTemplate(essays, "why-us", { dueDate: "2026-05-20" });
    let checklist = loadCollegeChecklist();
    checklist = addCustomItem(checklist, "App deadline", "2026-05-28");

    const rows = getWeekDeadlineRows(7, now, checklist, essays);
    expect(rows.length).toBe(2);
    expect(rows[0]?.overdue).toBe(true);
  });

  it("getUrgentCollegeDeadlines returns overdue, today, and tomorrow only", () => {
    const now = new Date("2026-05-24T12:00:00Z");
    let essays = loadEssayTracker();
    essays = addEssayFromTemplate(essays, "why-us", { dueDate: "2026-05-20" });
    let checklist = loadCollegeChecklist();
    checklist = addCustomItem(checklist, "Due tomorrow", "2026-05-25");
    checklist = addCustomItem(checklist, "Due next week", "2026-06-01");

    const urgent = getUrgentCollegeDeadlines(now, 3, checklist, essays);
    expect(urgent).toHaveLength(2);
    expect(urgent[0]?.overdue).toBe(true);
    expect(urgent[1]?.title).toBe("Due tomorrow");
    expect(urgent[1]?.daysUntil).toBe(1);
  });

  it("formatAdmissionsTranscriptSection omits when empty", () => {
    expect(formatAdmissionsTranscriptSection(buildAdmissionsSummary())).toEqual([]);
  });

  it("getBlockingApplicationItem returns essay with next status step", () => {
    const now = new Date("2026-05-24T12:00:00Z");
    let essays = loadEssayTracker();
    essays = addEssayFromTemplate(essays, "common-app-personal", { dueDate: "2026-05-25" });
    essays = updateEssayStatus(essays, essays.essays[0]!.id, "outline");

    const blocking = getBlockingApplicationItem(now, loadCollegeChecklist(), essays);
    expect(blocking).toMatchObject({
      title: "Common App personal statement",
      nextStep: "Write first draft",
      daysUntil: 1,
      blockerKind: "essay",
    });
  });

  it("getBlockingApplicationItem routes essay with college to package", () => {
    const now = new Date("2026-05-24T12:00:00Z");
    let essays = loadEssayTracker();
    essays = addEssayFromTemplate(essays, "why-us", {
      college: "Stanford University",
      dueDate: "2026-05-25",
    });

    const blocking = getBlockingApplicationItem(now, loadCollegeChecklist(), essays);
    expect(blocking?.collegeName).toBe("Stanford University");
    expect(blocking?.href).toBe(applicationPackageHref("Stanford University"));
    expect(blocking?.blockerKind).toBe("essay");
  });

  it("getBlockingApplicationItem uses checklist href without collegeName", () => {
    const now = new Date("2026-05-24T12:00:00Z");
    let checklist = loadCollegeChecklist();
    checklist = addCustomItem(checklist, "Submit FAFSA", "2026-05-25");

    const blocking = getBlockingApplicationItem(now, checklist, loadEssayTracker());
    expect(blocking?.blockerKind).toBe("checklist");
    expect(blocking?.collegeName).toBeUndefined();
    expect(blocking?.href).toBe(ROUTES.collegeChecklist);
  });

  it("getBlockingApplicationItem includes registry school deadline", () => {
    const now = new Date("2026-05-24T12:00:00Z");
    const storage = mockStorage();
    vi.stubGlobal("localStorage", storage);
    saveColleges({ colleges: [] }, storage);
    addCollege("MIT", "2026-05-26", undefined, storage);

    const blocking = getBlockingApplicationItem(
      now,
      loadCollegeChecklist(storage),
      loadEssayTracker(storage),
      storage,
    );
    expect(blocking?.blockerKind).toBe("registry");
    expect(blocking?.collegeName).toBe("MIT");
    expect(blocking?.href).toContain(ROUTES.applicationPackage);
    vi.unstubAllGlobals();
  });

  it("buildAdmissionsExportPayload includes summary and raw state", () => {
    const payload = buildAdmissionsExportPayload();
    expect(payload.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}/);
    expect(payload.summary).toBeDefined();
    expect(payload.checklist).toBeDefined();
    expect(payload.essays).toBeDefined();
  });
});
