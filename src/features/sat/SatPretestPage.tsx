import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Download,
  RotateCcw,
  XCircle,
} from "lucide-react";
import {
  Button,
  Card,
  FocusShell,
  FocusStudyBar,
  PageContainer,
  PageHeader,
} from "@/components/ui";
import { usePreferences } from "@/stores/preferences";
import {
  SAT_PRETEST_DRAFT_1_ID,
  satPretestDraft1Questions,
} from "@/data/satPretestDraft1";
import {
  SAT_PRETEST_DRAFT_2_ID,
  satPretestDraft2Questions,
} from "@/data/satPretestDraft2";
import {
  SAT_PRETEST_DRAFT_3_ID,
  SAT_PRETEST_DRAFT_CONFIGS,
  getSatPretestDraftConfig,
  getSatPretestDraftLabel,
  isSatPretestFollowUpDraft,
} from "@/data/satPretestDrafts";
import {
  loadImportedDraft2Questions,
  saveImportedDraft2Questions,
} from "@/lib/satPretestDraft2Pool";
import {
  advanceSatPretestAttempt,
  buildDraft2FromGaps,
  compareDraftScores,
  completeSatPretestAttempt,
  copyCursorAnalysisPromptToClipboard,
  copySatPretestMarkdownToClipboard,
  downloadSatPretestJson,
  getSatPretestCursorResponseTemplate,
  getActiveSatPretestAttempt,
  getLatestCompletedSatPretestAttempt,
  parseSatPretestCursorImportJson,
  recordSatPretestResponse,
  resetSatPretestDraft,
  startSatPretestAttempt,
  type SatPretestAttempt,
  type SatPretestQuestion,
} from "@/lib/satPretest";
import { addMistake } from "@/lib/satMistakeLog";
import { applySatLessonPlanImport, loadSatLessonPlan } from "@/lib/satLessonPlan";
import {
  buildMistakeDraftFromResponse,
  listMissedPretestItems,
} from "@/lib/satPretestMistake";
import { SatPretestRationaleReviewBlock } from "@/features/sat/SatPretestRationaleReview";
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

function resolveQuestionBank(
  attempt: SatPretestAttempt | null,
  importedDraft2: SatPretestQuestion[],
): SatPretestQuestion[] {
  if (!attempt || attempt.draftId === SAT_PRETEST_DRAFT_1_ID) {
    return satPretestDraft1Questions;
  }
  if (attempt.draftId === SAT_PRETEST_DRAFT_3_ID) {
    return attempt.questionOrder
      .map((id) => satPretestDraft1Questions.find((question) => question.id === id))
      .filter((question): question is SatPretestQuestion => !!question);
  }
  const pool = [...satPretestDraft2Questions, ...importedDraft2];
  return attempt.questionOrder
    .map((id) => pool.find((question) => question.id === id))
    .filter((question): question is SatPretestQuestion => !!question);
}

function getCurrentQuestion(
  attempt: SatPretestAttempt,
  bank: SatPretestQuestion[],
): SatPretestQuestion | null {
  const questionId = attempt.questionOrder[attempt.currentIndex];
  return bank.find((question) => question.id === questionId) ?? null;
}

function loadAttemptForDraft(draftId: string): SatPretestAttempt | null {
  return (
    getActiveSatPretestAttempt(draftId) ?? getLatestCompletedSatPretestAttempt(draftId)
  );
}

