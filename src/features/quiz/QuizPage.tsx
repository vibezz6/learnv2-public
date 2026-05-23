import { useCallback, useState } from "react";
import { CheckCircle2, ChevronRight, XCircle } from "lucide-react";
import type { QuizQuestion } from "@/curriculum/types";
import { Button, Card } from "@/components/ui";
import { cn } from "@/lib/cn";
import { useProgress } from "@/stores/progress";
import { clearQuizProgress, restoreQuizSession, saveQuizProgress } from "@/features/quiz/quizProgress";

interface QuizProps {
  questions: QuizQuestion[];
  nodeId: string;
  onComplete: (score: number, total: number) => void;
}

export function Quiz({ questions, nodeId, onComplete }: QuizProps) {
  const saveQuizAttempt = useProgress((s) => s.saveQuizAttempt);
  const [initial] = useState(() => restoreQuizSession(nodeId, questions.length));
  const [current, setCurrent] = useState(initial.current);
  const [selected, setSelected] = useState<number | null>(initial.selected);
  const [answered, setAnswered] = useState(initial.answered);
  const [answers, setAnswers] = useState<(number | null)[]>(initial.answers);
  const [showResults, setShowResults] = useState(false);
  const [startTime] = useState(initial.startTime);

  const q = questions[current];
  const score = answers.filter((a, i) => a === questions[i]?.correctIndex).length;

  const persistProgress = useCallback(
    (nextCurrent: number, nextAnswers: (number | null)[]) => {
      saveQuizProgress(nodeId, {
        current: nextCurrent,
        answers: nextAnswers,
        startTime,
      });
    },
    [nodeId, startTime],
  );

  const handleSelect = useCallback(
    (idx: number) => {
      if (answered || !q) return;
      setSelected(idx);
      setAnswered(true);
      const next = [...answers];
      next[current] = idx;
      setAnswers(next);
      persistProgress(current, next);
    },
    [answered, answers, current, persistProgress, q],
  );

  const handleNext = useCallback(() => {
    if (current < questions.length - 1) {
      const nextCurrent = current + 1;
      setCurrent(nextCurrent);
      setSelected(null);
      setAnswered(false);
      persistProgress(nextCurrent, answers);
    } else {
      setShowResults(true);
      clearQuizProgress(nodeId);
      const pct = questions.length ? Math.round((score / questions.length) * 100) : 0;
      saveQuizAttempt(nodeId, {
        score: pct,
        totalQuestions: questions.length,
        correctAnswers: score,
        date: new Date().toISOString(),
        timeTakenSeconds: Math.round((Date.now() - startTime) / 1000),
      });
      onComplete(score, questions.length);
    }
  }, [
    answers,
    current,
    nodeId,
    onComplete,
    persistProgress,
    questions.length,
    saveQuizAttempt,
    score,
    startTime,
  ]);

  if (!questions.length) {
    return (
      <Card>
        <p className="text-[var(--text-muted)]">No quiz questions for this lesson yet.</p>
      </Card>
    );
  }

  if (showResults) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <Card glow className="stagger-item space-y-4">
        <h2 className="text-xl font-bold text-[var(--text-heading)]">Quiz complete</h2>
        <p className="font-mono text-3xl text-[var(--accent)]">
          {score}/{questions.length} · {pct}%
        </p>
        <Button onClick={() => window.history.back()} className="min-h-11 w-full sm:w-auto">
          Back to lesson
        </Button>
      </Card>
    );
  }

  const isCorrect = selected === q.correctIndex;

  return (
    <div
      className={cn(
        "mx-auto w-full min-w-0 max-w-2xl space-y-4 overflow-x-hidden",
        answered && "pb-24 sm:pb-0",
      )}
    >
      <div className="font-mono text-xs text-[var(--text-muted)]">
        Q{current + 1} / {questions.length}
      </div>
      <Card className="stagger-item min-w-0">
        <h2 className="break-words text-lg font-semibold text-[var(--text-heading)]">{q.question}</h2>
      </Card>
      <div className="space-y-2">
        {q.options.map((opt, i) => {
          let border = "var(--border)";
          if (answered) {
            if (i === q.correctIndex) border = "var(--success)";
            else if (i === selected) border = "var(--danger)";
          } else if (selected === i) border = "var(--accent)";
          return (
            <button
              key={i}
              type="button"
              disabled={answered}
              onClick={() => handleSelect(i)}
              className="flex min-h-11 w-full min-w-0 touch-manipulation items-center gap-3 rounded-[var(--radius)] border px-4 py-3 text-left text-sm transition hover:border-[var(--accent)] disabled:cursor-default"
              style={{ borderColor: border, background: "var(--bg-elevated)" }}
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border font-mono text-xs"
                style={{ borderColor: border }}
              >
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 break-words">{opt}</span>
            </button>
          );
        })}
      </div>
      {answered && (
        <Card
          className="stagger-item min-w-0"
          style={{ borderColor: isCorrect ? "var(--success)" : "var(--danger)" }}
        >
          <div
            className="mb-2 flex items-center gap-2 font-semibold"
            style={{ color: isCorrect ? "var(--success)" : "var(--danger)" }}
          >
            {isCorrect ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
            {isCorrect ? "Correct" : "Incorrect"}
          </div>
          <p className="break-words text-sm text-[var(--text-muted)]">{q.explanation}</p>
        </Card>
      )}
      {answered && (
        <>
          <div className="fixed inset-x-0 bottom-[var(--mobile-nav-height)] z-10 border-t border-[var(--border)] bg-[var(--bg-glass)] p-4 backdrop-blur-xl sm:hidden">
            <Button onClick={handleNext} className="min-h-11 w-full">
              {current < questions.length - 1 ? "Next" : "View results"}
              <ChevronRight size={16} />
            </Button>
          </div>
          <Button onClick={handleNext} className="hidden min-h-11 w-auto sm:inline-flex">
            {current < questions.length - 1 ? "Next" : "View results"}
            <ChevronRight size={16} />
          </Button>
        </>
      )}
    </div>
  );
}
