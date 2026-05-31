import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_ERRORS_KEY, loadStorageErrors } from "@/lib/storageErrors";
import { readJsonSafe } from "@/lib/storageJson";

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

describe("readJsonSafe", () => {
  let storage: Storage;

  beforeEach(() => {
    storage = mockStorage();
    vi.stubGlobal("localStorage", storage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("logs parse failures without removing the corrupt key", () => {
    storage.setItem("learnv2_test_corrupt", "{not-json");
    const value = readJsonSafe(storage, "learnv2_test_corrupt", { ok: true });
    expect(value).toEqual({ ok: true });
    expect(storage.getItem("learnv2_test_corrupt")).toBe("{not-json");
    const errors = loadStorageErrors(storage);
    expect(errors.some((e) => e.key === "learnv2_test_corrupt")).toBe(true);
    storage.removeItem(STORAGE_ERRORS_KEY);
  });
});
