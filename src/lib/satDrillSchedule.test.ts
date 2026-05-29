import { describe, expect, it } from "vitest";
import { SAT_MISTAKE_LOG_KEY } from "@/lib/satMistakeLog";
import {
  getDueDrillCount,
  getNextDrillCategory,
  markCategoryDrilled,
  RE_DRILL_INTERVAL_DAYS,
} from "@/lib/satDrillSchedule";

const DAY = 86_400_000;

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

function seedMistakes(storage: Storage, cats: Array<{ category: string; count: number }>) {
  const entries = [];
  let i = 0;
  for (const c of cats) {
    for (let n = 0; n < c.count; n++) {
      entries.push({
        id: `m${i}`,
        date: "2026-05-29",
        section: "math",
        category: c.category,
        note: "note",
        createdAt: Date.now() - i * 1000,
      });
      i++;
    }
  }
  storage.setItem(SAT_MISTAKE_LOG_KEY, JSON.stringify(entries));
}

describe("satDrillSchedule", () => {
  it("returns nothing when there are no mistakes", () => {
    const storage = mapStorage();
    expect(getNextDrillCategory(storage)).toBeNull();
    expect(getDueDrillCount(storage)).toBe(0);
  });

  it("prioritizes the most-missed category, then rotates after drilling", () => {
    const storage = mapStorage();
    const now = Date.parse("2026-05-29T12:00:00Z");
    seedMistakes(storage, [
      { category: "Linear equations", count: 3 },
      { category: "Commas", count: 1 },
    ]);

    expect(getNextDrillCategory(storage, now)?.category).toBe("Linear equations");
    expect(getDueDrillCount(storage, now)).toBe(2);

    // Drill the top one → it's no longer due, so the next category rotates in.
    markCategoryDrilled("Linear equations", now, storage);
    expect(getNextDrillCategory(storage, now)?.category).toBe("Commas");
    expect(getDueDrillCount(storage, now)).toBe(1);
  });

  it("makes a drilled category due again after the interval", () => {
    const storage = mapStorage();
    const now = Date.parse("2026-05-29T12:00:00Z");
    seedMistakes(storage, [{ category: "Linear equations", count: 2 }]);
    markCategoryDrilled("Linear equations", now, storage);
    expect(getDueDrillCount(storage, now)).toBe(0);
    const later = now + (RE_DRILL_INTERVAL_DAYS + 0.5) * DAY;
    expect(getDueDrillCount(storage, later)).toBe(1);
  });
});
