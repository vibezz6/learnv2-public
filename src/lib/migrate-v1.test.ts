import { describe, expect, it, beforeEach } from "vitest";
import {
  hasV1Data,
  inferSubjectId,
  mergeBookmarksFromV1,
  mergeLegacyNotes,
  mergeTakeawaysFromV1,
  migrateAchievementsFromV1,
  migrateThemeFromV1,
  normalizeV1Progress,
  V1_MIGRATION_DONE_AT,
  V2_ACHIEVEMENTS,
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
    expect(inferSubjectId("st1")).toBe("sat-prep");
    expect(inferSubjectId("lab3")).toBe("algo-lab");
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

  it("mergeLegacyNotes skips nodes that already have legacy responses", () => {
    storage.setItem("learnapp_notes_v1", JSON.stringify({ m1: { text: "old", updatedAt: 1 } }));
    storage.setItem(
      "learnapp_note_sessions_v2",
      JSON.stringify({
        m1: {
          nodeId: "m1",
          subjectId: "math",
          responses: { legacy: "existing legacy" },
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

  it("mergeLegacyNotes merges into existing sessions missing legacy responses", () => {
    storage.setItem("learnapp_notes_v1", JSON.stringify({ m1: { text: "v1 note", updatedAt: 2000 } }));
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
    expect(mergeLegacyNotes(storage)).toBe(1);
    const sessions = JSON.parse(storage.getItem("learnapp_note_sessions_v2")!);
    expect(sessions.m1.responses.q1).toBe("existing");
    expect(sessions.m1.responses.legacy).toBe("v1 note");
    expect(sessions.m1.updatedAt).toBe(2000);
    expect(sessions.m1.tags).toContain("migrated-v1");
  });

  it("mergeTakeawaysFromV1 creates sessions with responses.takeaways", () => {
    storage.setItem(
      "learnapp_takeaways_v1",
      JSON.stringify({ m1: ["First insight", "Second insight"] }),
    );
    const merged = mergeTakeawaysFromV1(storage);
    expect(merged).toBe(1);
    const sessions = JSON.parse(storage.getItem("learnapp_note_sessions_v2")!);
    expect(sessions.m1.responses.takeaways).toBe("First insight\nSecond insight");
    expect(sessions.m1.tags).toContain("migrated-v1");
  });

  it("mergeTakeawaysFromV1 accepts legacy v1 string takeaways", () => {
    storage.setItem(
      "learnapp_takeaways_v1",
      JSON.stringify({ m2: "One sentence takeaway" }),
    );
    const merged = mergeTakeawaysFromV1(storage);
    expect(merged).toBe(1);
    const sessions = JSON.parse(storage.getItem("learnapp_note_sessions_v2")!);
    expect(sessions.m2.responses.takeaways).toBe("One sentence takeaway");
  });

  it("mergeTakeawaysFromV1 returns 0 when v1 takeaways key is missing", () => {
    expect(mergeTakeawaysFromV1(storage)).toBe(0);
    expect(storage.getItem("learnapp_note_sessions_v2")).toBeNull();
  });

  it("mergeTakeawaysFromV1 skips empty or whitespace-only takeaways", () => {
    storage.setItem(
      "learnapp_takeaways_v1",
      JSON.stringify({
        m1: [],
        m2: ["  ", ""],
        m3: "   ",
      }),
    );
    expect(mergeTakeawaysFromV1(storage)).toBe(0);
    expect(storage.getItem("learnapp_note_sessions_v2")).toBeNull();
  });

  it("mergeTakeawaysFromV1 skips nodes that already have takeaways responses", () => {
    storage.setItem(
      "learnapp_takeaways_v1",
      JSON.stringify({ m1: ["Key insight"] }),
    );
    storage.setItem(
      "learnapp_note_sessions_v2",
      JSON.stringify({
        m1: {
          nodeId: "m1",
          subjectId: "math",
          responses: { takeaways: "existing takeaway" },
          review: null,
          mentorSession: null,
          tags: [],
          createdAt: 1,
          updatedAt: 1,
        },
      }),
    );
    expect(mergeTakeawaysFromV1(storage)).toBe(0);
    const sessions = JSON.parse(storage.getItem("learnapp_note_sessions_v2")!);
    expect(sessions.m1.responses.takeaways).toBe("existing takeaway");
  });

  it("mergeTakeawaysFromV1 merges into existing sessions missing takeaways responses", () => {
    storage.setItem(
      "learnapp_takeaways_v1",
      JSON.stringify({ m1: ["Key insight"] }),
    );
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
    expect(mergeTakeawaysFromV1(storage)).toBe(1);
    const sessions = JSON.parse(storage.getItem("learnapp_note_sessions_v2")!);
    expect(sessions.m1.responses.q1).toBe("existing");
    expect(sessions.m1.responses.takeaways).toBe("Key insight");
    expect(sessions.m1.tags).toContain("migrated-v1");
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

  it("hasV1Data detects v1 takeaways and achievements until migration is marked done", () => {
    storage.setItem("learnapp_takeaways_v1", "{}");
    expect(hasV1Data(storage)).toBe(true);

    storage.clear();
    storage.setItem("learnapp_achievements_v1", JSON.stringify(["first_lesson"]));
    expect(hasV1Data(storage)).toBe(true);

    storage.setItem(V1_MIGRATION_DONE_AT, "2026-05-23T00:00:00.000Z");
    expect(hasV1Data(storage)).toBe(false);
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

  it("migrateAchievementsFromV1 copies unique achievements to the v2 key", () => {
    storage.setItem("learnapp_achievements_v1", JSON.stringify(["first_lesson", "first_lesson", "level_5"]));

    expect(migrateAchievementsFromV1(storage)).toBe(2);
    expect(JSON.parse(storage.getItem(V2_ACHIEVEMENTS)!)).toEqual(["first_lesson", "level_5"]);
  });

  it("migrateAchievementsFromV1 does not overwrite an existing v2 achievements key", () => {
    storage.setItem("learnapp_achievements_v1", JSON.stringify(["first_lesson"]));
    storage.setItem(V2_ACHIEVEMENTS, JSON.stringify(["level_5"]));

    expect(migrateAchievementsFromV1(storage)).toBe(0);
    expect(JSON.parse(storage.getItem(V2_ACHIEVEMENTS)!)).toEqual(["level_5"]);
  });

  it("hasV1Data detects v1 bookmark keys", () => {
    storage.setItem("learnapp_bookmarks_v1", "[]");
    expect(hasV1Data(storage)).toBe(true);

    storage.clear();
    storage.setItem("learnapp_lesson_bookmarks_v1", "[]");
    expect(hasV1Data(storage)).toBe(true);
  });
});
