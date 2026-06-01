export interface SavedQuizProgress {
  current: number;
  answers: (number | null)[];
  questionCount: number;
  timestamp: number;
  startTime?: number;
}

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

export function quizProgressKey(nodeId: string): string {
  return `learnapp_quiz_progress_v1_${nodeId}`;
}

function parseSavedProgress(raw: string, questionCount: number): SavedQuizProgress | null {
  const parsed = JSON.parse(raw) as Partial<SavedQuizProgress> & { currentIndex?: number };
  const current = parsed.current ?? parsed.currentIndex;
  const answers = parsed.answers;
  const savedQuestionCount = parsed.questionCount;
  const timestamp = parsed.timestamp;

  if (
    typeof current !== "number" ||
    !Array.isArray(answers) ||
    typeof savedQuestionCount !== "number" ||
    typeof timestamp !== "number" ||
    savedQuestionCount !== questionCount ||
    answers.length !== savedQuestionCount ||
    current < 0 ||
    current >= questionCount
  ) {
    return null;
  }

  if (Date.now() - timestamp >= TWENTY_FOUR_HOURS) {
    return null;
  }

  return {
    current,
    answers,
    questionCount: savedQuestionCount,
    timestamp,
    startTime: typeof parsed.startTime === "number" ? parsed.startTime : timestamp,
  };
}

export function loadQuizProgress(nodeId: string, questionCount: number): SavedQuizProgress | null {
  if (!questionCount) return null;

  try {
    const raw = localStorage.getItem(quizProgressKey(nodeId));
    if (!raw) return null;
    return parseSavedProgress(raw, questionCount);
  } catch {
    return null;
  }
}

export function saveQuizProgress(
  nodeId: string,
  progress: Pick<SavedQuizProgress, "current" | "answers" | "startTime">,
): void {
  const questionCount = progress.answers.length;
  if (!questionCount || progress.current < 0 || progress.current >= questionCount) return;

  try {
    const payload: SavedQuizProgress = {
      current: progress.current,
      answers: progress.answers,
      questionCount,
      timestamp: Date.now(),
      startTime: progress.startTime,
    };
    localStorage.setItem(quizProgressKey(nodeId), JSON.stringify(payload));
  } catch {
    // Storage full or unavailable — fail silently
  }
}

const QUIZ_PROGRESS_PREFIX = "learnapp_quiz_progress_v1_";

export function findLatestInProgressQuizNodeId(storage: Storage = localStorage): string | null {
  let latest: { nodeId: string; timestamp: number } | null = null;

  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (!key?.startsWith(QUIZ_PROGRESS_PREFIX)) continue;
    const nodeId = key.slice(QUIZ_PROGRESS_PREFIX.length);
    try {
      const raw = storage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as { timestamp?: number };
      if (typeof parsed.timestamp !== "number") continue;
      if (Date.now() - parsed.timestamp >= TWENTY_FOUR_HOURS) continue;
      if (!latest || parsed.timestamp > latest.timestamp) {
        latest = { nodeId, timestamp: parsed.timestamp };
      }
    } catch {
      // ignore corrupt entry
    }
  }

  return latest?.nodeId ?? null;
}

export function clearQuizProgress(nodeId: string): void {
  try {
    localStorage.removeItem(quizProgressKey(nodeId));
  } catch {
    // ignore
  }
}

export function restoreQuizSession(nodeId: string, questionCount: number) {
  if (!questionCount) {
    return {
      current: -1,
      selected: null as number | null,
      answered: false,
      answers: [] as (number | null)[],
      startTime: Date.now(),
    };
  }

  const saved = loadQuizProgress(nodeId, questionCount);
  if (!saved) {
    return {
      current: 0,
      selected: null as number | null,
      answered: false,
      answers: Array<number | null>(questionCount).fill(null),
      startTime: Date.now(),
    };
  }

  const answerAtCurrent = saved.answers[saved.current] ?? null;
  return {
    current: saved.current,
    selected: answerAtCurrent,
    answered: answerAtCurrent !== null,
    answers: saved.answers,
    startTime: saved.startTime ?? saved.timestamp,
  };
}
