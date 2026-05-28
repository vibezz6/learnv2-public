import { notifyAdmissionsUpdated } from "./admissionsSync";
import { readJson, writeJson } from "@/lib/storageJson";

export const ESSAY_TRACKER_KEY = "learnv2_essay_tracker_v1";

export type EssayDraftStatus =
  | "not_started"
  | "outline"
  | "draft"
  | "revision"
  | "final";

export const ESSAY_STATUS_ORDER: EssayDraftStatus[] = [
  "not_started",
  "outline",
  "draft",
  "revision",
  "final",
];

export const ESSAY_STATUS_LABELS: Record<EssayDraftStatus, string> = {
  not_started: "Not started",
  outline: "Outline",
  draft: "First draft",
  revision: "Revision",
  final: "Final",
};

export interface EssayPromptTemplate {
  id: string;
  title: string;
  prompt: string;
  wordLimit?: number;
  kind: "personal" | "supplement" | "short";
}

export interface EssayEntry {
  id: string;
  templateId: string | null;
  title: string;
  prompt: string;
  college?: string;
  status: EssayDraftStatus;
  dueDate?: string;
  createdAt: number;
  updatedAt: number;
}

export interface EssayTrackerState {
  essays: EssayEntry[];
}

export const DEFAULT_ESSAY_PROMPTS: EssayPromptTemplate[] = [
  {
    id: "common-app-personal",
    kind: "personal",
    title: "Common App personal statement",
    wordLimit: 650,
    prompt:
      "Some students have a background, identity, interest, or talent that is so meaningful they believe their application would be incomplete without it. If this sounds like you, then please share your story.",
  },
  {
    id: "why-us",
    kind: "supplement",
    title: "Why this college?",
    wordLimit: 250,
    prompt:
      "Why are you interested in this school? Be specific about programs, culture, or opportunities — avoid generic praise.",
  },
  {
    id: "why-major",
    kind: "supplement",
    title: "Why this major?",
    wordLimit: 250,
    prompt:
      "What sparked your interest in your intended field, and how have you explored it inside and outside school?",
  },
  {
    id: "activity-short",
    kind: "short",
    title: "Activity essay (150 words)",
    wordLimit: 150,
    prompt:
      "Pick one activity that matters most to you. What did you do, and what did you learn about yourself?",
  },
  {
    id: "additional-info",
    kind: "short",
    title: "Additional information (optional)",
    wordLimit: 250,
    prompt:
      "Use only if you need context the rest of the application does not cover — gaps, hardships, or unique circumstances.",
  },
];

function emptyState(): EssayTrackerState {
  return { essays: [] };
}

function isValidState(value: unknown): value is EssayTrackerState {
  if (!value || typeof value !== "object") return false;
  const o = value as EssayTrackerState;
  return Array.isArray(o.essays);
}

function isValidStatus(s: unknown): s is EssayDraftStatus {
  return typeof s === "string" && ESSAY_STATUS_ORDER.includes(s as EssayDraftStatus);
}

function normalizeEntry(raw: unknown): EssayEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const e = raw as EssayEntry;
  if (typeof e.id !== "string" || typeof e.title !== "string" || typeof e.prompt !== "string") {
    return null;
  }
  const status = isValidStatus(e.status) ? e.status : "not_started";
  return {
    id: e.id,
    templateId: typeof e.templateId === "string" ? e.templateId : null,
    title: e.title,
    prompt: e.prompt,
    college: typeof e.college === "string" ? e.college : undefined,
    status,
    dueDate: typeof e.dueDate === "string" ? e.dueDate : undefined,
    createdAt: typeof e.createdAt === "number" ? e.createdAt : Date.now(),
    updatedAt: typeof e.updatedAt === "number" ? e.updatedAt : Date.now(),
  };
}

function newId(): string {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `essay-${Date.now()}`;
}

export function loadEssayTracker(storage: Storage = localStorage): EssayTrackerState {
  const parsed = readJson(storage, ESSAY_TRACKER_KEY, emptyState(), isValidState);
  const essays = parsed.essays.map(normalizeEntry).filter((e): e is EssayEntry => e !== null);
  return { essays };
}

