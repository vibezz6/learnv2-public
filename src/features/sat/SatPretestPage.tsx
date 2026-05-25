import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronLeft,
  Copy,
  Download,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { Button, Card } from "@/components/ui";
import {
  SAT_PRETEST_DRAFT_1_ID,
  satPretestDraft1Questions,
} from "@/data/satPretestDraft1";
import {
  advanceSatPretestAttempt,
  completeSatPretestAttempt,
  copySatPretestMarkdownToClipboard,
  downloadSatPretestJson,
  getActiveSatPretestAttempt,
  getLatestCompletedSatPretestAttempt,
  recordSatPretestResponse,
  resetSatPretestDraft,
  startSatPretestAttempt,
  type SatPretestAttempt,
  type SatPretestQuestion,
} from "@/lib/satPretest";
import { cn } from "@/lib/cn";
import { APP_VERSION } from "@/lib/version";

const SECTION_LABELS = {
  math: "Math",
  rw: "Reading & Writing",
} as const;

function formatSeconds(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  if (minutes === 0) return `${remainder}s`;
  return `${minutes}m ${remainder}s`;
}

function getCurrentQuestion(attempt: SatPretestAttempt): SatPretestQuestion | null {
  const questionId = attempt.questionOrder[attempt.currentIndex];
  return satPretestDraft1Questions.find((question) => question.id === questionId) ?? null;
}

export function SatPretestPage() {
  const [attempt, setAttempt] = useState<SatPretestAttempt | null>(() =>
    getActiveSatPretestAttempt(SAT_PRETEST_DRAFT_1_ID)
      ?? getLatestCompletedSatPretestAttempt(SAT_PRETEST_DRAFT_1_ID),
  );
  const [selectedChoiceId, setSelectedChoiceId] = useState("");
  const [rationale, setRationale] = useState("");
  const [error, setError] = useState("");
  const [submittedQuestionId, setSubmittedQuestionId] = useState<string | null>(null);
  const [questionStartedAt, setQuestionStartedAt] = useState(() => Date.now());

  const currentQuestion = attempt?.status === "in_progress" ? getCurrentQuestion(attempt) : null;
  const currentResponse = currentQuestion ? attempt?.responses[currentQuestion.id] : null;
  const completedAttempt = attempt?.status === "completed" ? attempt : null;

  const sectionCounts = useMemo(() => {
    const math = satPretestDraft1Questions.filter((question) => question.section === "math").length;
    return { math, rw: satPretestDraft1Questions.length - math };
  }, []);

  const startAttempt = useCallback(() => {
    const nextAttempt = startSatPretestAttempt(SAT_PRETEST_DRAFT_1_ID, satPretestDraft1Questions);
    setAttempt(nextAttempt);
    setSelectedChoiceId("");
    setRationale("");
    setSubmittedQuestionId(null);
    setQuestionStartedAt(Date.now());
    setError("");
  }, []);

  const restartDraft = useCallback(() => {
    resetSatPretestDraft(SAT_PRETEST_DRAFT_1_ID);
    setAttempt(null);
    setSelectedChoiceId("");
    setRationale("");
    setSubmittedQuestionId(null);
    setQuestionStartedAt(Date.now());
    setError("");
  }, []);

  const submitQuestion = useCallback(() => {
    if (!attempt || !currentQuestion) return;
    if (!selectedChoiceId) {
      setError("Choose an answer before submitting this diagnostic item.");
      return;
    }
    if (!rationale.trim()) {
      setError("Write your reasoning in your own words before seeing feedback.");
      return;
    }

    const updated = recordSatPretestResponse(
      {
        attemptId: attempt.id,
        questionId: currentQuestion.id,
        selectedChoiceId,
        rationale,
        timeSpentSeconds: Math.max(1, Math.round((Date.now() - questionStartedAt) / 1000)),
      },
      satPretestDraft1Questions,
    );

    if (!updated) {
      setError("Could not save this answer. Try again.");
      return;
    }

    setAttempt({ ...updated });
    setSubmittedQuestionId(currentQuestion.id);
    setError("");
  }, [attempt, currentQuestion, questionStartedAt, rationale, selectedChoiceId]);

  const goNext = useCallback(() => {
    if (!attempt || !currentQuestion) return;

    const isLast = attempt.currentIndex >= attempt.questionOrder.length - 1;
    if (isLast) {
      const completed = completeSatPretestAttempt(attempt.id, satPretestDraft1Questions);
      if (completed) setAttempt({ ...completed });
    } else {
      const updated = advanceSatPretestAttempt(attempt.id);
      if (updated) setAttempt({ ...updated });
    }

    setSelectedChoiceId("");
    setRationale("");
    setSubmittedQuestionId(null);
    setQuestionStartedAt(Date.now());
    setError("");
  }, [attempt, currentQuestion]);

  return (
    <div className="mx-auto w-full min-w-0 max-w-4xl space-y-6 overflow-x-hidden px-3 py-4 pb-24 sm:p-4 sm:pb-4 md:p-8">
      <Link
        to="/subjects/sat-prep"
        className="inline-flex min-h-11 items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
      >
        <ChevronLeft size={16} />
        Back to SAT Prep
      </Link>

      <header className="space-y-3">
        <p className="font-mono text-[11px] uppercase tracking-widest text-[var(--accent-2)]">
          SAT diagnostic
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--text-heading)]">
          Draft 1 pretest
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-[var(--text-muted)]">
          This is a local Learn v2 diagnostic, not an official score predictor. The goal is to
          capture your answer and your reasoning before feedback so Draft 2 can target real gaps.
        </p>
      </header>

      {!attempt ? (
        <StartCard
          mathCount={sectionCounts.math}
          rwCount={sectionCounts.rw}
          total={satPretestDraft1Questions.length}
          onStart={startAttempt}
        />
      ) : completedAttempt ? (
        <ResultsCard attempt={completedAttempt} onRestart={restartDraft} />
      ) : currentQuestion ? (
        <QuestionCard
          attempt={attempt}
          question={currentQuestion}
          selectedChoiceId={selectedChoiceId}
          rationale={rationale}
          submitted={submittedQuestionId === currentQuestion.id || !!currentResponse}
          error={error}
          onSelect={setSelectedChoiceId}
          onRationaleChange={setRationale}
          onSubmit={submitQuestion}
          onNext={goNext}
        />
      ) : (
        <Card>
          <p className="text-sm text-[var(--text-muted)]">No Draft 1 question is available.</p>
        </Card>
      )}
    </div>
  );
}

