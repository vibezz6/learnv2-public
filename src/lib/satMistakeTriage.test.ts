import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { addMistake } from "@/lib/satMistakeLog";
import { getPrimaryMistakeCategory, getTopMistakeCategories } from "@/lib/satMistakeTriage";

function mockLocalStorage(): Storage {
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
  };
}

describe("satMistakeTriage", () => {
  let storage: Storage;

  beforeEach(() => {
    storage = mockLocalStorage();
    vi.stubGlobal("localStorage", storage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("ranks categories by count then recency", () => {
    addMistake({ section: "math", category: "Tables", note: "a" }, storage);
    addMistake({ section: "math", category: "Tables", note: "b" }, storage);
    addMistake({ section: "rw", category: "Inference", note: "c" }, storage);

    const top = getTopMistakeCategories(2, storage);
    expect(top).toHaveLength(2);
    expect(top[0]?.category).toBe("Tables");
    expect(top[0]?.count).toBe(2);
    expect(top[1]?.category).toBe("Inference");
  });

  it("returns primary category with linked node when present", () => {
    addMistake(
      { section: "math", category: "Linear equations", note: "sign error", nodeId: "st17" },
      storage,
    );

    expect(getPrimaryMistakeCategory(storage)).toMatchObject({
      category: "Linear equations",
      nodeId: "st17",
      count: 1,
    });
  });
});
