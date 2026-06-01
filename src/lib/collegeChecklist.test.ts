import { beforeEach, describe, expect, it } from "vitest";
import {
  addCustomItem,
  DEFAULT_COLLEGE_CHECKLIST,
  getChecklistProgress,
  loadCollegeChecklist,
  saveCollegeChecklist,
  toggleBuiltInItem,
  toggleCustomItem,
} from "./collegeChecklist";

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

describe("collegeChecklist", () => {
  let storage: Storage;

  beforeEach(() => {
    storage = mockStorage();
  });

  it("starts empty", () => {
    const s = loadCollegeChecklist(storage);
    expect(s.completed).toEqual({});
    expect(s.customItems).toEqual([]);
  });

  it("persists built-in toggles", () => {
    const id = DEFAULT_COLLEGE_CHECKLIST[0]!.id;
    let s = loadCollegeChecklist(storage);
    s = toggleBuiltInItem(s, id, true);
    saveCollegeChecklist(s, storage);
    expect(loadCollegeChecklist(storage).completed[id]).toBe(true);
  });

  it("tracks custom items and progress", () => {
    let s = loadCollegeChecklist(storage);
    s = addCustomItem(s, "Request transcript", "2026-06-01");
    s = toggleCustomItem(s, s.customItems[0]!.id, true);
    const p = getChecklistProgress(s);
    expect(p.done).toBe(1);
    expect(p.total).toBe(DEFAULT_COLLEGE_CHECKLIST.length + 1);
  });
});
