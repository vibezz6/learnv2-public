import { describe, expect, it, beforeEach } from "vitest";
import {
  inferSubjectId,
  mergeLegacyNotes,
  migrateThemeFromV1,
  verifySrsDates,
} from "@/lib/migrate-v1";

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
});
