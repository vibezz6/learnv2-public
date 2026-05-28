import { recordStudyActivity } from "@/lib/studyActivity";
import { readJsonArray, writeJson } from "@/lib/storageJson";

export const SAT_MISTAKE_LOG_KEY = "learnv2_sat_mistakes_v1";

export type SatMistakeSection = "math" | "rw";

export interface SatMistakeEntry {
  id: string;
  date: string;
  section: SatMistakeSection;
  category: string;
  nodeId?: string;
  note: string;
  createdAt: number;
}

export interface AddMistakeInput {
  section: SatMistakeSection;
  category: string;
  note: string;
  nodeId?: string;
  date?: string;
}

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function loadRaw(storage: Storage = localStorage): SatMistakeEntry[] {
  return readJsonArray(storage, SAT_MISTAKE_LOG_KEY, isValidEntry);
}

function saveRaw(entries: SatMistakeEntry[], storage: Storage = localStorage): void {
  writeJson(storage, SAT_MISTAKE_LOG_KEY, entries);
}

function isValidEntry(value: unknown): value is SatMistakeEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<SatMistakeEntry>;
  return (
    typeof entry.id === "string" &&
    typeof entry.date === "string" &&
    (entry.section === "math" || entry.section === "rw") &&
    typeof entry.category === "string" &&
    typeof entry.note === "string" &&
    typeof entry.createdAt === "number" &&
    (entry.nodeId === undefined || typeof entry.nodeId === "string")
  );
}

export function addMistake(
  input: AddMistakeInput,
  storage: Storage = localStorage,
): SatMistakeEntry | null {
  const category = input.category.trim();
  const note = input.note.trim();
  if (!category || !note) return null;

  const entry: SatMistakeEntry = {
    id: generateId(),
    date: input.date?.trim() || todayDateString(),
    section: input.section,
    category,
    note,
    createdAt: Date.now(),
  };

  if (input.nodeId?.trim()) {
    entry.nodeId = input.nodeId.trim();
  }

  const entries = loadRaw(storage);
  entries.unshift(entry);
  saveRaw(entries, storage);
  recordStudyActivity(
    {
      type: "sat_mistake_logged",
      nodeId: entry.nodeId,
      meta: { category, section: input.section },
    },
    storage,
  );
  return entry;
}

export function listMistakes(storage: Storage = localStorage): SatMistakeEntry[] {
  return loadRaw(storage).sort((a, b) => b.createdAt - a.createdAt);
}

export function deleteMistake(id: string, storage: Storage = localStorage): boolean {
  const entries = loadRaw(storage);
  const next = entries.filter((entry) => entry.id !== id);
  if (next.length === entries.length) return false;
  saveRaw(next, storage);
  return true;
}

export function groupByCategory(
  entries: SatMistakeEntry[] = listMistakes(),
): Record<string, SatMistakeEntry[]> {
  const grouped = new Map<string, SatMistakeEntry[]>();
  for (const entry of entries) {
    const key = entry.category;
    const bucket = grouped.get(key);
    if (bucket) bucket.push(entry);
    else grouped.set(key, [entry]);
  }

  const sorted = [...grouped.entries()].sort(
    ([, aEntries], [, bEntries]) =>
      Math.max(...bEntries.map((entry) => entry.createdAt))
      - Math.max(...aEntries.map((entry) => entry.createdAt)),
  );

  const result: Record<string, SatMistakeEntry[]> = {};
  for (const [key, bucket] of sorted) {
    result[key] = bucket.sort((a, b) => b.createdAt - a.createdAt);
  }
  return result;
}
