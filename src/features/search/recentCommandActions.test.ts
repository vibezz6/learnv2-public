import { describe, expect, it } from "vitest";
import {
  addRecentCommandAction,
  getRecentCommandActions,
  RECENT_COMMAND_ACTIONS_KEY,
} from "@/features/search/recentCommandActions";

function mockStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
    clear: () => map.clear(),
    key: () => null,
    length: map.size,
  } satisfies Storage;
}

describe("recentCommandActions", () => {
  it("stores and dedupes by id", () => {
    const storage = mockStorage();
    addRecentCommandAction("stats", "Stats", "/stats", storage);
    addRecentCommandAction("review", "Review", "/review", storage);
    addRecentCommandAction("stats", "Stats", "/stats", storage);
    const recent = getRecentCommandActions(storage);
    expect(recent).toHaveLength(2);
    expect(recent[0]?.id).toBe("stats");
    expect(storage.getItem(RECENT_COMMAND_ACTIONS_KEY)).toContain("Stats");
  });
});
