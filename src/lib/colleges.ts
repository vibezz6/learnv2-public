import { notifyAdmissionsUpdated } from "@/lib/admissionsSync";
import { daysUntilDue } from "@/lib/campusAdmissionsNudges";
import { loadEssayTracker } from "@/lib/essayTracker";
import { readJson, writeJson } from "@/lib/storageJson";

export const COLLEGES_STORAGE_KEY = "learnv2_colleges_v1";

export const COLLEGE_NOTES_MAX_LENGTH = 80;
export const COLLEGE_NOTES_DISPLAY_MAX = 24;

export interface CollegeEntry {
  id: string;
  name: string;
  slug: string;
  deadline?: string;
  /** Optional label (e.g. ED, EA, RD) — copy-only, not a deadline schema. */
  notes?: string;
  createdAt: string;
}

export function normalizeCollegeNotes(notes: string | undefined): string | undefined {
  const trimmed = notes?.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, COLLEGE_NOTES_MAX_LENGTH);
}

export function formatCollegeDisplayName(name: string, notes?: string): string {
  const trimmed = notes?.trim();
  if (!trimmed) return name;
  const short =
    trimmed.length > COLLEGE_NOTES_DISPLAY_MAX
      ? `${trimmed.slice(0, COLLEGE_NOTES_DISPLAY_MAX)}…`
      : trimmed;
  return `${name} · ${short}`;
}

export interface CollegesState {
  colleges: CollegeEntry[];
}

function emptyState(): CollegesState {
  return { colleges: [] };
}

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function loadColleges(storage: Storage = localStorage): CollegesState {
  const parsed = readJson<CollegesState>(storage, COLLEGES_STORAGE_KEY, emptyState());
  if (!parsed || !Array.isArray(parsed.colleges)) return emptyState();
  return {
    colleges: parsed.colleges.filter(
      (c): c is CollegeEntry =>
        !!c &&
        typeof c === "object" &&
        typeof (c as CollegeEntry).id === "string" &&
        typeof (c as CollegeEntry).name === "string",
    ),
  };
}

export function saveColleges(state: CollegesState, storage: Storage = localStorage): void {
  writeJson(storage, COLLEGES_STORAGE_KEY, state);
  notifyAdmissionsUpdated();
}

export function listColleges(storage: Storage = localStorage): CollegeEntry[] {
  return [...loadColleges(storage).colleges].sort((a, b) => a.name.localeCompare(b.name));
}

export function findCollegeByName(
  name: string,
  storage: Storage = localStorage,
): CollegeEntry | undefined {
  const trimmed = name.trim();
  return listColleges(storage).find((c) => c.name === trimmed);
}

export function addCollege(
  name: string,
  deadline?: string,
  notes?: string,
  storage: Storage = localStorage,
): CollegesState {
  const trimmed = name.trim();
  if (!trimmed) return loadColleges(storage);
  const state = loadColleges(storage);
  if (state.colleges.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
    return state;
  }
  const entry: CollegeEntry = {
    id: generateId(),
    name: trimmed,
    slug: slugify(trimmed) || generateId(),
    deadline: deadline?.trim() || undefined,
    notes: normalizeCollegeNotes(notes),
    createdAt: new Date().toISOString(),
  };
  const next = { colleges: [...state.colleges, entry] };
  saveColleges(next, storage);
  return next;
}

export function updateCollegeDeadline(
  id: string,
  deadline: string | undefined,
  storage: Storage = localStorage,
): CollegesState {
  const state = loadColleges(storage);
  const next = {
    colleges: state.colleges.map((c) =>
      c.id === id ? { ...c, deadline: deadline?.trim() || undefined } : c,
    ),
  };
  saveColleges(next, storage);
  return next;
}

export function updateCollegeNotes(
  id: string,
  notes: string | undefined,
  storage: Storage = localStorage,
): CollegesState {
  const state = loadColleges(storage);
  const next = {
    colleges: state.colleges.map((c) =>
      c.id === id ? { ...c, notes: normalizeCollegeNotes(notes) } : c,
    ),
  };
  saveColleges(next, storage);
  return next;
}

export function removeCollege(id: string, storage: Storage = localStorage): CollegesState {
  const state = loadColleges(storage);
  const next = { colleges: state.colleges.filter((c) => c.id !== id) };
  saveColleges(next, storage);
  return next;
}

/** Unique essay.college strings not already in registry (case-insensitive). */
export function discoverCollegesFromEssays(storage: Storage = localStorage): string[] {
  const existing = new Set(listColleges(storage).map((c) => c.name.toLowerCase()));
  const found = new Map<string, string>();
  for (const essay of loadEssayTracker(storage).essays) {
    const trimmed = essay.college?.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (!existing.has(key) && !found.has(key)) found.set(key, trimmed);
  }
  return [...found.values()].sort((a, b) => a.localeCompare(b));
}

export function importCollegesFromEssays(storage: Storage = localStorage): CollegesState {
  for (const name of discoverCollegesFromEssays(storage)) {
    addCollege(name, undefined, undefined, storage);
  }
  return loadColleges(storage);
}

export function countEssaysForCollege(name: string, storage: Storage = localStorage): number {
  const trimmed = name.trim();
  return loadEssayTracker(storage).essays.filter((e) => e.college?.trim() === trimmed).length;
}

export function collegeDeadlineForPackage(
  collegeName: string,
  storage: Storage = localStorage,
): string | undefined {
  return findCollegeByName(collegeName, storage)?.deadline;
}

export interface CollegeDeadlineRow {
  id: string;
  title: string;
  collegeName: string;
  dueDate: string;
  daysUntil: number;
  overdue: boolean;
}

/** Registry schools with deadlines within window (for week plan / Today). */
export function listCollegeRegistryDeadlines(
  withinDays = 7,
  now = new Date(),
  storage: Storage = localStorage,
): CollegeDeadlineRow[] {
  const rows: CollegeDeadlineRow[] = [];
  for (const college of listColleges(storage)) {
    if (!college.deadline) continue;
    const daysUntil = daysUntilDue(college.deadline, now);
    if (daysUntil === null || daysUntil > withinDays) continue;
    rows.push({
      id: `college-${college.id}`,
      title: formatCollegeDisplayName(college.name, college.notes),
      collegeName: college.name,
      dueDate: college.deadline,
      daysUntil,
      overdue: daysUntil < 0,
    });
  }
  return rows.sort((a, b) => a.daysUntil - b.daysUntil);
}
