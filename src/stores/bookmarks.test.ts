import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

function stubPersistStorage() {
  const storage = mockLocalStorage();
  vi.stubGlobal("localStorage", storage);
  vi.stubGlobal("window", { localStorage: storage });
  return storage;
}

describe("bookmarks", () => {
  beforeEach(async () => {
    stubPersistStorage();
    vi.resetModules();
    const { useBookmarks } = await import("@/stores/bookmarks");
    useBookmarks.setState({ resourceBookmarks: [], lessonBookmarks: [] });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  async function loadBookmarksStore() {
    return import("@/stores/bookmarks");
  }

  it("toggleResourceBookmark adds and removes a resource bookmark", async () => {
    const { useBookmarks } = await loadBookmarksStore();

    expect(useBookmarks.getState().isResourceBookmarked("n1", 0)).toBe(false);

    useBookmarks.getState().toggleResourceBookmark("n1", 0, "worth reading");
    expect(useBookmarks.getState().isResourceBookmarked("n1", 0)).toBe(true);
    expect(useBookmarks.getState().getResourceBookmark("n1", 0)).toMatchObject({
      nodeId: "n1",
      resourceIndex: 0,
      note: "worth reading",
    });
    expect(useBookmarks.getState().getResourceBookmarks()).toHaveLength(1);

    useBookmarks.getState().toggleResourceBookmark("n1", 0);
    expect(useBookmarks.getState().isResourceBookmarked("n1", 0)).toBe(false);
    expect(useBookmarks.getState().getResourceBookmarks()).toHaveLength(0);
  });

  it("toggleLessonBookmark adds and removes a lesson bookmark", async () => {
    const { useBookmarks } = await loadBookmarksStore();

    expect(useBookmarks.getState().isLessonBookmarked("math", "m1")).toBe(false);

    useBookmarks.getState().toggleLessonBookmark("math", "m1");
    expect(useBookmarks.getState().isLessonBookmarked("math", "m1")).toBe(true);
    expect(useBookmarks.getState().getLessonBookmarks()).toEqual([{ subjectId: "math", nodeId: "m1" }]);

    useBookmarks.getState().toggleLessonBookmark("math", "m1");
    expect(useBookmarks.getState().isLessonBookmarked("math", "m1")).toBe(false);
    expect(useBookmarks.getState().getLessonBookmarks()).toHaveLength(0);
  });

  it("learnv2_bookmarks persists resource and lesson bookmark arrays", async () => {
    const { useBookmarks, V2_BOOKMARKS_KEY } = await loadBookmarksStore();

    useBookmarks.getState().toggleResourceBookmark("n2", 1, "saved");
    useBookmarks.getState().toggleLessonBookmark("cs", "c1");

    const parsed = JSON.parse(localStorage.getItem(V2_BOOKMARKS_KEY)!) as {
      state: {
        resourceBookmarks: Array<{ nodeId: string; resourceIndex: number; note: string }>;
        lessonBookmarks: Array<{ subjectId: string; nodeId: string }>;
      };
    };

    expect(parsed.state.resourceBookmarks).toHaveLength(1);
    expect(parsed.state.resourceBookmarks[0]).toMatchObject({
      nodeId: "n2",
      resourceIndex: 1,
      note: "saved",
    });
    expect(parsed.state.lessonBookmarks).toEqual([{ subjectId: "cs", nodeId: "c1" }]);
  });

  it("quarantines corrupt bookmark storage during rehydrate", async () => {
    const storage = stubPersistStorage();
    storage.setItem("learnv2_bookmarks", "{ nope");
    vi.resetModules();

    const { useBookmarks, V2_BOOKMARKS_KEY } = await import("@/stores/bookmarks");

    expect(useBookmarks.getState().getResourceBookmarks()).toHaveLength(0);
    expect(storage.getItem(V2_BOOKMARKS_KEY)).toBeNull();
    const corruptKey = Array.from({ length: storage.length }, (_, i) => storage.key(i)).find((key) =>
      key?.startsWith(`${V2_BOOKMARKS_KEY}_corrupt_`),
    );
    expect(corruptKey).toBeTruthy();
  });
});
