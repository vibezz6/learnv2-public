import { beforeEach, describe, expect, it } from "vitest";
import {
  addCustomEssay,
  addEssayFromTemplate,
  DEFAULT_ESSAY_PROMPTS,
  getEssayTrackerProgress,
  getEssayProgressForCollege,
  getEssaysDueSoon,
  loadEssayTracker,
  saveEssayTracker,
  updateEssayStatus,
} from "./essayTracker";

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

describe("essayTracker", () => {
  let storage: Storage;

  beforeEach(() => {
    storage = mockStorage();
  });

  it("starts empty", () => {
    expect(loadEssayTracker(storage).essays).toEqual([]);
  });

  it("adds from template and persists status", () => {
    const templateId = DEFAULT_ESSAY_PROMPTS[0]!.id;
    let s = loadEssayTracker(storage);
    s = addEssayFromTemplate(s, templateId, { college: "State U", dueDate: "2026-11-01" });
    expect(s.essays).toHaveLength(1);
    expect(s.essays[0]!.college).toBe("State U");
    expect(s.essays[0]!.status).toBe("not_started");

    const id = s.essays[0]!.id;
    s = updateEssayStatus(s, id, "draft");
    saveEssayTracker(s, storage);
    expect(loadEssayTracker(storage).essays[0]!.status).toBe("draft");
  });

  it("tracks progress and due soon", () => {
    let s = loadEssayTracker(storage);
    s = addCustomEssay(s, "Honor society", "Describe leadership.");
    const id = s.essays[0]!.id;
    s = updateEssayStatus(s, id, "final");

    const soonDate = new Date();
    soonDate.setUTCDate(soonDate.getUTCDate() + 5);
    const due = soonDate.toISOString().slice(0, 10);
    s = addEssayFromTemplate(s, "why-us", { dueDate: due });

    const progress = getEssayTrackerProgress(s);
    expect(progress.total).toBe(2);
    expect(progress.finalCount).toBe(1);
    expect(progress.pct).toBe(50);

    const dueSoon = getEssaysDueSoon(s, 14, soonDate);
    expect(dueSoon).toHaveLength(1);
    expect(dueSoon[0]!.templateId).toBe("why-us");
  });

  it("getEssayProgressForCollege counts finals per school", () => {
    let s = loadEssayTracker(storage);
    s = addEssayFromTemplate(s, "why-us", { college: "Alpha U" });
    s = addEssayFromTemplate(s, "why-us", { college: "Alpha U" });
    s = updateEssayStatus(s, s.essays[0]!.id, "final");
    saveEssayTracker(s, storage);
    s = addEssayFromTemplate(s, "why-us", { college: "Beta U" });
    saveEssayTracker(s, storage);

    expect(getEssayProgressForCollege("Alpha U", storage)).toEqual({ total: 2, finalCount: 1 });
    expect(getEssayProgressForCollege("Beta U", storage)).toEqual({ total: 1, finalCount: 0 });
    expect(getEssayProgressForCollege("Missing U", storage)).toEqual({ total: 0, finalCount: 0 });
  });
});
