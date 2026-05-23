import type { NoteSession } from "@/curriculum/types";
import {
  V2_BOOKMARKS_KEY,
  type LessonBookmark,
  type ResourceBookmark,
} from "@/stores/bookmarks";
import type { ThemeMode } from "@/stores/preferences";

const V1_PROGRESS = "learnapp_progress_v1";
const V1_NOTES = "learnapp_notes_v1";
const V1_THEME = "learnapp_theme_v1";
const V1_RESOURCE_BOOKMARKS = "learnapp_bookmarks_v1";
const V1_LESSON_BOOKMARKS = "learnapp_lesson_bookmarks_v1";
const V1_TAKEAWAYS = "learnapp_takeaways_v1";
const V1_ACHIEVEMENTS = "learnapp_achievements_v1";
const V2_NOTE_SESSIONS = "learnapp_note_sessions_v2";
const V2_PREFERENCES = "learnv2_preferences";
export const V2_ACHIEVEMENTS = "learnv2_achievements_v1";
export const V1_MIGRATION_DONE_AT = "learnv2_migration_done_at";

interface LegacyNote {
  text: string;
  updatedAt: number;
}

export interface BookmarksMigrationResult {
  resourceMerged: number;
  lessonMerged: number;
}

export interface MigrationDetails {
  progress: boolean;
  notesMerged: number;
  takeawaysMerged: number;
  themeMigrated: boolean;
  srsDatesPreserved: boolean;
  resourceBookmarksMerged: number;
  lessonBookmarksMerged: number;
  achievementsMerged: number;
}

export interface MigrationResult {
  success: boolean;
  message: string;
  details: MigrationDetails;
}

/** Infer subject from node id (matches learnv2 curriculum prefixes). */
export function inferSubjectId(nodeId: string): string | null {
  if (nodeId.startsWith("pr")) return "probability";
  if (nodeId.startsWith("em")) return "engineering";
  if (nodeId.startsWith("ai")) return "ai";
  if (nodeId.startsWith("m")) return "math";
  if (nodeId.startsWith("s")) return "science";
  if (nodeId.startsWith("c")) return "cs";
  if (nodeId.startsWith("f")) return "finance";
  if (nodeId.startsWith("t")) return "trading";
  if (nodeId.startsWith("p")) return "programming";
  return null;
}

