import {
  saveCollegeChecklist,
  type CollegeChecklistState,
  type CustomChecklistItem,
} from "./collegeChecklist";
import {
  ESSAY_STATUS_ORDER,
  saveEssayTracker,
  type EssayDraftStatus,
  type EssayEntry,
  type EssayTrackerState,
} from "./essayTracker";
import { clearAllNudgeSnoozes } from "./nudgeSnooze";

export type AdmissionsImportResult =
  | { ok: true; checklist: CollegeChecklistState; essays: EssayTrackerState }
  | { ok: false; error: string };

function isValidChecklist(value: unknown): value is CollegeChecklistState {
  if (!value || typeof value !== "object") return false;
  const o = value as CollegeChecklistState;
  return typeof o.completed === "object" && o.completed !== null && Array.isArray(o.customItems);
}

function isValidEssays(value: unknown): value is EssayTrackerState {
  if (!value || typeof value !== "object") return false;
  const o = value as EssayTrackerState;
  return Array.isArray(o.essays);
}

function isValidStatus(s: unknown): s is EssayDraftStatus {
  return typeof s === "string" && ESSAY_STATUS_ORDER.includes(s as EssayDraftStatus);
}

function normalizeChecklist(raw: CollegeChecklistState): CollegeChecklistState {
  return {
    completed: { ...raw.completed },
    customItems: raw.customItems
      .filter(
        (c): c is CustomChecklistItem =>
          typeof c.id === "string" && typeof c.title === "string" && typeof c.completed === "boolean",
      )
      .map((c) => ({
        id: c.id,
        title: c.title,
        completed: c.completed,
        dueDate: typeof c.dueDate === "string" ? c.dueDate : undefined,
        createdAt: typeof c.createdAt === "number" ? c.createdAt : Date.now(),
      })),
  };
}

function normalizeEssay(raw: unknown): EssayEntry | null {
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

function normalizeEssays(raw: EssayTrackerState): EssayTrackerState {
  const essays = raw.essays.map(normalizeEssay).filter((e): e is EssayEntry => e !== null);
  return { essays };
}

export function parseAdmissionsImportPayload(raw: unknown): AdmissionsImportResult {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "Invalid JSON: expected an object." };
  }
  const o = raw as Record<string, unknown>;
  const checklist = o.checklist;
  const essays = o.essays;
  if (!isValidChecklist(checklist)) {
    return { ok: false, error: "Missing or invalid checklist (need completed + customItems)." };
  }
  if (!isValidEssays(essays)) {
    return { ok: false, error: "Missing or invalid essays (need essays array)." };
  }
  return {
    ok: true,
    checklist: normalizeChecklist(checklist),
    essays: normalizeEssays(essays),
  };
}

export function parseAdmissionsImportJson(text: string): AdmissionsImportResult {
  try {
    const parsed: unknown = JSON.parse(text);
    return parseAdmissionsImportPayload(parsed);
  } catch {
    return { ok: false, error: "Could not parse JSON." };
  }
}

export function applyAdmissionsImport(result: Extract<AdmissionsImportResult, { ok: true }>): void {
  saveCollegeChecklist(result.checklist);
  saveEssayTracker(result.essays);
}

export function clearAllAdmissionsData(storage: Storage = localStorage): void {
  saveCollegeChecklist({ completed: {}, customItems: [] }, storage);
  saveEssayTracker({ essays: [] }, storage);
  clearAllNudgeSnoozes(storage);
}
