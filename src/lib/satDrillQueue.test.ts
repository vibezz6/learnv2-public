import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { addMistake } from "./satMistakeLog";
import { getDrillQueue, markSkillDrilled } from "./satDrillQueue";

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

describe("satDrillQueue", () => {
  let storage: Storage;

  beforeEach(() => {
    storage = mockStorage();
    vi.stubGlobal("localStorage", storage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("ranks skills by mistake count", () => {
    addMistake({ section: "math", category: "Linear equations", skillId: "linear-equations", note: "a" }, storage);
    addMistake({ section: "math", category: "Linear equations", skillId: "linear-equations", note: "b" }, storage);
    addMistake({ section: "rw", category: "Inference", skillId: "inference", note: "c" }, storage);

    const queue = getDrillQueue(5, storage);
    expect(queue[0]?.skillId).toBe("linear-equations");
    expect(queue[0]?.count).toBe(2);
  });

  it("hides skills on 48h cooldown after mark drilled", () => {
    const now = 1_000_000;
    addMistake({ section: "math", category: "Linear equations", skillId: "linear-equations", note: "a" }, storage);
    markSkillDrilled("linear-equations", storage, now);
    expect(getDrillQueue(5, storage, now + 1000)).toHaveLength(0);
    expect(getDrillQueue(5, storage, now + 49 * 60 * 60 * 1000)).toHaveLength(1);
  });
});
