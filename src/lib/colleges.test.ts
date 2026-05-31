import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  addCollege,
  discoverCollegesFromEssays,
  importCollegesFromEssays,
  loadColleges,
  saveColleges,
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
    addCollege("MIT", undefined, storage);
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
    addCollege("  Yale  ", undefined, storage);
    expect(loadColleges(storage).colleges[0]?.name).toBe("Yale");
  });
});
