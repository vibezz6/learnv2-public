export interface SavedQuizProgress {
  current: number;
  answers: (number | null)[];
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
  const timestamp = parsed.timestamp;

  if (
    typeof current !== "number" ||
    !Array.isArray(answers) ||
    typeof timestamp !== "number" ||
    answers.length !== questionCount ||
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
  try {
    const payload: SavedQuizProgress = {
      current: progress.current,
      answers: progress.answers,
      timestamp: Date.now(),
      startTime: progress.startTime,
    };
    localStorage.setItem(quizProgressKey(nodeId), JSON.stringify(payload));
  } catch {
    // Storage full or unavailable — fail silently
  }
}

export function clearQuizProgress(nodeId: string): void {
  try {
    localStorage.removeItem(quizProgressKey(nodeId));
  } catch {
    // ignore
  }
}

export function restoreQuizSession(nodeId: string, questionCount: number) {
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
