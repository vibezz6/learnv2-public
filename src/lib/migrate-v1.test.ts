import { describe, expect, it, beforeEach } from "vitest";
import {
  hasV1Data,
  inferSubjectId,
  mergeBookmarksFromV1,
  mergeLegacyNotes,
  migrateThemeFromV1,
  normalizeV1Progress,
  verifySrsDates,
} from "@/lib/migrate-v1";
import { V2_BOOKMARKS_KEY } from "@/stores/bookmarks";

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
  };
}

describe("migrate-v1", () => {
  let storage: Storage;

  beforeEach(() => {
    storage = mockStorage();
  });

  it("inferSubjectId maps node prefixes", () => {
    expect(inferSubjectId("m1")).toBe("math");
    expect(inferSubjectId("pr4")).toBe("probability");
    expect(inferSubjectId("em2")).toBe("engineering");
    expect(inferSubjectId("p3")).toBe("programming");
  });

  it("mergeLegacyNotes creates sessions for v1 notes without v2 session", () => {
    storage.setItem(
      "learnapp_notes_v1",
      JSON.stringify({ m1: { text: "My note on numbers", updatedAt: 1000 } }),
    );
    const merged = mergeLegacyNotes(storage);
    expect(merged).toBe(1);
    const sessions = JSON.parse(storage.getItem("learnapp_note_sessions_v2")!);
    expect(sessions.m1.responses.legacy).toBe("My note on numbers");
    expect(sessions.m1.tags).toContain("migrated-v1");
  });

  it("mergeLegacyNotes skips nodes that already have sessions", () => {
    storage.setItem("learnapp_notes_v1", JSON.stringify({ m1: { text: "old", updatedAt: 1 } }));
    storage.setItem(
      "learnapp_note_sessions_v2",
      JSON.stringify({
        m1: {
          nodeId: "m1",
          subjectId: "math",
          responses: { q1: "existing" },
          review: null,
          mentorSession: null,
          tags: [],
          createdAt: 1,
          updatedAt: 1,
        },
      }),
    );
    expect(mergeLegacyNotes(storage)).toBe(0);
  });

  it("migrateThemeFromV1 copies theme when v2 preferences empty", () => {
    storage.setItem("learnapp_theme_v1", "light");
    expect(migrateThemeFromV1(storage)).toBe(true);
    const prefs = JSON.parse(storage.getItem("learnv2_preferences")!);
    expect(prefs.state.theme).toBe("light");
  });

  it("verifySrsDates accepts UTC date strings", () => {
    storage.setItem(
      "learnapp_progress_v1",
      JSON.stringify({
        spacedRepetition: {
          m1: { scheduledReviews: [{ scheduledDate: "2026-05-22", completedDate: null }] },
        },
      }),
    );
    expect(verifySrsDates(storage)).toBe(true);
  });

  it("verifySrsDates rejects non-UTC date strings", () => {
    storage.setItem(
      "learnapp_progress_v1",
      JSON.stringify({
        spacedRepetition: {
          m1: { scheduledReviews: [{ scheduledDate: "05/22/2026", completedDate: null }] },
        },
      }),
    );
    expect(verifySrsDates(storage)).toBe(false);
  });

  it("mergeLegacyNotes skips empty or whitespace-only notes", () => {
    storage.setItem(
      "learnapp_notes_v1",
      JSON.stringify({
        m1: { text: "   ", updatedAt: 1 },
        m2: { text: "", updatedAt: 2 },
      }),
    );
    expect(mergeLegacyNotes(storage)).toBe(0);
    expect(storage.getItem("learnapp_note_sessions_v2")).toBeNull();
  });

  it("mergeLegacyNotes skips nodes with unknown subject prefix", () => {
    storage.setItem(
      "learnapp_notes_v1",
      JSON.stringify({ xyz1: { text: "orphan note", updatedAt: 1 } }),
    );
    expect(mergeLegacyNotes(storage)).toBe(0);
  });

  it("migrateThemeFromV1 skips when v2 preferences already have theme", () => {
    storage.setItem("learnapp_theme_v1", "light");
    storage.setItem("learnv2_preferences", JSON.stringify({ state: { theme: "dark" }, version: 0 }));
    expect(migrateThemeFromV1(storage)).toBe(false);
  });

  it("migrateThemeFromV1 force overwrites existing v2 theme", () => {
    storage.setItem("learnapp_theme_v1", "light");
    storage.setItem("learnv2_preferences", JSON.stringify({ state: { theme: "dark" }, version: 0 }));
    expect(migrateThemeFromV1(storage, { force: true })).toBe(true);
    const prefs = JSON.parse(storage.getItem("learnv2_preferences")!);
    expect(prefs.state.theme).toBe("light");
  });

  it("migrateThemeFromV1 skips invalid theme values", () => {
    storage.setItem("learnapp_theme_v1", "sepia");
    expect(migrateThemeFromV1(storage)).toBe(false);
    expect(storage.getItem("learnv2_preferences")).toBeNull();
  });

  it("hasV1Data detects progress, legacy notes, or v1 theme", () => {
    expect(hasV1Data(storage)).toBe(false);

    storage.setItem("learnapp_progress_v1", "{}");
    expect(hasV1Data(storage)).toBe(true);

    storage.clear();
    storage.setItem("learnapp_notes_v1", "{}");
    expect(hasV1Data(storage)).toBe(true);

    storage.clear();
    storage.setItem("learnapp_theme_v1", "dark");
    expect(hasV1Data(storage)).toBe(true);
  });

  it("normalizeV1Progress fills missing node fields and drops studySessions", () => {
    const normalized = normalizeV1Progress({
      totalXp: 10,
      nodes: { m1: { completedAt: "2026-01-01" } },
      studySessions: [{ id: "old" }],
    });
    expect(normalized.totalXp).toBe(10);
    expect((normalized.nodes as Record<string, { quizScores: unknown[] }>).m1.quizScores).toEqual([]);
    expect(normalized.studySessions).toBeUndefined();
  });

  it("mergeBookmarksFromV1 copies resource bookmarks into learnv2 store", () => {
    storage.setItem(
      "learnapp_bookmarks_v1",
      JSON.stringify([
        {
          nodeId: "m1",
          resourceIndex: 0,
          addedAt: "2026-01-01T00:00:00.000Z",
          note: "great article",
        },
      ]),
    );

    const result = mergeBookmarksFromV1(storage);
    expect(result.resourceMerged).toBe(1);
    expect(result.lessonMerged).toBe(0);

    const saved = JSON.parse(storage.getItem(V2_BOOKMARKS_KEY)!);
    expect(saved.state.resourceBookmarks).toHaveLength(1);
    expect(saved.state.resourceBookmarks[0].note).toBe("great article");
  });

  it("mergeBookmarksFromV1 copies lesson bookmarks into learnv2 store", () => {
    storage.setItem(
      "learnapp_lesson_bookmarks_v1",
      JSON.stringify([{ subjectId: "math", nodeId: "m2" }]),
    );

    const result = mergeBookmarksFromV1(storage);
    expect(result.resourceMerged).toBe(0);
    expect(result.lessonMerged).toBe(1);

    const saved = JSON.parse(storage.getItem(V2_BOOKMARKS_KEY)!);
    expect(saved.state.lessonBookmarks).toEqual([{ subjectId: "math", nodeId: "m2" }]);
  });

  it("mergeBookmarksFromV1 skips duplicates already in v2 store", () => {
    storage.setItem(
      "learnapp_bookmarks_v1",
      JSON.stringify([
        { nodeId: "m1", resourceIndex: 0, addedAt: "2026-01-01T00:00:00.000Z", note: "v1" },
      ]),
    );
    storage.setItem(
      "learnapp_lesson_bookmarks_v1",
      JSON.stringify([{ subjectId: "math", nodeId: "m1" }]),
    );
    storage.setItem(
      V2_BOOKMARKS_KEY,
      JSON.stringify({
        state: {
          resourceBookmarks: [
            { nodeId: "m1", resourceIndex: 0, addedAt: "2026-01-01T00:00:00.000Z", note: "existing" },
          ],
          lessonBookmarks: [{ subjectId: "math", nodeId: "m1" }],
        },
        version: 0,
      }),
    );

    const result = mergeBookmarksFromV1(storage);
    expect(result.resourceMerged).toBe(0);
    expect(result.lessonMerged).toBe(0);

    const saved = JSON.parse(storage.getItem(V2_BOOKMARKS_KEY)!);
    expect(saved.state.resourceBookmarks).toHaveLength(1);
    expect(saved.state.resourceBookmarks[0].note).toBe("existing");
    expect(saved.state.lessonBookmarks).toHaveLength(1);
  });

  it("hasV1Data detects v1 bookmark keys", () => {
    storage.setItem("learnapp_bookmarks_v1", "[]");
    expect(hasV1Data(storage)).toBe(true);

    storage.clear();
    storage.setItem("learnapp_lesson_bookmarks_v1", "[]");
    expect(hasV1Data(storage)).toBe(true);
  });
});
