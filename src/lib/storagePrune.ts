import { SAT_PRETEST_STORAGE_KEY } from "@/lib/satPretest";

const QUIZ_PREFIX = "learnapp_quiz_progress_v1_";
const STALE_PRETEST_MS = 7 * 86_400_000;

export interface StoragePruneReport {
  orphanQuizKeysRemoved: number;
  stalePretestAttemptsRemoved: number;
}

export function runStoragePrune(storage: Storage = localStorage): StoragePruneReport {
  const report: StoragePruneReport = {
    orphanQuizKeysRemoved: 0,
    stalePretestAttemptsRemoved: 0,
  };

  const keysToRemove: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (!key?.startsWith(QUIZ_PREFIX)) continue;
    const nodeId = key.slice(QUIZ_PREFIX.length);
    if (!nodeId.trim()) keysToRemove.push(key);
  }
  for (const key of keysToRemove) {
    storage.removeItem(key);
    report.orphanQuizKeysRemoved++;
  }

  try {
    const raw = storage.getItem(SAT_PRETEST_STORAGE_KEY);
    if (!raw) return report;
    const state = JSON.parse(raw) as {
      schemaVersion?: number;
      attempts?: Array<{ status?: string; startedAt?: string }>;
    };
    if (!state.attempts?.length) return report;
    const now = Date.now();
    const next = state.attempts.filter((attempt) => {
      if (attempt.status !== "in_progress") return true;
      const started = attempt.startedAt ? Date.parse(attempt.startedAt) : NaN;
      if (Number.isNaN(started)) return true;
      if (now - started < STALE_PRETEST_MS) return true;
      report.stalePretestAttemptsRemoved++;
      return false;
    });
    if (report.stalePretestAttemptsRemoved > 0) {
      storage.setItem(
        SAT_PRETEST_STORAGE_KEY,
        JSON.stringify({ ...state, attempts: next }),
      );
    }
  } catch {
    // ignore corrupt pretest blob
  }

  return report;
}
