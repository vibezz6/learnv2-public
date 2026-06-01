export const SAT_LESSON_PLAN_STORAGE_KEY = "learnv2_sat_lesson_plan_v1";
export const SAT_LESSON_PLAN_SCHEMA_VERSION = 1;

export interface SatLessonPlanEntry {
  nodeId: string;
  reason: string;
  priority?: number;
}

export interface SatLessonPlanState {
  schemaVersion: number;
  importedAt: string;
  sourceAttemptId?: string;
  notes?: string;
  entries: SatLessonPlanEntry[];
}

function isValidEntry(value: unknown): value is SatLessonPlanEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<SatLessonPlanEntry>;
  return (
    typeof entry.nodeId === "string" &&
    entry.nodeId.trim().length > 0 &&
    typeof entry.reason === "string" &&
    entry.reason.trim().length > 0 &&
    (entry.priority === undefined || typeof entry.priority === "number")
  );
}

export function loadSatLessonPlan(storage: Storage = localStorage): SatLessonPlanState | null {
  try {
    const raw = storage.getItem(SAT_LESSON_PLAN_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SatLessonPlanState>;
    if (!parsed || !Array.isArray(parsed.entries)) return null;
    const entries = parsed.entries.filter(isValidEntry);
    if (entries.length === 0) return null;
    return {
      schemaVersion: SAT_LESSON_PLAN_SCHEMA_VERSION,
      importedAt: typeof parsed.importedAt === "string" ? parsed.importedAt : new Date().toISOString(),
      sourceAttemptId:
        typeof parsed.sourceAttemptId === "string" ? parsed.sourceAttemptId : undefined,
      notes: typeof parsed.notes === "string" ? parsed.notes : undefined,
      entries: entries.sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99)),
    };
  } catch {
    return null;
  }
}

export function saveSatLessonPlan(
  state: SatLessonPlanState,
  storage: Storage = localStorage,
): void {
  storage.setItem(SAT_LESSON_PLAN_STORAGE_KEY, JSON.stringify(state));
}

export function clearSatLessonPlan(storage: Storage = localStorage): void {
  storage.removeItem(SAT_LESSON_PLAN_STORAGE_KEY);
}

export function applySatLessonPlanImport(
  entries: SatLessonPlanEntry[],
  options: { sourceAttemptId?: string; notes?: string } = {},
  storage: Storage = localStorage,
): SatLessonPlanState {
  const state: SatLessonPlanState = {
    schemaVersion: SAT_LESSON_PLAN_SCHEMA_VERSION,
    importedAt: new Date().toISOString(),
    sourceAttemptId: options.sourceAttemptId,
    notes: options.notes?.trim() || undefined,
    entries: entries
      .map((entry) => ({
        nodeId: entry.nodeId.trim(),
        reason: entry.reason.trim(),
        priority: entry.priority,
      }))
      .sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99)),
  };
  saveSatLessonPlan(state, storage);
  return state;
}