export function SatPretestPage() {
  const { focusMode, toggleFocusMode } = usePreferences();
  const [viewDraftId, setViewDraftId] = useState(SAT_PRETEST_DRAFT_1_ID);
  const [importedDraft2, setImportedDraft2] = useState<SatPretestQuestion[]>(() =>
    loadImportedDraft2Questions(),
  );
  const persistImportedDraft2 = useCallback((questions: SatPretestQuestion[]) => {
    setImportedDraft2(questions);
    saveImportedDraft2Questions(questions);
  }, []);
  const [attempt, setAttempt] = useState<SatPretestAttempt | null>(() =>
    loadAttemptForDraft(SAT_PRETEST_DRAFT_1_ID),
  );
  const draft1Completed = getLatestCompletedSatPretestAttempt(SAT_PRETEST_DRAFT_1_ID);
  const [selectedChoiceId, setSelectedChoiceId] = useState("");
  const [rationale, setRationale] = useState("");
  const [error, setError] = useState("");
  const [submittedQuestionId, setSubmittedQuestionId] = useState<string | null>(null);
  const [questionStartedAt, setQuestionStartedAt] = useState(() => Date.now());

  const activeAttempt =
    attempt && attempt.draftId === viewDraftId ? attempt : null;
  const questionBank = resolveQuestionBank(activeAttempt, importedDraft2);
  const currentQuestion =
    activeAttempt?.status === "in_progress"
      ? getCurrentQuestion(activeAttempt, questionBank)
      : null;
  const currentResponse = currentQuestion ? activeAttempt?.responses[currentQuestion.id] : null;
  const completedAttempt = activeAttempt?.status === "completed" ? activeAttempt : null;

  const sectionCounts = useMemo(() => {
    const math = satPretestDraft1Questions.filter((question) => question.section === "math").length;
    return { math, rw: satPretestDraft1Questions.length - math };
  }, []);

  const resetQuestionUi = useCallback(() => {
    setSelectedChoiceId("");
    setRationale("");
    setSubmittedQuestionId(null);
    setQuestionStartedAt(Date.now());
    setError("");
  }, []);

  const startAttempt = useCallback(() => {
    const nextAttempt = startSatPretestAttempt(SAT_PRETEST_DRAFT_1_ID, satPretestDraft1Questions);
    setViewDraftId(SAT_PRETEST_DRAFT_1_ID);
    setAttempt(nextAttempt);
    resetQuestionUi();
  }, [resetQuestionUi]);

  const startDraft2FromGaps = useCallback(() => {
    if (!draft1Completed) {
      setError("Finish Draft 1 before starting Draft 2.");
      return;
    }
    const built = buildDraft2FromGaps(draft1Completed, [
      ...satPretestDraft2Questions,
      ...importedDraft2,
    ]);
    if (!built) {
      setError("Could not build a Draft 2 set from your gaps.");
      return;
    }
    const nextAttempt = startSatPretestAttempt(
      SAT_PRETEST_DRAFT_2_ID,
      built.questions,
      localStorage,
      {
        compareDraftId: SAT_PRETEST_DRAFT_1_ID,
        questionTargets: built.questionTargets,
      },
    );
    setViewDraftId(SAT_PRETEST_DRAFT_2_ID);
    setAttempt(nextAttempt);
    resetQuestionUi();
  }, [draft1Completed, importedDraft2, resetQuestionUi]);

  const startDraft3Retest = useCallback(() => {
    if (!draft1Completed) {
      setError("Finish Draft 1 before starting Draft 3.");
      return;
    }
    const nextAttempt = startSatPretestAttempt(
      SAT_PRETEST_DRAFT_3_ID,
      satPretestDraft1Questions,
      localStorage,
      { compareDraftId: SAT_PRETEST_DRAFT_1_ID },
    );
    setViewDraftId(SAT_PRETEST_DRAFT_3_ID);
    setAttempt(nextAttempt);
    resetQuestionUi();
  }, [draft1Completed, resetQuestionUi]);

  const restartDraft = useCallback(() => {
    resetSatPretestDraft(viewDraftId);
    setAttempt(null);
    resetQuestionUi();
  }, [viewDraftId, resetQuestionUi]);

  const switchToDraft = useCallback((draftId: string) => {
    setViewDraftId(draftId);
    setAttempt(loadAttemptForDraft(draftId));
    resetQuestionUi();
  }, [resetQuestionUi]);

  const submitQuestion = useCallback(() => {
    if (!activeAttempt || !currentQuestion) return;
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
        attemptId: activeAttempt.id,
        questionId: currentQuestion.id,
        selectedChoiceId,
        rationale,
        timeSpentSeconds: Math.max(1, Math.round((Date.now() - questionStartedAt) / 1000)),
      },
      questionBank,
    );

    if (!updated) {
      setError("Could not save this answer. Try again.");
      return;
    }

    setAttempt({ ...updated });
    setSubmittedQuestionId(currentQuestion.id);
    setError("");
  }, [activeAttempt, currentQuestion, questionBank, questionStartedAt, rationale, selectedChoiceId]);

  const goNext = useCallback(() => {
    if (!activeAttempt || !currentQuestion) return;

    const isLast = activeAttempt.currentIndex >= activeAttempt.questionOrder.length - 1;
    if (isLast) {
      const completed = completeSatPretestAttempt(activeAttempt.id, questionBank);
      if (completed) setAttempt({ ...completed });
    } else {
      const updated = advanceSatPretestAttempt(activeAttempt.id);
      if (updated) setAttempt({ ...updated });
    }

    resetQuestionUi();
  }, [activeAttempt, currentQuestion, questionBank, resetQuestionUi]);

  const draftLabel = getSatPretestDraftLabel(viewDraftId);
  const viewDraftConfig = getSatPretestDraftConfig(viewDraftId);

  const startViewDraft = useCallback(() => {
    if (viewDraftId === SAT_PRETEST_DRAFT_1_ID) {
      startAttempt();
      return;
    }
    if (viewDraftId === SAT_PRETEST_DRAFT_2_ID) {
      startDraft2FromGaps();
      return;
    }
    if (viewDraftId === SAT_PRETEST_DRAFT_3_ID) {
      startDraft3Retest();
    }
  }, [viewDraftId, startAttempt, startDraft2FromGaps, startDraft3Retest]);

  const inProgress =
    activeAttempt?.status === "in_progress" && !!currentQuestion;

  return (
    <FocusShell active={focusMode}>
      <PageContainer size="wide" className="space-y-6">
        {focusMode ? (
          <FocusStudyBar
            backTo="/subjects/sat-prep"
            backLabel="SAT Prep"
            onExitFocus={toggleFocusMode}
          />
        ) : (
          <PageHeader
            backTo={{ to: "/subjects/sat-prep", label: "SAT Prep" }}
            eyebrow="SAT optional baseline"
            title={`${draftLabel} pretest`}
            subtitle="Optional local baseline—not an official score. Daily SAT work is the lesson track, mistake log, and official practice; Draft 2 can target gaps when you want a follow-up."
            divider={false}
          />
        )}

        {(!focusMode || !inProgress) && (
      <div className="flex flex-wrap gap-2">
        {SAT_PRETEST_DRAFT_CONFIGS.map((draft) => {
          const requires = draft.requiresCompletedDraftId;
          const unlocked = !requires || !!getLatestCompletedSatPretestAttempt(requires);
          return (
            <Button
              key={draft.id}
              variant={viewDraftId === draft.id ? "primary" : "secondary"}
              className="min-h-9"
              onClick={() => switchToDraft(draft.id)}
              disabled={!unlocked}
              title={draft.shortLabel}
            >
              {draft.label}
            </Button>
          );
        })}
      </div>
        )}

      {!activeAttempt ? (
        <StartCard
          draftId={viewDraftId}
          mathCount={sectionCounts.math}
          rwCount={sectionCounts.rw}
          total={
            viewDraftId === SAT_PRETEST_DRAFT_1_ID || viewDraftId === SAT_PRETEST_DRAFT_3_ID
              ? satPretestDraft1Questions.length
              : satPretestDraft2Questions.length
          }
          draftKind={viewDraftConfig?.kind ?? "baseline"}
          draft1Done={!!draft1Completed}
          onStart={startViewDraft}
          onImportDraft2={persistImportedDraft2}
        />
      ) : completedAttempt ? (
        <ResultsCard
          attempt={completedAttempt}
          questions={questionBank}
          compareBaseline={
            completedAttempt.compareDraftId
              ? getLatestCompletedSatPretestAttempt(completedAttempt.compareDraftId)
              : null
          }
          onRestart={restartDraft}
          onStartDraft2={startDraft2FromGaps}
          onStartDraft3={startDraft3Retest}
          showDraft2Cta={completedAttempt.draftId === SAT_PRETEST_DRAFT_1_ID}
          showDraft3Cta={
            completedAttempt.draftId === SAT_PRETEST_DRAFT_1_ID ||
            completedAttempt.draftId === SAT_PRETEST_DRAFT_2_ID
          }
        />
      ) : currentQuestion && activeAttempt ? (
        <QuestionCard
          attempt={activeAttempt}
          question={currentQuestion}
          targetReason={
            activeAttempt.questionTargets?.find(
              (target) => target.questionId === currentQuestion.id,
            )?.reason
          }
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
          <p className="text-sm text-[var(--text-muted)]">No {draftLabel} question is available.</p>
        </Card>
      )}
      </PageContainer>
    </FocusShell>
  );
}

