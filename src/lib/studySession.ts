import { recordStudyActivity } from "@/lib/studyActivity";
import type { StudyBlockPlan } from "@/lib/studyBlockPlan";
import { readJson, writeJson } from "@/lib/storageJson";

export const STUDY_SESSION_STORAGE_KEY = "learnv2_study_session_v1";

export interface StudySessionStep {
  id: string;
  title: string;
  minutes: number;
  href: string;
  completedAt?: number;
}

export interface StudySessionState {
  id: string;
  title: string;
  startedAt: number;
  completedAt?: number;
  activeStepId: string;
  steps: StudySessionStep[];
}

function isState(value: unknown): value is StudySessionState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<StudySessionState>;
  return (
    typeof state.id === "string" &&
    typeof state.title === "string" &&
    typeof state.startedAt === "number" &&
    typeof state.activeStepId === "string" &&
    Array.isArray(state.steps)
  );
}

function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `study-session-${Date.now()}`;
}

export function loadStudySession(storage: Storage = localStorage): StudySessionState | null {
  return readJson<StudySessionState | null>(
    storage,
    STUDY_SESSION_STORAGE_KEY,
    null,
    (value): value is StudySessionState | null => value === null || isState(value),
  );
}

export function startStudySession(
  plan: StudyBlockPlan,
  storage: Storage = localStorage,
): StudySessionState {
  const steps = plan.steps.map((step) => ({
    id: step.id,
    title: step.title,
    minutes: step.minutes,
    href: step.href,
  }));
  const session: StudySessionState = {
    id: newId(),
    title: plan.title,
    startedAt: Date.now(),
    activeStepId: steps[0]?.id ?? "reflection",
    steps,
  };
  writeJson(storage, STUDY_SESSION_STORAGE_KEY, session);
  return session;
}

export function completeStudySessionStep(
  stepId: string,
  storage: Storage = localStorage,
): StudySessionState | null {
  const session = loadStudySession(storage);
  if (!session || session.completedAt) return session;
  const now = Date.now();
  const steps = session.steps.map((step) =>
    step.id === stepId ? { ...step, completedAt: step.completedAt ?? now } : step,
  );
  const nextOpen = steps.find((step) => !step.completedAt);
  const completed = !nextOpen;
  const next = {
    ...session,
    steps,
    activeStepId: nextOpen?.id ?? stepId,
    completedAt: completed ? now : undefined,
  };
  writeJson(storage, STUDY_SESSION_STORAGE_KEY, next);
  if (completed) {
    const minutes = steps.reduce((sum, step) => sum + step.minutes, 0);
    recordStudyActivity({ type: "timer_minutes", meta: { minutes, label: session.title } }, storage);
  }
  return next;
}

export function clearStudySession(storage: Storage = localStorage): void {
  storage.removeItem(STUDY_SESSION_STORAGE_KEY);
}
