import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createSafeStorage,
  getStorageStatus,
  probeStorageWritable,
  recordStorageFailure,
} from "@/lib/storageSafety";
import { writeJson } from "@/lib/storageJson";

function mapStorage(): Storage {
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

describe("storageSafety", () => {
  beforeEach(() => {
    // reset status to ok via a successful probe on a working storage
    probeStorageWritable(mapStorage());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("writeJson records a failure when setItem throws", () => {
    const storage = mapStorage();
    vi.spyOn(storage, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    const ok = writeJson(storage, "learnv2_test", { a: 1 });
    expect(ok).toBe(false);
    expect(getStorageStatus().ok).toBe(false);
    expect(getStorageStatus().kind).toBe("write");
  });

  it("createSafeStorage quarantines a corrupt value and returns null", () => {
    const storage = mapStorage();
    storage.setItem("learnv2_progress", "{ not valid json ");
    const safe = createSafeStorage(storage);
    expect(safe.getItem("learnv2_progress")).toBeNull();
    // original removed, corrupt copy preserved
    expect(storage.getItem("learnv2_progress")).toBeNull();
    const corruptKey = [...Array(storage.length)]
      .map((_, i) => storage.key(i))
      .find((k) => k?.startsWith("learnv2_progress_corrupt_"));
    expect(corruptKey).toBeTruthy();
  });

  it("createSafeStorage returns valid values unchanged", () => {
    const storage = mapStorage();
    const value = JSON.stringify({ state: { data: { totalXp: 5 } } });
    storage.setItem("learnv2_progress", value);
    expect(createSafeStorage(storage).getItem("learnv2_progress")).toBe(value);
  });

  it("createSafeStorage.setItem records a failure instead of throwing", () => {
    recordStorageFailure(null, "probe"); // dirty the status
    const storage = mapStorage();
    vi.spyOn(storage, "setItem").mockImplementation(() => {
      throw new Error("full");
    });
    const safe = createSafeStorage(storage);
    expect(() => safe.setItem("learnv2_x", "1")).not.toThrow();
    expect(getStorageStatus().ok).toBe(false);
  });

  it("probeStorageWritable is false when storage throws", () => {
    const storage = mapStorage();
    vi.spyOn(storage, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(probeStorageWritable(storage)).toBe(false);
  });
});