function StartCard({
  draftId,
  mathCount,
  rwCount,
  total,
  draftKind,
  draft1Done,
  onStart,
  onImportDraft2,
}: {
  draftId: string;
  mathCount: number;
  rwCount: number;
  total: number;
  draftKind: "baseline" | "gaps" | "retest";
  draft1Done: boolean;
  onStart: () => void;
  onImportDraft2: (questions: SatPretestQuestion[]) => void;
}) {
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState("");
  const [importOk, setImportOk] = useState("");
  const isGapDraft = draftKind === "gaps";
  const isRetest = draftKind === "retest";
  const draftTitle = getSatPretestDraftLabel(draftId);
  const savedPlan = isGapDraft ? loadSatLessonPlan() : null;

  const handleImport = () => {
    const result = parseSatPretestCursorImportJson(importText);
    if (!result.ok) {
      setImportError(result.error);
      setImportOk("");
      return;
    }
    setImportError("");
    onImportDraft2(result.questions);
    if (result.lessonPlan.length > 0 || result.notes) {
      applySatLessonPlanImport(result.lessonPlan, { notes: result.notes });
    }
    const parts = [`${result.questions.length} Draft 2 question(s) ready.`];
    if (result.lessonPlan.length > 0) {
      parts.push(`${result.lessonPlan.length} lesson plan item(s) saved.`);
    }
    setImportOk(parts.join(" "));
  };

  return (
    <Card variant="primary" className="space-y-5">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-[var(--text-heading)]">
          Start {draftTitle}
        </h2>
        <p className="text-sm leading-relaxed text-[var(--text-muted)]">
          {isGapDraft ? (
            draft1Done ? (
              <>
                Targeted follow-up from your Draft 1 gaps (up to 6 questions). Each item still
                requires answer plus rationale.
              </>
            ) : (
              "Complete Draft 1 first so Draft 2 can target your weak skills."
            )
          ) : isRetest ? (
            draft1Done ? (
              <>
                Retake the same {total} Draft 1 questions to measure progress. Scores compare to your
                last completed Draft 1.
              </>
            ) : (
              "Complete Draft 1 first before a retest."
            )
          ) : (
            <>
              You will answer {total} original diagnostic questions: {mathCount} Math and {rwCount}{" "}
              Reading & Writing. Each item requires an answer and a written rationale.
            </>
          )}
        </p>
      </div>
      {isGapDraft ? (
        <div className="space-y-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-secondary)]/35 p-4">
          <p className="text-sm font-medium text-[var(--text-heading)]">
            Import Cursor response JSON (Draft 2 questions + optional lesson plan)
          </p>
          <textarea
            value={importText}
            onChange={(event) => setImportText(event.target.value)}
            rows={6}
            placeholder='{ "questions": [ ... ], "lessonPlan": [ { "nodeId": "st4", "reason": "..." } ] }'
            className="w-full resize-y rounded-[var(--radius)] border border-[var(--border-strong)] bg-[var(--bg-secondary)] px-3 py-2 font-mono text-xs text-[var(--text)]"
          />
          {importError ? <p className="text-sm text-[var(--warning)]">{importError}</p> : null}
          {importOk ? <p className="text-sm text-[var(--accent-2)]">{importOk}</p> : null}
          <Button variant="secondary" onClick={handleImport} className="min-h-10">
            Validate Cursor import
          </Button>
          {savedPlan ? (
            <ul className="mt-2 space-y-1 text-sm text-[var(--text-muted)]">
              <li className="font-medium text-[var(--text-heading)]">Saved lesson plan</li>
              {savedPlan.entries.slice(0, 5).map((entry) => (
                <li key={entry.nodeId}>
                  <Link
                    to={`/subjects/sat-prep/${entry.nodeId}`}
                    className="text-[var(--accent-2)] hover:underline"
                  >
                    {entry.nodeId}
                  </Link>
                  — {entry.reason}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Feedback" value="After submit" />
        <Metric label="Storage" value="Local only" />
        <Metric label="Resume" value="After refresh" />
      </div>
      <Button
        onClick={onStart}
        disabled={(isGapDraft || isRetest) && !draft1Done}
        className="min-h-11 w-full sm:w-auto"
      >
        {isGapDraft ? "Start targeted Draft 2" : isRetest ? "Start Draft 3 retest" : "Start baseline"}
        <ArrowRight size={16} />
      </Button>
    </Card>
  );
}

function QuestionCard({
  attempt,
  question,
  targetReason,
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
  targetReason?: string;
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
        {targetReason ? (
          <p className="text-sm text-[var(--accent-2)]">{targetReason}</p>
        ) : null}
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
  questions,
  compareBaseline,
  onRestart,
  onStartDraft2,
  onStartDraft3,
  showDraft2Cta,
  showDraft3Cta,
}: {
  attempt: SatPretestAttempt;
  questions: SatPretestQuestion[];
  compareBaseline: SatPretestAttempt | null;
  onRestart: () => void;
  onStartDraft2: () => void;
  onStartDraft3: () => void;
  showDraft2Cta: boolean;
  showDraft3Cta: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [cursorCopied, setCursorCopied] = useState(false);
  const [loggedMisses, setLoggedMisses] = useState<Set<string>>(() => new Set());
  const missedItems = useMemo(
    () => listMissedPretestItems(attempt, questions),
    [attempt, questions],
  );
  const summary = attempt.scoreSummary;
  const draftTitle = getSatPretestDraftLabel(attempt.draftId);
  const isBaselineDraft = attempt.draftId === SAT_PRETEST_DRAFT_1_ID;
  const isFollowUpDraft = isSatPretestFollowUpDraft(attempt.draftId);
  const baselineLabel = compareBaseline
    ? getSatPretestDraftLabel(compareBaseline.draftId)
    : "baseline";
  const comparisons =
    compareBaseline && isFollowUpDraft ? compareDraftScores(compareBaseline, attempt) : [];

  const handleCopy = async () => {
    const ok = await copySatPretestMarkdownToClipboard(
      attempt,
      questions,
      APP_VERSION,
    );
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    downloadSatPretestJson(attempt, questions, APP_VERSION);
  };

  const handleCopyCursorPrompt = async () => {
    const ok = await copyCursorAnalysisPromptToClipboard(attempt, questions, APP_VERSION);
    if (ok) {
      setCursorCopied(true);
      setTimeout(() => setCursorCopied(false), 2000);
    }
  };

  const handleDownloadCursorTemplate = () => {
    const json = JSON.stringify(getSatPretestCursorResponseTemplate(), null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "sat-pretest-cursor-template.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (!summary) {
    return (
      <Card>
        <p className="text-sm text-[var(--text-muted)]">
          {draftTitle} is complete, but no summary is available.
        </p>
      </Card>
    );
  }

  return (
    <Card glow className="space-y-5">
      <div className="space-y-2">
        <p className="font-mono text-[11px] uppercase tracking-widest text-[var(--accent-2)]">
          {draftTitle} complete
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

      {comparisons.length > 0 ? (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-[var(--text-heading)]">
            {baselineLabel} vs {draftTitle} by skill
          </h3>
          <ul className="space-y-2">
            {comparisons.map((row) => (
              <li
                key={row.skill}
                className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-secondary)]/35 px-4 py-3 text-sm"
              >
                <span className="font-medium text-[var(--text-heading)]">{row.skill}</span>{" "}
                <span className="text-[var(--text-muted)]">
                  {row.draft1Pct}% → {row.draft2Pct}% ({row.delta >= 0 ? "+" : ""}
                  {row.delta})
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {missedItems.length > 0 ? (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-[var(--text-heading)]">
            Review misses
          </h3>
          <p className="text-sm text-[var(--text-muted)]">
            Optional AI rationale review (OpenRouter) or one tap to the mistake log. Not a live tutor
            — only after you finish this draft.
          </p>
          <ul className="space-y-2">
            {missedItems.map(({ question, response }) => {
              const logged = loggedMisses.has(question.id);
              return (
                <li
                  key={question.id}
                  className="flex flex-col gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-secondary)]/35 px-4 py-3"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 text-sm">
                      <span className="font-medium text-[var(--text-heading)]">
                        {question.skill}
                      </span>
                      <span className="text-[var(--text-muted)]">
                        {" "}
                        · {SECTION_LABELS[question.section]}
                      </span>
                    </div>
                    <Button
                      variant="secondary"
                      className="min-h-10 shrink-0 touch-manipulation"
                      disabled={logged}
                      onClick={() => {
                        const input = buildMistakeDraftFromResponse(question, response);
                        const entry = addMistake(input);
                        if (entry) {
                          setLoggedMisses((prev) => new Set(prev).add(question.id));
                        }
                      }}
                    >
                      {logged ? "Logged" : "Log to mistake log"}
                    </Button>
                  </div>
                  <SatPretestRationaleReviewBlock question={question} response={response} />
                </li>
              );
            })}
          </ul>
          <Link
            to="/subjects/sat-prep#mistakes"
            className="text-sm font-medium text-[var(--accent-2)] hover:underline"
          >
            Open mistake log
          </Link>
        </section>
      ) : null}

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

      <section className="space-y-3 rounded-[var(--radius)] border border-[var(--accent-2)]/25 bg-[var(--accent-bg)]/40 p-4">
        <h3 className="text-sm font-semibold text-[var(--text-heading)]">Export for Cursor</h3>
        <p className="text-sm text-[var(--text-muted)]">
          {isBaselineDraft
            ? "Copy the full Cursor prompt (export + response template), or download artifacts separately."
            : "Copy Markdown or download JSON for your records."}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {isBaselineDraft ? (
            <Button
              onClick={handleCopyCursorPrompt}
              className="min-h-11 w-full sm:w-auto"
            >
              {cursorCopied ? <Check size={16} /> : <Copy size={16} />}
              {cursorCopied ? "Copied!" : "Copy Cursor prompt"}
            </Button>
          ) : null}
          <Button variant="secondary" onClick={handleCopy} className="min-h-11 w-full sm:w-auto">
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Copied!" : isBaselineDraft ? "Copy export Markdown" : `Copy ${draftTitle} summary`}
          </Button>
          <Button variant="secondary" onClick={handleDownload} className="min-h-11 w-full sm:w-auto">
            <Download size={16} />
            Download export JSON
          </Button>
          {isBaselineDraft ? (
            <Button
              variant="secondary"
              onClick={handleDownloadCursorTemplate}
              className="min-h-11 w-full sm:w-auto"
            >
              <Download size={16} />
              Download response template
            </Button>
          ) : null}
        </div>
      </section>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {showDraft2Cta ? (
          <Button onClick={onStartDraft2} className="min-h-11 w-full sm:w-auto">
            Start Draft 2 from gaps
            <ArrowRight size={16} />
          </Button>
        ) : null}
        {showDraft3Cta ? (
          <Button variant="secondary" onClick={onStartDraft3} className="min-h-11 w-full sm:w-auto">
            Start Draft 3 retest
            <ArrowRight size={16} />
          </Button>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Link to="/subjects/sat-prep" className="sm:w-auto">
          <Button className="min-h-11 w-full sm:w-auto">
            Back to SAT Prep
            <ArrowRight size={16} />
          </Button>
        </Link>
        <Button variant="secondary" onClick={onRestart} className="min-h-11 w-full sm:w-auto">
          Restart {draftTitle}
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
