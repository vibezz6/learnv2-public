import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  addCollege,
  COLLEGE_NOTES_MAX_LENGTH,
  discoverCollegesFromEssays,
  importCollegesFromEssays,
  loadColleges,
  saveColleges,
  updateCollegeNotes,
} from "./colleges";
import { saveEssayTracker } from "./essayTracker";

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

describe("colleges", () => {
  let storage: Storage;

  beforeEach(() => {
    storage = mockStorage();
    vi.stubGlobal("localStorage", storage);
    saveColleges({ colleges: [] }, storage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("dedupes colleges case-insensitively on import", () => {
    saveEssayTracker(
      {
        essays: [
          {
            id: "e1",
            templateId: null,
            title: "A",
            prompt: "",
            college: "Stanford",
            status: "draft",
            createdAt: 1,
            updatedAt: 1,
          },
          {
            id: "e2",
            templateId: null,
            title: "B",
            prompt: "",
            college: "stanford",
            status: "draft",
            createdAt: 2,
            updatedAt: 2,
          },
        ],
      },
      storage,
    );
    importCollegesFromEssays(storage);
    expect(loadColleges(storage).colleges).toHaveLength(1);
    expect(loadColleges(storage).colleges[0]?.name).toBe("Stanford");
  });

  it("import is idempotent", () => {
    saveEssayTracker(
      {
        essays: [
          {
            id: "e1",
            templateId: null,
            title: "A",
            prompt: "",
            college: "MIT",
            status: "draft",
            createdAt: 1,
            updatedAt: 1,
          },
        ],
      },
      storage,
    );
    importCollegesFromEssays(storage);
    importCollegesFromEssays(storage);
    expect(loadColleges(storage).colleges).toHaveLength(1);
  });

  it("discover excludes already saved schools", () => {
    addCollege("MIT", undefined, undefined, storage);
    saveEssayTracker(
      {
        essays: [
          {
            id: "e1",
            templateId: null,
            title: "A",
            prompt: "",
            college: "MIT",
            status: "draft",
            createdAt: 1,
            updatedAt: 1,
          },
        ],
      },
      storage,
    );
    expect(discoverCollegesFromEssays(storage)).toEqual([]);
  });

  it("trims college names on add", () => {
    addCollege("  Yale  ", undefined, undefined, storage);
    expect(loadColleges(storage).colleges[0]?.name).toBe("Yale");
  });

  it("trims and stores registry notes", () => {
    addCollege("Duke", undefined, "  EA round  ", storage);
    expect(loadColleges(storage).colleges[0]?.notes).toBe("EA round");
  });

  it("drops empty notes on add", () => {
    addCollege("Duke", undefined, "   ", storage);
    expect(loadColleges(storage).colleges[0]?.notes).toBeUndefined();
  });

  it("caps notes length on update", () => {
    addCollege("Duke", undefined, undefined, storage);
    const id = loadColleges(storage).colleges[0]!.id;
    const long = "x".repeat(COLLEGE_NOTES_MAX_LENGTH + 20);
    updateCollegeNotes(id, long, storage);
    expect(loadColleges(storage).colleges[0]?.notes).toHaveLength(COLLEGE_NOTES_MAX_LENGTH);
  });
});
