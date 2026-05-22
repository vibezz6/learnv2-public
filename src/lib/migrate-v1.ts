import type { NoteSession } from "@/curriculum/types";
import type { ThemeMode } from "@/stores/preferences";

const V1_PROGRESS = "learnapp_progress_v1";
const V1_NOTES = "learnapp_notes_v1";
const V1_THEME = "learnapp_theme_v1";
const V2_NOTE_SESSIONS = "learnapp_note_sessions_v2";
const V2_PREFERENCES = "learnv2_preferences";

interface LegacyNote {
  text: string;
  updatedAt: number;
}

export interface MigrationDetails {
  progress: boolean;
  notesMerged: number;
  themeMigrated: boolean;
  srsDatesPreserved: boolean;
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

/** Copy v1 theme into learnv2 preferences if v2 has no saved theme yet. */
export function migrateThemeFromV1(storage: Storage = localStorage): boolean {
  const v1Theme = storage.getItem(V1_THEME);
  if (!v1Theme || (v1Theme !== "dark" && v1Theme !== "light")) return false;

  const existing = readJson<{ state?: { theme?: ThemeMode } }>(storage, V2_PREFERENCES);
  if (existing?.state?.theme) return false;

  storage.setItem(
    V2_PREFERENCES,
    JSON.stringify({ state: { theme: v1Theme as ThemeMode }, version: 0 }),
  );
  return true;
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
  return (
    storage.getItem(V1_PROGRESS) !== null ||
    storage.getItem(V1_NOTES) !== null ||
    storage.getItem(V2_NOTE_SESSIONS) !== null
  );
}
