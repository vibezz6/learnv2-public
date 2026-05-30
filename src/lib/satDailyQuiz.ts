import type { QuizQuestion, Subject } from "@/curriculum/types";
import { getTopMistakeCategories } from "@/lib/satMistakeTriage";
import { bestNodeTier, type WeakTarget } from "@/lib/satSkillMatch";
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

function tokenize(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length >= 4),
  );
}

/**
 * Build today's 5-question SAT warm-up. Deterministic per day, but weighted
 * toward your weakest logged skills (exact node > same skill > same domain >
 * same section), with token overlap and a day-stable seed as tiebreaks for
 * variety. With no mistakes logged it degrades to a plain deterministic shuffle.
 */
export function getDailySatQuiz(
  subjects: Subject[],
  date: string = getToday(),
  size: number = SAT_DAILY_QUIZ_SIZE,
  storage: Storage = localStorage,
): DailySatQuiz {
  const sat = subjects.find((s) => s.id === "sat-prep");

  const tops = getTopMistakeCategories(3, storage);
  const targets: WeakTarget[] = tops.map((cat) => ({
    skillId: cat.skillId ?? null,
    section: cat.latestSection,
    nodeId: cat.nodeId,
  }));
  const weakTokens = new Set<string>();
  for (const cat of tops) {
    for (const token of tokenize(cat.category)) weakTokens.add(token);
  }

  interface Candidate {
    q: QuizQuestion;
    tier: number;
    tokenScore: number;
    tiebreak: number;
  }
  const candidates: Candidate[] = [];
  const seen = new Set<string>();
  if (sat) {
    for (const node of sat.nodes) {
      if (!node.quiz) continue;
      const tier = targets.length ? bestNodeTier(node.id, targets) : 0;
      const nodeTokens = tokenize(
        [node.name, node.description, ...(node.keyConcepts ?? [])].join(" "),
      );
      for (const q of node.quiz) {
        if ((q.type ?? "multiple-choice") !== "multiple-choice" || q.options.length < 2) continue;
        if (seen.has(q.id)) continue;
        seen.add(q.id);
        let tokenScore = 0;
        if (weakTokens.size) {
          const text = new Set([...nodeTokens, ...tokenize(q.question)]);
          for (const token of text) if (weakTokens.has(token)) tokenScore++;
        }
        candidates.push({
          q,
          tier,
          tokenScore,
          tiebreak: mulberry32(hashString(`${date}:${q.id}`))(),
        });
      }
    }
  }

  candidates.sort(
    (a, b) => b.tier - a.tier || b.tokenScore - a.tokenScore || a.tiebreak - b.tiebreak,
  );
  const questions = candidates.slice(0, Math.min(size, candidates.length)).map((c) => c.q);
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