function StartCard({
  mathCount,
  rwCount,
  total,
  onStart,
}: {
  mathCount: number;
  rwCount: number;
  total: number;
  onStart: () => void;
}) {
  return (
    <Card variant="primary" className="space-y-5">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-[var(--text-heading)]">Start Draft 1</h2>
        <p className="text-sm leading-relaxed text-[var(--text-muted)]">
          You will answer {total} original diagnostic questions: {mathCount} Math and {rwCount}
          Reading & Writing. Each item requires an answer and a written rationale.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Feedback" value="After submit" />
        <Metric label="Storage" value="Local only" />
        <Metric label="Resume" value="After refresh" />
      </div>
      <Button onClick={onStart} className="min-h-11 w-full sm:w-auto">
        Start diagnostic
        <ArrowRight size={16} />
      </Button>
    </Card>
  );
}

function QuestionCard({
  attempt,
  question,
  selectedChoiceId,
  rationale,
  submitted,
  error,
  onSelect,
  onRationaleChange,
  onSubmit,
  onNext,
}: {
  attempt: SatPretestAttempt;
  question: SatPretestQuestion;
  selectedChoiceId: string;
  rationale: string;
  submitted: boolean;
  error: string;
  onSelect: (choiceId: string) => void;
  onRationaleChange: (value: string) => void;
  onSubmit: () => void;
  onNext: () => void;
}) {
  const savedResponse = attempt.responses[question.id];
  const answerChoiceId = savedResponse?.selectedChoiceId ?? selectedChoiceId;
  const selectedIsCorrect = answerChoiceId === question.correctChoiceId;
  const isLast = attempt.currentIndex >= attempt.questionOrder.length - 1;

  return (
    <div className={cn("space-y-4", submitted && "pb-[calc(6rem+env(safe-area-inset-bottom,0px))] sm:pb-0")}>
      <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs text-[var(--text-muted)]">
        <span>
          Q{attempt.currentIndex + 1} / {attempt.questionOrder.length}
        </span>
        <span>
          {SECTION_LABELS[question.section]} · {question.skill}
        </span>
      </div>

      <Card className="space-y-4">
        <div className="flex flex-wrap gap-2 text-[11px] font-medium uppercase tracking-widest text-[var(--text-muted)]">
          <span>{question.domain}</span>
          <span>·</span>
          <span>{question.difficulty}</span>
        </div>
        <h2 className="break-words text-xl font-semibold leading-relaxed text-[var(--text-heading)]">
          {question.prompt}
        </h2>
      </Card>

      <div className="space-y-2">
        {question.choices.map((choice) => {
          const selected = answerChoiceId === choice.id;
          const correct = choice.id === question.correctChoiceId;
          let border = "var(--border)";
          if (submitted) {
            if (correct) border = "var(--success)";
            else if (selected) border = "var(--danger)";
          } else if (selected) {
            border = "var(--accent)";
          }

          return (
            <button
              key={choice.id}
              type="button"
              disabled={submitted}
              onClick={() => onSelect(choice.id)}
              className="flex min-h-11 w-full min-w-0 touch-manipulation items-start gap-3 rounded-[var(--radius)] border px-4 py-3 text-left text-sm transition hover:border-[var(--accent)] disabled:cursor-default"
              style={{ borderColor: border, background: "var(--bg-elevated)" }}
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border font-mono text-xs uppercase"
                style={{ borderColor: border }}
              >
                {choice.id}
              </span>
              <span className="min-w-0 flex-1 break-words">{choice.text}</span>
            </button>
          );
        })}
      </div>

      <Card variant="quiet" className="space-y-3 p-4">
        <label className="block space-y-2 text-sm">
          <span className="font-medium text-[var(--text-heading)]">
            Explain why you think this is right
          </span>
          <textarea
            value={savedResponse?.rationale ?? rationale}
            onChange={(event) => onRationaleChange(event.target.value)}
            disabled={submitted}
            rows={4}
            placeholder="Use your own words. What rule, clue, or calculation made you choose this?"
            className="w-full resize-y rounded-[var(--radius)] border border-[var(--border-strong)] bg-[var(--bg-secondary)] px-3 py-2 text-[var(--text)] placeholder:text-[var(--text-muted)] disabled:opacity-75"
          />
        </label>
        {error ? <p className="text-sm text-[var(--warning)]">{error}</p> : null}
      </Card>

      {submitted ? (
        <>
          <Card
            className="space-y-2 p-4"
            style={{ borderColor: selectedIsCorrect ? "var(--success)" : "var(--danger)" }}
          >
            <div
              className="flex items-center gap-2 font-semibold"
              style={{ color: selectedIsCorrect ? "var(--success)" : "var(--danger)" }}
            >
              {selectedIsCorrect ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
              {selectedIsCorrect ? "Correct" : "Not quite"}
            </div>
            <p className="text-sm leading-relaxed text-[var(--text-muted)]">{question.explanation}</p>
          </Card>
          <div className="fixed inset-x-0 bottom-[var(--mobile-nav-height)] z-10 border-t border-[var(--border)] bg-[var(--bg-glass)] px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] backdrop-blur-xl sm:hidden">
            <Button onClick={onNext} className="min-h-11 w-full">
              {isLast ? "View results" : "Next question"}
              <ArrowRight size={16} />
            </Button>
          </div>
          <Button onClick={onNext} className="hidden min-h-11 sm:inline-flex">
            {isLast ? "View results" : "Next question"}
            <ArrowRight size={16} />
          </Button>
        </>
      ) : (
        <Button onClick={onSubmit} className="min-h-11 w-full sm:w-auto">
          Submit answer and rationale
        </Button>
      )}
    </div>
  );
}

function ResultsCard({
  attempt,
  onRestart,
}: {
  attempt: SatPretestAttempt;
  onRestart: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const summary = attempt.scoreSummary;

  const handleCopy = async () => {
    const ok = await copySatPretestMarkdownToClipboard(
      attempt,
      satPretestDraft1Questions,
      APP_VERSION,
    );
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    downloadSatPretestJson(attempt, satPretestDraft1Questions, APP_VERSION);
  };

  if (!summary) {
    return (
      <Card>
        <p className="text-sm text-[var(--text-muted)]">Draft 1 is complete, but no summary is available.</p>
      </Card>
    );
  }

  return (
    <Card glow className="space-y-5">
      <div className="space-y-2">
        <p className="font-mono text-[11px] uppercase tracking-widest text-[var(--accent-2)]">
          Draft 1 complete
        </p>
        <h2 className="text-2xl font-semibold text-[var(--text-heading)]">
          {summary.correctAnswers}/{summary.totalQuestions} · {summary.pct}%
        </h2>
        <p className="text-sm text-[var(--text-muted)]">
          Time spent: {formatSeconds(summary.timeSpentSeconds)}. Use this as a diagnostic snapshot,
          not an official SAT score estimate.
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2">
        {summary.sectionBreakdown.map((item) => (
          <Metric
            key={item.key}
            label={item.label}
            value={`${item.correct}/${item.total} (${item.pct}%)`}
          />
        ))}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-[var(--text-heading)]">Top gaps</h3>
        {summary.weakSkills.length > 0 ? (
          <ul className="space-y-2">
            {summary.weakSkills.map((skill) => (
              <li key={skill.key} className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-secondary)]/35 px-4 py-3 text-sm">
                <span className="font-medium text-[var(--text-heading)]">{skill.label}</span>{" "}
                <span className="text-[var(--text-muted)]">
                  {skill.correct}/{skill.total} correct
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">
            No misses in this short draft. The next step is a harder Draft 2.
          </p>
        )}
      </section>

      {summary.recommendedNodeIds.length > 0 ? (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-[var(--text-heading)]">Recommended SAT lessons</h3>
          <div className="flex flex-wrap gap-2">
            {summary.recommendedNodeIds.map((nodeId) => (
              <Link
                key={nodeId}
                to={`/subjects/sat-prep/${nodeId}`}
                className="rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-1.5 font-mono text-xs text-[var(--accent-2)] hover:border-[var(--accent-2)]"
              >
                {nodeId}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-secondary)]/35 p-4">
        <h3 className="text-sm font-semibold text-[var(--text-heading)]">Export for Cursor</h3>
        <p className="text-sm text-[var(--text-muted)]">
          Copy a Markdown summary or download JSON when you finish Draft 1 and want gap analysis.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="secondary" onClick={handleCopy} className="min-h-11 w-full sm:w-auto">
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Copied!" : "Copy Draft 1 summary"}
          </Button>
          <Button variant="secondary" onClick={handleDownload} className="min-h-11 w-full sm:w-auto">
            <Download size={16} />
            Download JSON
          </Button>
        </div>
      </section>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Link to="/subjects/sat-prep" className="sm:w-auto">
          <Button className="min-h-11 w-full sm:w-auto">
            Back to SAT Prep
            <ArrowRight size={16} />
          </Button>
        </Link>
        <Button variant="secondary" onClick={onRestart} className="min-h-11 w-full sm:w-auto">
          Restart Draft 1
          <RotateCcw size={16} />
        </Button>
      </div>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-secondary)]/35 px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--text-muted)]">
        {label}
      </p>
      <p className="mt-1 font-mono text-sm text-[var(--text-heading)]">{value}</p>
    </div>
  );
}
