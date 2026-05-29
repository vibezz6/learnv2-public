import type { QuizQuestion, Subject } from "@/curriculum/types";
import { getToday } from "@/stores/progress";

export const SAT_DAILY_QUIZ_SIZE = 5;
const DONE_KEY = "learnv2_sat_daily_quiz_v1";

export interface DailySatQuiz {
  id: string;
  date: string;
  questions: QuizQuestion[];
}

export interface DailySatQuizResult {
  date: string;
  score: number;
  total: number;
}

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic PRNG so a given day always produces the same quiz. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(items: T[], seed: number): T[] {
  const rand = mulberry32(seed);
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Build today's deterministic 5-question SAT warm-up from the SAT-prep quizzes. */
export function getDailySatQuiz(
  subjects: Subject[],
  date: string = getToday(),
  size: number = SAT_DAILY_QUIZ_SIZE,
): DailySatQuiz {
  const sat = subjects.find((s) => s.id === "sat-prep");
  const pool: QuizQuestion[] = [];
  if (sat) {
    for (const node of sat.nodes) {
      if (!node.quiz) continue;
      for (const q of node.quiz) {
        if ((q.type ?? "multiple-choice") === "multiple-choice" && q.options.length > 1) {
          pool.push(q);
        }
      }
    }
  }
  // De-dupe by question id (defensive — ids should be unique across the bank).
  const seen = new Set<string>();
  const unique = pool.filter((q) => {
    if (seen.has(q.id)) return false;
    seen.add(q.id);
    return true;
  });
  const questions = seededShuffle(unique, hashString(date)).slice(0, Math.min(size, unique.length));
  return { id: `sat-daily-${date}`, date, questions };
}

export function getDailySatQuizResult(
  date: string = getToday(),
  storage: Storage = localStorage,
): DailySatQuizResult | null {
  try {
    const raw = storage.getItem(DONE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DailySatQuizResult;
    return parsed.date === date ? parsed : null;
  } catch {
    return null;
  }
}

export function isDailySatQuizDone(
  date: string = getToday(),
  storage: Storage = localStorage,
): boolean {
  return getDailySatQuizResult(date, storage) !== null;
}

export function markDailySatQuizDone(
  result: DailySatQuizResult,
  storage: Storage = localStorage,
): void {
  try {
    storage.setItem(DONE_KEY, JSON.stringify(result));
  } catch {
    /* quota */
  }
}
