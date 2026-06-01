import { beforeEach, describe, expect, it } from "vitest";
import { buildAdmissionsExportPayload } from "./admissionsSummary";
import { COLLEGE_CHECKLIST_KEY, loadCollegeChecklist } from "./collegeChecklist";
import { ESSAY_TRACKER_KEY, loadEssayTracker } from "./essayTracker";
import { NUDGE_SNOOZE_KEY } from "./nudgeSnooze";
import {
  applyAdmissionsImport,
  clearAllAdmissionsData,
  parseAdmissionsImportJson,
  parseAdmissionsImportPayload,
} from "./admissionsImport";

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

describe("admissionsImport", () => {
  let storage: Storage;

  beforeEach(() => {
    storage = mockStorage();
  });
  it("round-trips export payload", () => {
    const exported = buildAdmissionsExportPayload();
    const parsed = parseAdmissionsImportPayload(exported);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    applyAdmissionsImport(parsed);
    expect(loadCollegeChecklist()).toEqual(parsed.checklist);
    expect(loadEssayTracker().essays).toEqual(parsed.essays.essays);
  });

  it("rejects invalid shapes", () => {
    expect(parseAdmissionsImportJson("{")).toMatchObject({ ok: false });
    expect(parseAdmissionsImportPayload({})).toMatchObject({ ok: false });
    expect(parseAdmissionsImportPayload({ checklist: {}, essays: {} })).toMatchObject({
      ok: false,
    });
  });

  it("clearAllAdmissionsData wipes checklist, essays, and snoozes", () => {
    storage.setItem(
      COLLEGE_CHECKLIST_KEY,
      JSON.stringify({ completed: { "fafsa-account": true }, customItems: [] }),
    );
    storage.setItem(
      ESSAY_TRACKER_KEY,
      JSON.stringify({
        essays: [
          {
            id: "e1",
            templateId: null,
            title: "T",
            prompt: "P",
            status: "draft",
            createdAt: 1,
            updatedAt: 1,
          },
        ],
      }),
    );
    storage.setItem(NUDGE_SNOOZE_KEY, JSON.stringify({ snoozes: { n1: Date.now() + 1e6 } }));

    clearAllAdmissionsData(storage);
    expect(loadCollegeChecklist(storage).completed).toEqual({});
    expect(loadEssayTracker(storage).essays).toEqual([]);
    expect(storage.getItem(NUDGE_SNOOZE_KEY)).toBe(JSON.stringify({ snoozes: {} }));
  });
});
