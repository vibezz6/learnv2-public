import type { SkillNode } from "@/curriculum/types";
import { readJson, writeJson } from "@/lib/storageJson";

export const LESSON_DRAFTS_STORAGE_KEY = "learnv2_lesson_drafts_v1";

export type LessonDraftStatus = "draft" | "reviewed";

export interface LessonDraft {
  id: string;
  subjectId: string;
  node: SkillNode;
  status: LessonDraftStatus;
  sourceModel?: string;
  reviewNotes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface LessonDraftState {
  schemaVersion: 1;
  drafts: LessonDraft[];
}

export interface LessonDraftInput {
  subjectId: string;
  node: SkillNode;
  sourceModel?: string;
}

function emptyState(): LessonDraftState {
  return { schemaVersion: 1, drafts: [] };
}

function isSkillNode(value: unknown): value is SkillNode {
  if (!value || typeof value !== "object") return false;
  const node = value as Partial<SkillNode>;
  return (
    typeof node.id === "string" &&
    typeof node.name === "string" &&
    typeof node.description === "string" &&
    typeof node.xpValue === "number" &&
    Array.isArray(node.parentIds) &&
    typeof node.estimatedMinutes === "number" &&
    Array.isArray(node.resources) &&
    Array.isArray(node.keyConcepts) &&
    typeof node.whyItMatters === "string" &&
    Array.isArray(node.practiceProblems) &&
    (node.difficulty === "beginner" || node.difficulty === "intermediate" || node.difficulty === "advanced")
  );
}

function isLessonDraft(value: unknown): value is LessonDraft {
  if (!value || typeof value !== "object") return false;
  const draft = value as Partial<LessonDraft>;
  return (
    typeof draft.id === "string" &&
    typeof draft.subjectId === "string" &&
    isSkillNode(draft.node) &&
    (draft.status === "draft" || draft.status === "reviewed") &&
    typeof draft.createdAt === "number" &&
    typeof draft.updatedAt === "number"
  );
}

function isState(value: unknown): value is LessonDraftState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<LessonDraftState>;
  return state.schemaVersion === 1 && Array.isArray(state.drafts);
}

function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `lesson-draft-${Date.now()}`;
}

export function loadLessonDrafts(storage: Storage = localStorage): LessonDraftState {
  const parsed = readJson(storage, LESSON_DRAFTS_STORAGE_KEY, emptyState(), isState);
  return {
    schemaVersion: 1,
    drafts: parsed.drafts.filter(isLessonDraft).sort((a, b) => b.updatedAt - a.updatedAt),
  };
}

export function parseLessonDraftJson(
  raw: string,
): { node: SkillNode } | { error: string } {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isSkillNode(parsed)) return { error: "JSON is not a valid SkillNode shape." };
    return { node: parsed };
  } catch {
    return { error: "Could not parse lesson JSON." };
  }
}

export function addLessonDraft(
  input: LessonDraftInput,
  storage: Storage = localStorage,
): LessonDraft {
  const now = Date.now();
  const draft: LessonDraft = {
    id: newId(),
    subjectId: input.subjectId.trim() || "sat-prep",
    node: input.node,
    status: "draft",
    sourceModel: input.sourceModel?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };
  const state = loadLessonDrafts(storage);
  writeJson(storage, LESSON_DRAFTS_STORAGE_KEY, {
    schemaVersion: 1,
    drafts: [draft, ...state.drafts].slice(0, 25),
  });
  return draft;
}

export function updateLessonDraftReview(
  id: string,
  reviewNotes: string,
  storage: Storage = localStorage,
): LessonDraft | null {
  const state = loadLessonDrafts(storage);
  let updated: LessonDraft | null = null;
  const drafts = state.drafts.map((draft) => {
    if (draft.id !== id) return draft;
    updated = {
      ...draft,
      status: reviewNotes.trim() ? "reviewed" : "draft",
      reviewNotes: reviewNotes.trim() || undefined,
      updatedAt: Date.now(),
    };
    return updated;
  });
  writeJson(storage, LESSON_DRAFTS_STORAGE_KEY, { schemaVersion: 1, drafts });
  return updated;
}

export function deleteLessonDraft(id: string, storage: Storage = localStorage): boolean {
  const state = loadLessonDrafts(storage);
  const drafts = state.drafts.filter((draft) => draft.id !== id);
  if (drafts.length === state.drafts.length) return false;
  writeJson(storage, LESSON_DRAFTS_STORAGE_KEY, { schemaVersion: 1, drafts });
  return true;
}
