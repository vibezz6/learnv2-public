import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  addRecentSearch,
  fuzzyMatch,
  getRecentSearches,
  scoreCommandMatch,
} from "@/features/search/searchHelpers";

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

describe("searchHelpers", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", mockLocalStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fuzzyMatch accepts substring and subsequence", () => {
    expect(fuzzyMatch("ev", "Expected Value").match).toBe(true);
    expect(fuzzyMatch("xyz", "Expected Value").match).toBe(false);
  });

  it("getRecentSearches merges v1, cmd-palette-recent, and learnapp_recent_searches", () => {
    localStorage.setItem("learnapp_recent_searches_v1", JSON.stringify(["v1-only"]));
    localStorage.setItem("cmd-palette-recent", JSON.stringify(["bayes", "stats"]));
    localStorage.setItem("learnapp_recent_searches", JSON.stringify(["kelly", "bayes"]));

    expect(getRecentSearches()).toEqual(["bayes", "stats", "kelly", "v1-only"]);
  });

  it("addRecentSearch dedupes, caps at 5, and writes to all stores", () => {
    addRecentSearch("bayes");
    addRecentSearch("kelly");
    addRecentSearch("bayes");

    expect(getRecentSearches()).toEqual(["bayes", "kelly"]);
    expect(JSON.parse(localStorage.getItem("learnapp_recent_searches_v1")!)).toEqual(["bayes", "kelly"]);
    expect(JSON.parse(localStorage.getItem("cmd-palette-recent")!)).toEqual(["bayes", "kelly"]);
    expect(JSON.parse(localStorage.getItem("learnapp_recent_searches")!)).toEqual(["bayes", "kelly"]);
  });

  it("addRecentSearch keeps at most 5 entries", () => {
    for (const term of ["a", "b", "c", "d", "e", "f"]) addRecentSearch(term);
    expect(getRecentSearches()).toEqual(["f", "e", "d", "c", "b"]);
  });

  it("scoreCommandMatch ranks label hits over weak description hits", () => {
    const strong = scoreCommandMatch("stats", {
      id: "nav-stats",
      label: "Stats",
      description: "Charts and progress",
    });
    const weak = scoreCommandMatch("stats", {
      id: "nav-review",
      label: "Review queue",
      description: "stats overview",
    });

    expect(strong).not.toBeNull();
    expect(weak).not.toBeNull();
    expect(strong!.score).toBeGreaterThan(weak!.score);
  });

  it("scoreCommandMatch finds campus commands by keyword", () => {
    const essay = scoreCommandMatch("essay", {
      id: "essay-tracker",
      label: "Essay tracker",
      description: "Draft status and due dates",
    });
    const checklist = scoreCommandMatch("fafsa", {
      id: "college-checklist",
      label: "College checklist",
      description: "FAFSA, essays, deadlines",
    });

    expect(essay).not.toBeNull();
    expect(checklist).not.toBeNull();
  });

  it("filters lesson commands through fuzzy matching", () => {
    const lesson = {
      id: "lesson-expected-value",
      label: "Expected Value",
      description: "Probability weighted outcomes",
    };

    expect(scoreCommandMatch("expected", lesson)).not.toBeNull();
    expect(scoreCommandMatch("unrelated", lesson)).toBeNull();
  });
});
