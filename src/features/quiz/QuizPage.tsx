import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, ChevronRight, FileText, XCircle } from "lucide-react";
import type { QuizQuestion } from "@/curriculum/types";
import { Button, Card } from "@/components/ui";
import { cn } from "@/lib/cn";
import { useProgress } from "@/stores/progress";
import { clearQuizProgress, restoreQuizSession, saveQuizProgress } from "@/features/quiz/quizProgress";

interface QuizProps {
  questions: QuizQuestion[];
  nodeId: string;
  subjectId?: string;
  contextLine?: string;
  onComplete: (score: number, total: number) => void;
}

function introDismissKey(nodeId: string): string {
  return `learnv2_quiz_intro_dismissed_${nodeId}`;
}

export function Quiz({ questions, nodeId, subjectId, contextLine, onComplete }: QuizProps) {
  const saveQuizAttempt = useProgress((s) => s.saveQuizAttempt);
  const [initial] = useState(() => restoreQuizSession(nodeId, questions.length));
  const [current, setCurrent] = useState(initial.current);
  const [selected, setSelected] = useState<number | null>(initial.selected);
  const [answered, setAnswered] = useState(initial.answered);
  const [answers, setAnswers] = useState<(number | null)[]>(initial.answers);
  const [showResults, setShowResults] = useState(false);
  const [showIntro, setShowIntro] = useState(() => {
    try {
      return contextLine ? localStorage.getItem(introDismissKey(nodeId)) !== "1" : false;
    } catch {
      return !!contextLine;
    }
  });
  const [startTime] = useState(initial.startTime);
  const [focusedOption, setFocusedOption] = useState(0);
  const groupRef = useRef<HTMLDivElement>(null);
  const questionId = useId();
  const feedbackId = useId();

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
      setFocusedOption(idx);
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
      setFocusedOption(0);
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

  useEffect(() => {
    setFocusedOption(0);
  }, [current]);

  useEffect(() => {
    if (answered || !q) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "TEXTAREA" || target.tagName === "INPUT") return;

      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        setFocusedOption((i) => Math.min(i + 1, q.options.length - 1));
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        setFocusedOption((i) => Math.max(i - 1, 0));
      } else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        handleSelect(focusedOption);
      }
    };
    const el = groupRef.current;
    el?.addEventListener("keydown", onKeyDown);
    return () => el?.removeEventListener("keydown", onKeyDown);
  }, [answered, focusedOption, handleSelect, q]);

  if (!questions.length) {
    return (
      <Card>
        <p className="text-[var(--text-muted)]">No quiz questions for this lesson yet.</p>
      </Card>
    );
  }

  if (showResults) {
    const pct = Math.round((score / questions.length) * 100);
    const lessonPath =
      subjectId ? `/subjects/${subjectId}/${nodeId}` : undefined;
    return (
      <Card glow className="stagger-item space-y-4">
        <h2 className="text-xl font-bold text-[var(--text-heading)]">Quiz complete</h2>
        <p className="font-mono text-3xl text-[var(--accent)]">
          {score}/{questions.length} · {pct}%
        </p>
        <p className="text-sm text-[var(--text-muted)]">
          {pct >= 80
            ? "Strong recall — office hours can lock this in."
            : "Review the lesson, then try notes for gaps."}
        </p>
        <div className="flex flex-wrap gap-2">
          {lessonPath && (
            <>
              <Link to={`${lessonPath}/notes`}>
                <Button variant="secondary" className="min-h-11 gap-2">
                  <FileText size={14} />
                  Office hours
                </Button>
              </Link>
              <Link to="/review">
                <Button variant="secondary" className="min-h-11">
                  Spaced review
                </Button>
              </Link>
            </>
          )}
          <Button onClick={() => window.history.back()} className="min-h-11 w-full sm:w-auto">
            Back to lesson
          </Button>
        </div>
      </Card>
    );
  }

  if (showIntro && contextLine) {
    return (
      <Card className="stagger-item space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
          Why this quiz matters
        </p>
        <p className="text-sm leading-relaxed text-[var(--text)]">{contextLine}</p>
        <Button
          className="min-h-11 w-full sm:w-auto"
          onClick={() => {
            try {
              localStorage.setItem(introDismissKey(nodeId), "1");
            } catch {
              // ignore
            }
            setShowIntro(false);
          }}
        >
          Start quiz
          <ChevronRight size={14} />
        </Button>
      </Card>
    );
  }

  const isCorrect = selected === q.correctIndex;

  return (
    <div
      className={cn(
        "mx-auto w-full min-w-0 max-w-2xl space-y-4 overflow-x-hidden",
        answered && "pb-[calc(6rem+env(safe-area-inset-bottom,0px))] sm:pb-0",
      )}
    >
      <div className="font-mono text-xs text-[var(--text-muted)]" aria-live="polite">
        Q{current + 1} / {questions.length}
      </div>
      <Card className="stagger-item min-w-0">
        <h2 id={questionId} className="break-words text-lg font-semibold text-[var(--text-heading)]">
          {q.question}
        </h2>
      </Card>
      <div
        ref={groupRef}
        role="radiogroup"
        aria-labelledby={questionId}
        className="space-y-2"
      >
        {q.options.map((opt, i) => {
          let border = "var(--border)";
          if (answered) {
            if (i === q.correctIndex) border = "var(--success)";
            else if (i === selected) border = "var(--danger)";
          } else if (selected === i) border = "var(--accent)";
          const isFocused = !answered && focusedOption === i;
          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={selected === i}
              tabIndex={isFocused ? 0 : -1}
              disabled={answered}
              onClick={() => handleSelect(i)}
              onFocus={() => setFocusedOption(i)}
              className="flex min-h-11 w-full min-w-0 touch-manipulation items-center gap-3 rounded-[var(--radius)] border px-4 py-3 text-left text-sm transition hover:border-[var(--accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:cursor-default"
              style={{
                borderColor: border,
                background: "var(--bg-elevated)",
                boxShadow: isFocused && !answered ? "0 0 0 1px var(--accent)" : undefined,
              }}
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
          aria-live="assertive"
          id={feedbackId}
          role="status"
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
          <div className="fixed inset-x-0 bottom-[var(--mobile-nav-height)] z-10 border-t border-[var(--border)] bg-[var(--bg-glass)] px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] backdrop-blur-xl sm:hidden">
            <div className="flex gap-2">
              <Button onClick={handleNext} className="min-h-11 flex-1">
                {current < questions.length - 1 ? "Next" : "View results"}
                <ChevronRight size={16} />
              </Button>
            </div>
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
