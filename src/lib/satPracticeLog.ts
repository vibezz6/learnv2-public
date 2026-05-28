import { recordStudyActivity } from "@/lib/studyActivity";
import { readJsonArray, writeJson } from "@/lib/storageJson";

export const SAT_PRACTICE_LOG_KEY = "learnv2_sat_practice_v1";

export type SatPracticeSource = "bluebook" | "khan";
export type SatPracticeSection = "math" | "rw" | "full";

export interface SatPracticeSession {
  id: string;
  date: string;
  section: SatPracticeSection;
  source: SatPracticeSource;
  label: string;
  note?: string;
  missesLogged: boolean;
  createdAt: number;
}

export interface AddPracticeSessionInput {
  section: SatPracticeSection;
  source: SatPracticeSource;
  label?: string;
  note?: string;
  missesLogged?: boolean;
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

function loadRaw(storage: Storage = localStorage): SatPracticeSession[] {
  return readJsonArray(storage, SAT_PRACTICE_LOG_KEY, isValidSession);
}

function saveRaw(sessions: SatPracticeSession[], storage: Storage = localStorage): void {
  writeJson(storage, SAT_PRACTICE_LOG_KEY, sessions);
}

function isValidSession(value: unknown): value is SatPracticeSession {
  if (!value || typeof value !== "object") return false;
  const session = value as Partial<SatPracticeSession>;
  return (
    typeof session.id === "string" &&
    typeof session.date === "string" &&
    (session.section === "math" || session.section === "rw" || session.section === "full") &&
    (session.source === "bluebook" || session.source === "khan") &&
    typeof session.label === "string" &&
    typeof session.missesLogged === "boolean" &&
    typeof session.createdAt === "number" &&
    (session.note === undefined || typeof session.note === "string")
  );
}

const SECTION_LABELS: Record<SatPracticeSection, string> = {
  math: "Math",
  rw: "Reading & Writing",
  full: "Full practice test",
};

const SOURCE_LABELS: Record<SatPracticeSource, string> = {
  bluebook: "Bluebook",
  khan: "Khan Academy",
};

export function defaultPracticeLabel(
  section: SatPracticeSection,
  source: SatPracticeSource,
): string {
  return `${SOURCE_LABELS[source]} — ${SECTION_LABELS[section]}`;
}

export function addPracticeSession(
  input: AddPracticeSessionInput,
  storage: Storage = localStorage,
): SatPracticeSession | null {
  const label = (input.label?.trim() || defaultPracticeLabel(input.section, input.source)).trim();
  if (!label) return null;

  const session: SatPracticeSession = {
    id: generateId(),
    date: input.date?.trim() || todayDateString(),
    section: input.section,
    source: input.source,
    label,
    missesLogged: !!input.missesLogged,
    createdAt: Date.now(),
  };

  if (input.note?.trim()) {
    session.note = input.note.trim();
  }

  const sessions = loadRaw(storage);
  sessions.unshift(session);
  saveRaw(sessions, storage);
  recordStudyActivity(
    {
      type: "sat_practice_logged",
      meta: { section: input.section, source: input.source, label },
    },
    storage,
  );
  return session;
}

export function listPracticeSessions(storage: Storage = localStorage): SatPracticeSession[] {
  return loadRaw(storage).sort((a, b) => b.createdAt - a.createdAt);
}

export function getLatestPracticeSession(
  storage: Storage = localStorage,
): SatPracticeSession | null {
  return listPracticeSessions(storage)[0] ?? null;
}