export function saveEssayTracker(state: EssayTrackerState, storage: Storage = localStorage): void {
  if (writeJson(storage, ESSAY_TRACKER_KEY, state)) {
    notifyAdmissionsUpdated();
  }
}

export function getPromptTemplate(id: string): EssayPromptTemplate | undefined {
  return DEFAULT_ESSAY_PROMPTS.find((p) => p.id === id);
}

export function addEssayFromTemplate(
  state: EssayTrackerState,
  templateId: string,
  options?: { college?: string; dueDate?: string },
): EssayTrackerState {
  const template = getPromptTemplate(templateId);
  if (!template) return state;
  const now = Date.now();
  const entry: EssayEntry = {
    id: newId(),
    templateId,
    title: template.title,
    prompt: template.prompt,
    college: options?.college?.trim() || undefined,
    status: "not_started",
    dueDate: options?.dueDate?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };
  return { essays: [...state.essays, entry] };
}

export function addCustomEssay(
  state: EssayTrackerState,
  title: string,
  prompt: string,
  options?: { college?: string; dueDate?: string },
): EssayTrackerState {
  const trimmedTitle = title.trim();
  const trimmedPrompt = prompt.trim();
  if (!trimmedTitle) return state;
  const now = Date.now();
  const entry: EssayEntry = {
    id: newId(),
    templateId: null,
    title: trimmedTitle,
    prompt: trimmedPrompt || "Write your own prompt or notes here.",
    college: options?.college?.trim() || undefined,
    status: "not_started",
    dueDate: options?.dueDate?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };
  return { essays: [...state.essays, entry] };
}

export function updateEssayStatus(
  state: EssayTrackerState,
  id: string,
  status: EssayDraftStatus,
): EssayTrackerState {
  return {
    essays: state.essays.map((e) =>
      e.id === id ? { ...e, status, updatedAt: Date.now() } : e,
    ),
  };
}

export function updateEssayDueDate(
  state: EssayTrackerState,
  id: string,
  dueDate: string | undefined,
): EssayTrackerState {
  return {
    essays: state.essays.map((e) =>
      e.id === id
        ? { ...e, dueDate: dueDate?.trim() || undefined, updatedAt: Date.now() }
        : e,
    ),
  };
}

export function updateEssayCollege(
  state: EssayTrackerState,
  id: string,
  college: string | undefined,
): EssayTrackerState {
  return {
    essays: state.essays.map((e) =>
      e.id === id
        ? { ...e, college: college?.trim() || undefined, updatedAt: Date.now() }
        : e,
    ),
  };
}

export function removeEssay(state: EssayTrackerState, id: string): EssayTrackerState {
  return { essays: state.essays.filter((e) => e.id !== id) };
}

export function getEssayTrackerProgress(state: EssayTrackerState): {
  total: number;
  finalCount: number;
  inProgress: number;
  pct: number;
} {
  const total = state.essays.length;
  const finalCount = state.essays.filter((e) => e.status === "final").length;
  const inProgress = state.essays.filter(
    (e) => e.status !== "not_started" && e.status !== "final",
  ).length;
  const pct = total > 0 ? Math.round((finalCount / total) * 100) : 0;
  return { total, finalCount, inProgress, pct };
}

/** Essays with a due date on or before `withinDays` from today (UTC date), not yet final. */
export function getEssaysDueSoon(
  state: EssayTrackerState,
  withinDays = 14,
  now = new Date(),
): EssayEntry[] {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const msPerDay = 86400000;
  const horizon = today + withinDays * msPerDay;
  return state.essays.filter((e) => {
    if (e.status === "final" || !e.dueDate) return false;
    const parts = e.dueDate.split("-").map(Number);
    if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return false;
    const due = Date.UTC(parts[0]!, parts[1]! - 1, parts[2]!);
    return due >= today && due <= horizon;
  });
}

export function wordLimitForEntry(entry: EssayEntry): number | undefined {
  if (!entry.templateId) return undefined;
  return getPromptTemplate(entry.templateId)?.wordLimit;
}
