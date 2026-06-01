import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  SAT_MISTAKE_LOG_KEY,
  addMistake,
  deleteMistake,
  groupByCategory,
  listMistakes,
  type SatMistakeEntry,
} from "@/lib/satMistakeLog";

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

describe("satMistakeLog", () => {
  let storage: Storage;

  beforeEach(() => {
    storage = mockLocalStorage();
    vi.stubGlobal("localStorage", storage);
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-24T15:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("adds a mistake and lists it newest-first", () => {
    const first = addMistake(
      {
        section: "math",
        category: "Linear equations",
        note: "Forgot to distribute",
        nodeId: "st58",
      },
      storage,
    );
    expect(first).toMatchObject({
      section: "math",
      category: "Linear equations",
      note: "Forgot to distribute",
      nodeId: "st58",
      date: "2026-05-24",
    });

    vi.setSystemTime(new Date("2026-05-24T16:00:00.000Z"));
    const second = addMistake(
      {
        section: "rw",
        category: "Comma splices",
        note: "Missed boundary scan",
      },
      storage,
    );

    expect(listMistakes(storage)).toEqual([second, first]);
  });

  it("rejects empty category or note", () => {
    expect(
      addMistake({ section: "math", category: "  ", note: "Something" }, storage),
    ).toBeNull();
    expect(
      addMistake({ section: "rw", category: "Grammar", note: "   " }, storage),
    ).toBeNull();
    expect(listMistakes(storage)).toEqual([]);
  });

  it("persists entries under learnv2_sat_mistakes_v1", () => {
    addMistake(
      {
        section: "math",
        category: "Quadratics",
        note: "Vertex form slip",
        date: "2026-05-20",
      },
      storage,
    );

    const saved = JSON.parse(storage.getItem(SAT_MISTAKE_LOG_KEY)!) as SatMistakeEntry[];
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({
      section: "math",
      category: "Quadratics",
      note: "Vertex form slip",
      date: "2026-05-20",
    });
    expect(typeof saved[0].id).toBe("string");
    expect(typeof saved[0].createdAt).toBe("number");
  });

  it("deletes a mistake by id", () => {
    const entry = addMistake(
      { section: "rw", category: "Inference", note: "Overreached" },
      storage,
    )!;

    expect(deleteMistake(entry.id, storage)).toBe(true);
    expect(listMistakes(storage)).toEqual([]);
    expect(deleteMistake("missing-id", storage)).toBe(false);
  });

  it("groups mistakes by category with newest first in each group", () => {
    vi.setSystemTime(new Date("2026-05-24T10:00:00.000Z"));
    addMistake({ section: "math", category: "Tables", note: "Older table miss" }, storage);

    vi.setSystemTime(new Date("2026-05-24T11:00:00.000Z"));
    addMistake({ section: "math", category: "Tables", note: "Newer table miss" }, storage);

    vi.setSystemTime(new Date("2026-05-24T12:00:00.000Z"));
    addMistake({ section: "rw", category: "Evidence", note: "Quote trap" }, storage);

    const grouped = groupByCategory(listMistakes(storage));
    expect(Object.keys(grouped)).toEqual(["Evidence", "Tables"]);
    expect(grouped.Tables.map((entry) => entry.note)).toEqual([
      "Newer table miss",
      "Older table miss",
    ]);
    expect(grouped.Evidence).toHaveLength(1);
  });

  it("ignores corrupt stored data", () => {
    storage.setItem(SAT_MISTAKE_LOG_KEY, '{"not":"an array"}');
    expect(listMistakes(storage)).toEqual([]);

    storage.setItem(
      SAT_MISTAKE_LOG_KEY,
      JSON.stringify([
        { id: "ok", date: "2026-05-24", section: "math", category: "Valid", note: "Fine", createdAt: 1 },
        { id: "bad", section: "math", category: "Missing fields" },
      ]),
    );

    expect(listMistakes(storage)).toHaveLength(1);
    expect(listMistakes(storage)[0].category).toBe("Valid");
  });
});
