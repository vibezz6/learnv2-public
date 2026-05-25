import { notifyDataUpdated } from "@/lib/dataSync";
import { getToday } from "@/stores/progress";

export const STUDY_ACTIVITY_STORAGE_KEY = "learnv2_activity_v1";
export const ACTIVITY_UPDATED_EVENT = "learnv2-activity-updated";

const MAX_EVENTS = 500;
const RETENTION_DAYS = 90;

export type StudyActivityType =
  | "lesson_started"
  | "lesson_completed"
  | "quiz_completed"
  | "notes_updated"
  | "notes_review_done"
  | "mentor_completed"
  | "review_done"
  | "timer_minutes"
  | "sat_mistake_logged"
  | "sat_practice_logged"
  | "sat_pretest_completed"
  | "daily_challenge_done";

export interface StudyActivityEvent {
  id: string;
  type: StudyActivityType;
  at: number;
  date: string;
  nodeId?: string;
  subjectId?: string;
  meta?: Record<string, string | number>;
}

export interface RecordStudyActivityInput {
  type: StudyActivityType;
  at?: number;
  nodeId?: string;
  subjectId?: string;
  meta?: Record<string, string | number>;
}

function utcDateFromMs(at: number): string {
  const d = new Date(at);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function cutoffDateString(now = Date.now()): string {
  const d = new Date(now);
  d.setUTCDate(d.getUTCDate() - RETENTION_DAYS);
  return utcDateFromMs(d.getTime());
}

function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function isValidEvent(value: unknown): value is StudyActivityEvent {
  if (!value || typeof value !== "object") return false;
  const e = value as Partial<StudyActivityEvent>;
  return (
    typeof e.id === "string" &&
    typeof e.type === "string" &&
    typeof e.at === "number" &&
    typeof e.date === "string"
  );
}

export function loadStudyActivities(storage: Storage = localStorage): StudyActivityEvent[] {
  try {
    const raw = storage.getItem(STUDY_ACTIVITY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidEvent);
  } catch {
    return [];
  }
}

function saveStudyActivities(events: StudyActivityEvent[], storage: Storage = localStorage): void {
  try {
    storage.setItem(STUDY_ACTIVITY_STORAGE_KEY, JSON.stringify(events));
  } catch {
    // quota exceeded
  }
}

function pruneEvents(events: StudyActivityEvent[], now = Date.now()): StudyActivityEvent[] {
  const cutoff = cutoffDateString(now);
  const sorted = [...events]
    .filter((e) => e.date >= cutoff)
    .sort((a, b) => b.at - a.at);
  return sorted.slice(0, MAX_EVENTS);
}

export function notifyActivityUpdated(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(ACTIVITY_UPDATED_EVENT));
}

export function subscribeActivityUpdated(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const listener = () => handler();
  window.addEventListener(ACTIVITY_UPDATED_EVENT, listener);
  return () => window.removeEventListener(ACTIVITY_UPDATED_EVENT, listener);
}

export function recordStudyActivity(
  input: RecordStudyActivityInput,
  storage: Storage = localStorage,
): StudyActivityEvent {
  const at = input.at ?? Date.now();
  const event: StudyActivityEvent = {
    id: generateId(),
    type: input.type,
    at,
    date: utcDateFromMs(at),
    ...(input.nodeId ? { nodeId: input.nodeId } : {}),
    ...(input.subjectId ? { subjectId: input.subjectId } : {}),
    ...(input.meta && Object.keys(input.meta).length > 0 ? { meta: input.meta } : {}),
  };
  const next = pruneEvents([event, ...loadStudyActivities(storage)], at);
  saveStudyActivities(next, storage);
  notifyActivityUpdated();
  notifyDataUpdated();
  return event;
}

export function listActivities(
  limit = MAX_EVENTS,
  storage: Storage = localStorage,
): StudyActivityEvent[] {
  return loadStudyActivities(storage).slice(0, limit);
}

export function listActivitiesForDate(
  date: string = getToday(),
  storage: Storage = localStorage,
): StudyActivityEvent[] {
  return loadStudyActivities(storage).filter((e) => e.date === date);
}

export function getLastActivity(
  types?: StudyActivityType[],
  storage: Storage = localStorage,
): StudyActivityEvent | null {
  const events = loadStudyActivities(storage);
  for (const event of events) {
    if (!types || types.includes(event.type)) return event;
  }
  return null;
}

export function hasActivitySince(
  types: StudyActivityType[],
  sinceMs: number,
  storage: Storage = localStorage,
): boolean {
  return loadStudyActivities(storage).some((e) => types.includes(e.type) && e.at >= sinceMs);
}

export const STUDY_ACTIVITY_LABELS: Record<StudyActivityType, string> = {
  lesson_started: "Started lesson",
  lesson_completed: "Completed lesson",
  quiz_completed: "Finished quiz",
  notes_updated: "Office hours notes",
  notes_review_done: "Notes review",
  mentor_completed: "Mentor recall",
  review_done: "Spaced review",
  timer_minutes: "Timer session",
  sat_mistake_logged: "SAT mistake logged",
  sat_practice_logged: "Official practice logged",
  sat_pretest_completed: "Optional baseline finished",
  daily_challenge_done: "Daily challenge",
};

export function formatActivityLabel(
  event: StudyActivityEvent,
  nodeTitle?: string,
): string {
  const base = STUDY_ACTIVITY_LABELS[event.type] ?? event.type;
  if (nodeTitle) return `${base}: ${nodeTitle}`;
  if (event.meta?.title && typeof event.meta.title === "string") {
    return `${base}: ${event.meta.title}`;
  }
  return base;
}

export interface TodayStudySummary {
  date: string;
  eventCount: number;
  topTypes: Array<{ type: StudyActivityType; count: number }>;
  lastEvent: StudyActivityEvent | null;
  headline: string;
}

export interface WeekActivityMix {
  daysActive: number;
  totalEvents: number;
  byType: Partial<Record<StudyActivityType, number>>;
}

export function getTodayStudySummary(
  date: string = getToday(),
  storage: Storage = localStorage,
): TodayStudySummary {
  const events = listActivitiesForDate(date, storage);
  const counts = new Map<StudyActivityType, number>();
  for (const event of events) {
    counts.set(event.type, (counts.get(event.type) ?? 0) + 1);
  }
  const topTypes = [...counts.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
  const lastEvent = events[0] ?? null;

  let headline = "No study logged yet today.";
  if (events.length > 0 && lastEvent) {
    const primary = topTypes[0];
    if (primary) {
      headline = `${events.length} action${events.length === 1 ? "" : "s"} today — latest: ${STUDY_ACTIVITY_LABELS[primary.type].toLowerCase()}.`;
    }
  }

  return {
    date,
    eventCount: events.length,
    topTypes,
    lastEvent,
    headline,
  };
}

export function getWeekActivityMix(
  storage: Storage = localStorage,
  now = Date.now(),
): WeekActivityMix {
  const cutoff = now - 7 * 86_400_000;
  const byType: Partial<Record<StudyActivityType, number>> = {};
  const activeDates = new Set<string>();
  let totalEvents = 0;

  for (const event of loadStudyActivities(storage)) {
    if (event.at < cutoff) continue;
    totalEvents++;
    activeDates.add(event.date);
    byType[event.type] = (byType[event.type] ?? 0) + 1;
  }

  return {
    daysActive: activeDates.size,
    totalEvents,
    byType,
  };
}

export function exportStudyActivitiesJson(storage: Storage = localStorage): string {
  return JSON.stringify(
    { exportedAt: new Date().toISOString(), events: loadStudyActivities(storage) },
    null,
    2,
  );
}