function readJson<T>(storage: Storage, key: string): T | null {
  try {
    const raw = storage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/** Merge legacy v1 freeform notes into note sessions where no session exists. */
export function mergeLegacyNotes(storage: Storage = localStorage): number {
  const legacy = readJson<Record<string, LegacyNote>>(storage, V1_NOTES);
  if (!legacy) return 0;

  const sessions = readJson<Record<string, NoteSession>>(storage, V2_NOTE_SESSIONS) ?? {};
  let merged = 0;

  for (const [nodeId, note] of Object.entries(legacy)) {
    if (!note.text?.trim() || sessions[nodeId]) continue;
    const subjectId = inferSubjectId(nodeId);
    if (!subjectId) continue;

    sessions[nodeId] = {
      nodeId,
      subjectId,
      responses: { legacy: note.text.trim() },
      review: null,
      mentorSession: null,
      tags: ["migrated-v1"],
      createdAt: note.updatedAt,
      updatedAt: note.updatedAt,
    };
    merged++;
  }

  if (merged > 0) {
    storage.setItem(V2_NOTE_SESSIONS, JSON.stringify(sessions));
  }
  return merged;
}

function normalizeTakeawaysText(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || null;
  }
  if (Array.isArray(value)) {
    const items = value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
    return items.length > 0 ? items.join("\n") : null;
  }
  return null;
}

/** Merge v1 lesson takeaways into note session responses.takeaways. */
export function mergeTakeawaysFromV1(storage: Storage = localStorage): number {
  const takeaways = readJson<Record<string, unknown>>(storage, V1_TAKEAWAYS);
  if (!takeaways) return 0;

  const sessions = readJson<Record<string, NoteSession>>(storage, V2_NOTE_SESSIONS) ?? {};
  let merged = 0;
  const now = Date.now();

  for (const [nodeId, raw] of Object.entries(takeaways)) {
    const text = normalizeTakeawaysText(raw);
    if (!text || sessions[nodeId]) continue;
    const subjectId = inferSubjectId(nodeId);
    if (!subjectId) continue;

    sessions[nodeId] = {
      nodeId,
      subjectId,
      responses: { takeaways: text },
      review: null,
      mentorSession: null,
      tags: ["migrated-v1"],
      createdAt: now,
      updatedAt: now,
    };
    merged++;
  }

  if (merged > 0) {
    storage.setItem(V2_NOTE_SESSIONS, JSON.stringify(sessions));
  }
  return merged;
}

/** Merge v1 resource and lesson bookmarks into learnv2 bookmarks store. */
export function mergeBookmarksFromV1(storage: Storage = localStorage): BookmarksMigrationResult {
  const v1Resources = readJson<ResourceBookmark[]>(storage, V1_RESOURCE_BOOKMARKS) ?? [];
  const v1Lessons = readJson<Array<{ subjectId: string; nodeId: string }>>(
    storage,
    V1_LESSON_BOOKMARKS,
  ) ?? [];

  if (v1Resources.length === 0 && v1Lessons.length === 0) {
    return { resourceMerged: 0, lessonMerged: 0 };
  }

  const existing = readJson<{
    state?: { resourceBookmarks?: ResourceBookmark[]; lessonBookmarks?: LessonBookmark[] };
  }>(storage, V2_BOOKMARKS_KEY);

  const resourceBookmarks = [...(existing?.state?.resourceBookmarks ?? [])];
  const lessonBookmarks = [...(existing?.state?.lessonBookmarks ?? [])];

  let resourceMerged = 0;
  for (const bookmark of v1Resources) {
    if (!bookmark.nodeId || typeof bookmark.resourceIndex !== "number") continue;
    const exists = resourceBookmarks.some(
      (b) => b.nodeId === bookmark.nodeId && b.resourceIndex === bookmark.resourceIndex,
    );
    if (exists) continue;
    resourceBookmarks.push({
      nodeId: bookmark.nodeId,
      resourceIndex: bookmark.resourceIndex,
      addedAt: bookmark.addedAt || new Date().toISOString(),
      note: bookmark.note ?? "",
    });
    resourceMerged++;
  }

  let lessonMerged = 0;
  for (const bookmark of v1Lessons) {
    if (!bookmark.subjectId || !bookmark.nodeId) continue;
    const exists = lessonBookmarks.some(
      (b) => b.subjectId === bookmark.subjectId && b.nodeId === bookmark.nodeId,
    );
    if (exists) continue;
    lessonBookmarks.push({ subjectId: bookmark.subjectId, nodeId: bookmark.nodeId });
    lessonMerged++;
  }

  if (resourceMerged > 0 || lessonMerged > 0) {
    storage.setItem(
      V2_BOOKMARKS_KEY,
      JSON.stringify({
        state: { resourceBookmarks, lessonBookmarks },
        version: 0,
      }),
    );
  }

  return { resourceMerged, lessonMerged };
}

/** Copy v1 theme into learnv2 preferences if v2 has no saved theme yet. */
export function migrateThemeFromV1(
  storage: Storage = localStorage,
  options: { force?: boolean } = {},
): boolean {
  const v1Theme = storage.getItem(V1_THEME);
  if (!v1Theme || (v1Theme !== "dark" && v1Theme !== "light")) return false;

  const existing = readJson<{ state?: { theme?: ThemeMode } }>(storage, V2_PREFERENCES);
  if (!options.force && existing?.state?.theme) return false;

  storage.setItem(
    V2_PREFERENCES,
    JSON.stringify({ state: { theme: v1Theme as ThemeMode }, version: 0 }),
  );
  return true;
}

/** Copy v1 achievements to the v2 namespace when v2 has not written achievements yet. */
export function migrateAchievementsFromV1(storage: Storage = localStorage): number {
  if (storage.getItem(V2_ACHIEVEMENTS) !== null) return 0;

  const achievements = readJson<unknown[]>(storage, V1_ACHIEVEMENTS);
  if (!Array.isArray(achievements) || achievements.length === 0) return 0;

  const uniqueAchievements = [...new Set(achievements.filter((item): item is string => typeof item === "string"))];
  if (uniqueAchievements.length === 0) return 0;

  storage.setItem(V2_ACHIEVEMENTS, JSON.stringify(uniqueAchievements));
  return uniqueAchievements.length;
}

/** Verify SRS scheduled dates survived progress import (UTC YYYY-MM-DD strings). */
export function verifySrsDates(storage: Storage = localStorage): boolean {
  const progress = readJson<{
    spacedRepetition?: Record<string, { scheduledReviews: Array<{ scheduledDate: string }> }>;
  }>(storage, V1_PROGRESS);
  if (!progress?.spacedRepetition) return true;

  const dateRe = /^\d{4}-\d{2}-\d{2}$/;
  for (const item of Object.values(progress.spacedRepetition)) {
    for (const review of item.scheduledReviews ?? []) {
      if (review.scheduledDate && !dateRe.test(review.scheduledDate)) return false;
    }
  }
  return true;
}

export function hasV1Data(storage: Storage = localStorage): boolean {
  if (storage.getItem(V1_MIGRATION_DONE_AT) !== null) return false;

  return (
    storage.getItem(V1_PROGRESS) !== null ||
    storage.getItem(V1_NOTES) !== null ||
    storage.getItem(V1_THEME) !== null ||
    storage.getItem(V1_RESOURCE_BOOKMARKS) !== null ||
    storage.getItem(V1_LESSON_BOOKMARKS) !== null ||
    storage.getItem(V1_TAKEAWAYS) !== null ||
    storage.getItem(V1_ACHIEVEMENTS) !== null
  );
}

/** Normalize raw v1 progress JSON before importing into v2. */
export function normalizeV1Progress(raw: Record<string, unknown>): Record<string, unknown> {
  const parsed = { ...raw };
  parsed.recentlyVisited ??= [];
  parsed.dailyChallenges ??= {};
  parsed.streaks ??= { current: 0, longest: 0, lastStudyDate: null };
  parsed.dailyMinutes ??= {};
  parsed.spacedRepetition ??= {};
  parsed.dailyReviews ??= {};
  parsed.reviewStreak ??= { current: 0, longest: 0, lastReviewDate: null };
  parsed.nodes ??= {};

  for (const node of Object.values(parsed.nodes as Record<string, Record<string, unknown>>)) {
    node.quizScores ??= [];
    node.quizHistory ??= [];
  }

  delete parsed.studySessions;
  return parsed;
}
