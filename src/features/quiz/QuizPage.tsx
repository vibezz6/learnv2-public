import { useCallback, useState } from "react";
import { CheckCircle2, ChevronRight, XCircle } from "lucide-react";
import type { QuizQuestion } from "@/curriculum/types";
import { Button, Card } from "@/components/ui";
import { useProgress } from "@/stores/progress";

interface QuizProps {
  questions: QuizQuestion[];
  nodeId: string;
  onComplete: (score: number, total: number) => void;
}

export function Quiz({ questions, nodeId, onComplete }: QuizProps) {
  const saveQuizAttempt = useProgress((s) => s.saveQuizAttempt);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>(() => Array(questions.length).fill(null));
  const [showResults, setShowResults] = useState(false);
  const [startTime] = useState(Date.now());

  const q = questions[current];
  const score = answers.filter((a, i) => a === questions[i]?.correctIndex).length;

  const handleSelect = useCallback(
    (idx: number) => {
      if (answered || !q) return;
      setSelected(idx);
      setAnswered(true);
      const next = [...answers];
      next[current] = idx;
      setAnswers(next);
    },
    [answered, answers, current, q],
  );

  const handleNext = useCallback(() => {
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
      setSelected(null);
      setAnswered(false);
    } else {
      setShowResults(true);
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
  }, [current, nodeId, onComplete, questions.length, saveQuizAttempt, score, startTime]);

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
        <Button onClick={() => window.history.back()}>Back to lesson</Button>
      </Card>
    );
  }

  const isCorrect = selected === q.correctIndex;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="font-mono text-xs text-[var(--text-muted)]">
        Q{current + 1} / {questions.length}
      </div>
      <Card className="stagger-item">
        <h2 className="text-lg font-semibold text-[var(--text-heading)]">{q.question}</h2>
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
              className="flex w-full items-center gap-3 rounded-[var(--radius)] border px-4 py-3 text-left text-sm transition hover:border-[var(--accent)] disabled:cursor-default"
              style={{ borderColor: border, background: "var(--bg-elevated)" }}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border font-mono text-xs" style={{ borderColor: border }}>
                {i + 1}
              </span>
              {opt}
            </button>
          );
        })}
      </div>
      {answered && (
        <Card className="stagger-item" style={{ borderColor: isCorrect ? "var(--success)" : "var(--danger)" }}>
          <div className="mb-2 flex items-center gap-2 font-semibold" style={{ color: isCorrect ? "var(--success)" : "var(--danger)" }}>
            {isCorrect ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
            {isCorrect ? "Correct" : "Incorrect"}
          </div>
          <p className="text-sm text-[var(--text-muted)]">{q.explanation}</p>
        </Card>
      )}
      {answered && (
        <Button onClick={handleNext} className="w-full sm:w-auto">
          {current < questions.length - 1 ? "Next" : "View results"}
          <ChevronRight size={16} />
        </Button>
      )}
    </div>
  );
}
