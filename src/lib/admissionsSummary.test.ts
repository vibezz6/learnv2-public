import { describe, expect, it } from "vitest";
import { addCustomItem, loadCollegeChecklist, toggleBuiltInItem } from "./collegeChecklist";
import { addEssayFromTemplate, loadEssayTracker, updateEssayStatus } from "./essayTracker";
import {
  buildAdmissionsExportPayload,
  buildAdmissionsSummary,
  formatAdmissionsTranscriptSection,
  getWeekDeadlineRows,
} from "./admissionsSummary";

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

  it("formatAdmissionsTranscriptSection omits when empty", () => {
    expect(formatAdmissionsTranscriptSection(buildAdmissionsSummary())).toEqual([]);
  });

  it("buildAdmissionsExportPayload includes summary and raw state", () => {
    const payload = buildAdmissionsExportPayload();
    expect(payload.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}/);
    expect(payload.summary).toBeDefined();
    expect(payload.checklist).toBeDefined();
    expect(payload.essays).toBeDefined();
  });
});
