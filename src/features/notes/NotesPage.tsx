import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Loader2,
  RotateCcw,
  Send,
  Sparkles,
  Zap,
} from "lucide-react";
import { Badge, Button, Card } from "@/components/ui";
import { getNode, loadSubject } from "@/curriculum/loader";
import type { MentorMessage, MentorSession, NoteReview, SkillNode, Subject } from "@/curriculum/types";
import { getPromptsForSubject } from "@/data/notePrompts";
import {
  canAccessMentor,
  canAccessReview,
  clearMentorSession,
  countFilledResponses,
  evaluateMentorAnswerAsync,
  generateMentorQuestionsAsync,
  generateReview,
  generateReviewAsync,
  getInitialNotesView,
  getSession,
  hasMinNotesContent,
  MIN_PROMPTS_FOR_REVIEW,
  saveMentorSession,
  saveReview,
  updateResponses,
  upsertSession,
  type NotesFlowView,
} from "@/stores/noteSessions";

const STEPS: { id: NotesFlowView; label: string; description: string }[] = [
  { id: "editor", label: "Write", description: "Guided prompts" },
  { id: "review", label: "Review", description: "AI feedback" },
  { id: "mentor", label: "Mentor", description: "Quiz Q&A" },
];

const QUALITY_LABELS: Record<MentorMessage["quality"], string> = {
  "too-short": "Keep going",
  "good-start": "Good start",
  solid: "Solid",
  excellent: "Excellent",
};

function hasOpenRouterKey(): boolean {
  try {
    return !!localStorage.getItem("learnapp_openrouter_key");
  } catch {
    return false;
  }
}

export function NotesPage() {
  const { subjectId = "", nodeId = "" } = useParams();
  const [view, setView] = useState<NotesFlowView>("editor");
  const [autoReview, setAutoReview] = useState(false);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [node, setNode] = useState<SkillNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(false);
    loadSubject(subjectId).then((s) => {
      if (cancelled) return;
      const loadedNode = s ? getNode(s, nodeId) ?? null : null;
      setSubject(s ?? null);
      setNode(loadedNode);
      setLoadError(!s || !loadedNode);
      if (loadedNode) {
        setView(getInitialNotesView(loadedNode.id));
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [subjectId, nodeId]);

  const session = node ? getSession(node.id) : null;
  const reviewUnlocked = canAccessReview(session);
  const mentorUnlocked = canAccessMentor(session);

  const goTo = useCallback((next: NotesFlowView) => {
    if (next === "review" && !reviewUnlocked) return;
    if (next === "mentor" && !mentorUnlocked) return;
    setView(next);
  }, [reviewUnlocked, mentorUnlocked]);

  if (loading) {
    return (
      <div className="mx-auto w-full min-w-0 max-w-3xl space-y-8 overflow-x-hidden px-3 py-4 sm:p-4 md:space-y-10 md:p-8">
        <div className="h-4 w-32 animate-pulse rounded bg-[var(--bg-elevated)]" />
        <Card className="space-y-3">
          <div className="h-5 w-2/3 animate-pulse rounded bg-[var(--bg-elevated)]" />
          <div className="h-32 animate-pulse rounded bg-[var(--bg-elevated)]" />
        </Card>
      </div>
    );
  }

  if (loadError || !subject || !node) {
    return (
      <div className="mx-auto w-full min-w-0 max-w-3xl overflow-x-hidden px-3 py-4 sm:p-4 md:p-8">
        <Card className="space-y-4 text-center">
          <AlertCircle className="mx-auto text-[var(--warning)]" size={32} />
          <h2 className="text-lg font-semibold text-[var(--text-heading)]">Lesson not found</h2>
          <p className="text-sm text-[var(--text-muted)]">
            This notes page doesn&apos;t match a lesson in your curriculum.
          </p>
          <Link to="/subjects">
            <Button variant="secondary">Back to subjects</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const lessonPath = `/subjects/${subjectId}/${nodeId}`;
  const stepIndex = STEPS.findIndex((s) => s.id === view);

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl space-y-8 overflow-x-hidden px-3 py-4 pb-24 sm:p-4 sm:pb-4 md:space-y-10 md:p-8">
      <div className="space-y-4 border-b border-[var(--border)] pb-6">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <Link
            to={lessonPath}
            className="inline-flex min-h-11 items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
          >
            <ArrowLeft size={16} />
            Back to lesson
          </Link>
          <span className="hidden text-[var(--text-muted)] sm:inline">·</span>
          <span className="min-w-0 break-words text-sm text-[var(--text-muted)]">{node.name}</span>
        </div>

        <div className="space-y-2">
          <p className="font-mono text-[11px] uppercase tracking-widest text-[var(--text-muted)]">
            Notes · {subject.name}
          </p>
          <h1 className="text-[clamp(1.75rem,5vw,2.625rem)] font-semibold tracking-tight text-[var(--text-heading)]">
            Guided notes
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-[var(--text-muted)] max-[480px]:text-base">
            Write → get AI feedback → test yourself with mentor questions.
          </p>
        </div>

        <nav
          aria-label="Notes flow"
          className="-mx-3 flex items-center gap-1 overflow-x-auto px-3 pb-1 sm:mx-0 sm:gap-2 sm:overflow-visible sm:px-0 sm:pb-0"
        >
          {STEPS.map((step, idx) => {
            const unlocked =
              step.id === "editor" ||
              (step.id === "review" && reviewUnlocked) ||
              (step.id === "mentor" && mentorUnlocked);
            const done =
              (step.id === "editor" && reviewUnlocked) ||
              (step.id === "review" && mentorUnlocked) ||
              (step.id === "mentor" && !!session?.mentorSession?.completedAt);
            const active = view === step.id;

            return (
              <div key={step.id} className="flex shrink-0 items-center gap-1 sm:gap-2">
                {idx > 0 && (
                  <div
                    className={`h-px w-4 shrink-0 sm:w-6 ${done || active ? "bg-[var(--border-strong)]" : "bg-[var(--border)]"}`}
                  />
                )}
                <button
                  type="button"
                  disabled={!unlocked}
                  onClick={() => goTo(step.id)}
                  className={`flex min-h-11 shrink-0 touch-manipulation items-center gap-1.5 rounded-[var(--radius)] border border-transparent px-2.5 py-2 text-sm transition sm:gap-2 sm:px-3 ${
                    active
                      ? "border-[var(--accent)] bg-transparent text-[var(--text-heading)]"
                      : unlocked
                        ? "text-[var(--text)] hover:bg-white/5"
                        : "cursor-not-allowed text-[var(--text-muted)] opacity-50"
                  }`}
                  title={
                    !unlocked
                      ? step.id === "review"
                        ? `Answer at least ${MIN_PROMPTS_FOR_REVIEW} prompt to unlock`
                        : "Complete AI review first"
                      : step.description
                  }
                >
                  <span
                    className={`flex size-6 items-center justify-center rounded-full text-xs font-semibold ${
                      done
                        ? "bg-[var(--text-heading)] text-[var(--bg)]"
                        : active
                          ? "border border-[var(--accent)] text-[var(--text-heading)]"
                          : "border border-[var(--border)] text-[var(--text-muted)]"
                    }`}
                  >
                    {done ? <Check size={12} /> : idx + 1}
                  </span>
                  <span className="font-medium">{step.label}</span>
                </button>
              </div>
            );
          })}
        </nav>
      </div>

      {view === "editor" && (
        <NoteEditor
          node={node}
          subject={subject}
          onComplete={() => {
            setAutoReview(true);
            setView("review");
          }}
        />
      )}
      {view === "review" && (
        <NoteReviewPanel
          node={node}
          subject={subject}
          autoGenerate={autoReview}
          onAutoGenerateHandled={() => setAutoReview(false)}
          onBackToWrite={() => setView("editor")}
          onQuizMe={() => setView("mentor")}
        />
      )}
      {view === "mentor" && (
        <NoteMentorPanel
          node={node}
          subject={subject}
          onBackToReview={() => setView("review")}
        />
      )}

      <p className="text-center text-xs text-[var(--text-muted)]">
        Step {stepIndex + 1} of {STEPS.length} · {STEPS[stepIndex].description}
      </p>
    </div>
  );
}

function NoteEditor({
  node,
  subject,
  onComplete,
}: {
  node: SkillNode;
  subject: Subject;
  onComplete: () => void;
}) {
  const prompts = useMemo(() => getPromptsForSubject(subject.id), [subject.id]);
  const [responses, setResponses] = useState<Record<string, string>>(() => getSession(node.id)?.responses ?? {});
  const [activeIndex, setActiveIndex] = useState(0);

  const activePrompt = prompts[activeIndex];
  const filledCount = countFilledResponses(responses);
  const readyForReview = hasMinNotesContent(responses);
  const progressPct = prompts.length > 0 ? Math.round((filledCount / prompts.length) * 100) : 0;

  const persist = useCallback(
    (next: Record<string, string>) => {
      const existing = getSession(node.id);
      if (existing) updateResponses(node.id, next);
      else {
        upsertSession({
          nodeId: node.id,
          subjectId: subject.id,
          responses: next,
          review: null,
          mentorSession: null,
          tags: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    },
    [node.id, subject.id],
  );

  const handleChange = (value: string) => {
    if (!activePrompt) return;
    setResponses((prev) => {
      const next = { ...prev, [activePrompt.key]: value };
      persist(next);
      return next;
    });
  };

  const goNext = () => {
    if (activeIndex === prompts.length - 1) {
      if (readyForReview) onComplete();
    } else {
      setActiveIndex((i) => i + 1);
    }
  };

  return (
    <div className="space-y-6 pb-24 sm:pb-0">
      <Card className="min-w-0">
        <div className="mb-4 flex min-w-0 flex-wrap items-center gap-2 text-[var(--text-muted)]">
          <BookOpen size={18} className="shrink-0" />
          <span className="min-w-0 break-words font-mono text-[11px] uppercase tracking-widest">
            {node.name}
          </span>
          <Badge className="shrink-0">{filledCount}/{prompts.length} answered</Badge>
        </div>

        <div className="mb-4">
          <div className="mb-1 flex justify-between font-mono text-[11px] uppercase tracking-widest text-[var(--text-muted)]">
            <span>Progress</span>
            <span className="tabular-nums">{progressPct}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-elevated)]">
            <div
              className="h-full rounded-full bg-[var(--border-strong)] transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
          {prompts.map((prompt, idx) => {
            const filled = !!(responses[prompt.key] || "").trim();
            return (
              <button
                key={prompt.key}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={`inline-flex min-h-11 shrink-0 touch-manipulation items-center gap-1.5 rounded-[var(--radius)] border border-transparent px-3 py-2 text-xs font-medium transition sm:py-1.5 ${
                  idx === activeIndex
                    ? "border-[var(--accent)] bg-transparent text-[var(--text-heading)]"
                    : "text-[var(--text-muted)] hover:bg-white/5"
                }`}
              >
                {filled && <Check size={12} className="text-[var(--text-heading)]" />}
                {prompt.label}
              </button>
            );
          })}
        </div>

        {activePrompt && (
          <>
            <p className="mb-1 text-base font-semibold leading-snug text-[var(--text-heading)] sm:text-sm">
              {activePrompt.label}
            </p>
            <p className="mb-3 break-words text-base leading-relaxed text-[var(--text-muted)] sm:text-sm">
              {activePrompt.placeholder}
            </p>
            <textarea
              value={responses[activePrompt.key] || ""}
              onChange={(e) => handleChange(e.target.value)}
              rows={8}
              className="w-full resize-y rounded-[var(--radius)] border border-[var(--border)] bg-transparent p-3 text-base leading-relaxed text-[var(--text)] outline-none focus:border-[var(--accent)] sm:text-sm"
              placeholder="Write in your own words…"
            />
          </>
        )}
      </Card>

      {!readyForReview && (
        <p className="text-center text-sm leading-relaxed text-[var(--text-muted)] max-[480px]:text-base">
          Answer at least {MIN_PROMPTS_FOR_REVIEW} prompt to continue to review.
        </p>
      )}

      <div className="hidden justify-between sm:flex">
        <Button
          variant="secondary"
          disabled={activeIndex === 0}
          onClick={() => setActiveIndex((i) => i - 1)}
        >
          <ChevronLeft size={16} />
          Previous
        </Button>
        <Button
          onClick={goNext}
          disabled={activeIndex === prompts.length - 1 && !readyForReview}
        >
          {activeIndex === prompts.length - 1 ? "Save & review" : "Next"}
          <ChevronRight size={16} />
        </Button>
      </div>

      <div className="fixed inset-x-0 bottom-[var(--mobile-nav-height)] z-10 border-t border-[var(--border)] bg-[var(--bg-glass)] p-4 backdrop-blur-xl sm:hidden">
        <div className="flex gap-2">
          <Button
            variant="secondary"
            disabled={activeIndex === 0}
            onClick={() => setActiveIndex((i) => i - 1)}
            className="min-h-11 flex-1"
          >
            <ChevronLeft size={16} />
            Previous
          </Button>
          <Button
            onClick={goNext}
            disabled={activeIndex === prompts.length - 1 && !readyForReview}
            className="min-h-11 flex-1"
          >
            {activeIndex === prompts.length - 1 ? "Save & review" : "Next"}
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}

function NoteReviewPanel({
  node,
  subject,
  autoGenerate,
  onAutoGenerateHandled,
  onBackToWrite,
  onQuizMe,
}: {
  node: SkillNode;
  subject: Subject;
  autoGenerate: boolean;
  onAutoGenerateHandled: () => void;
  onBackToWrite: () => void;
  onQuizMe: () => void;
}) {
  const session = getSession(node.id);
  const [review, setReview] = useState<NoteReview | null>(() => session?.review ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    const current = getSession(node.id);
    if (!current || !hasMinNotesContent(current.responses)) {
      setError("Write at least one prompt answer before requesting a review.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await generateReviewAsync(
        node.id,
        current.responses,
        node.keyConcepts,
        node.name,
      );
      setReview(result);
      saveReview(node.id, result);
    } catch {
      const fallback = generateReview(node.id, current.responses, node.keyConcepts);
      setReview(fallback);
      saveReview(node.id, fallback);
    } finally {
      setLoading(false);
    }
  }, [node.id, node.keyConcepts, node.name]);

  useEffect(() => {
    if (autoGenerate && !review && !loading) {
      void handleGenerate();
      onAutoGenerateHandled();
    }
  }, [autoGenerate, review, loading, handleGenerate, onAutoGenerateHandled]);

  if (!session || !hasMinNotesContent(session.responses)) {
    return (
      <Card className="space-y-4 text-center">
        <BookOpen className="mx-auto text-[var(--text-muted)]" size={32} />
        <h2 className="text-xl font-semibold text-[var(--text-heading)]">Nothing to review yet</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Fill in at least one guided prompt so the AI has something to analyze.
        </p>
        <Button onClick={onBackToWrite}>Go to Write</Button>
      </Card>
    );
  }

  if (!review) {
    return (
      <Card className="space-y-4 text-center">
        <Sparkles className="mx-auto text-[var(--text-muted)]" size={32} />
        <h2 className="text-xl font-semibold text-[var(--text-heading)]">Ready for AI review</h2>
        <p className="text-sm text-[var(--text-muted)]">
          {hasOpenRouterKey()
            ? "Your notes will be analyzed for coverage, depth, and gaps."
            : "No API key set — review uses built-in heuristics. Add a key in Settings for richer feedback."}
        </p>
        {error && (
          <p className="text-sm text-[var(--warning)]">{error}</p>
        )}
        <Button onClick={() => void handleGenerate()} disabled={loading}>
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Analyzing your notes…
            </>
          ) : (
            <>
              <Zap size={16} />
              Generate review
            </>
          )}
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card variant="quiet" className="text-center">
        <div className="font-mono text-4xl font-semibold tabular-nums text-[var(--text-heading)]">
          {review.score}
          <span className="ml-1 text-sm font-medium text-[var(--text-muted)]">/100</span>
        </div>
        <p className="mt-1 text-sm text-[var(--text-muted)]">{subject.name} · {node.name}</p>
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          {hasOpenRouterKey() ? "AI-powered review" : "Offline heuristic review"}
        </p>
      </Card>

      <ReviewSection title="Strengths" items={review.strengths} />
      <ReviewSection title="Gaps" items={review.gaps} emptyHint="No major gaps flagged — nice work." />
      <ReviewSection title="Suggestions" items={review.suggestions} />
      {review.deeperQuestions.length > 0 && (
        <ReviewSection title="Go deeper" items={review.deeperQuestions} numbered />
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button onClick={onQuizMe} className="min-h-11 w-full sm:w-auto">
          Continue to mentor quiz
          <ChevronRight size={16} />
        </Button>
        <Button variant="secondary" onClick={() => void handleGenerate()} disabled={loading} className="min-h-11 w-full sm:w-auto">
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Regenerating…
            </>
          ) : (
            <>
              <RotateCcw size={16} />
              Regenerate
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function ReviewSection({
  title,
  items,
  emptyHint,
  numbered,
}: {
  title: string;
  items: string[];
  emptyHint?: string;
  numbered?: boolean;
}) {
  return (
    <Card variant="quiet">
      <h3 className="mb-3 break-words font-mono text-[11px] uppercase tracking-widest text-[var(--text-muted)]">
        {title}
      </h3>
      {items.length === 0 ? (
        emptyHint && <p className="text-sm text-[var(--text-muted)]">{emptyHint}</p>
      ) : (
        <ul className="space-y-1.5 text-sm text-[var(--text-muted)]">
          {items.map((item, i) => (
            <li key={`${title}-${i}`} className="flex gap-2">
              {numbered ? (
                <span className="mt-0.5 shrink-0 font-mono text-xs text-[var(--text-heading)]">{i + 1}.</span>
              ) : (
                <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-[var(--text-muted)]" />
              )}
              <span className="min-w-0 break-words">{item}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function NoteMentorPanel({
  node,
  subject,
  onBackToReview,
}: {
  node: SkillNode;
  subject: Subject;
  onBackToReview: () => void;
}) {
  const session = getSession(node.id);
  const [mentorSession, setMentorSession] = useState<MentorSession | null>(
    () => session?.mentorSession ?? null,
  );
  const [index, setIndex] = useState(() => session?.mentorSession?.messages.length ?? 0);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [lastMessage, setLastMessage] = useState<MentorMessage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    setLoading(true);
    setError(null);
    try {
      const questions = await generateMentorQuestionsAsync(node.keyConcepts, node.name);
      if (questions.length === 0) {
        setError("Could not generate questions. Try again in a moment.");
        return;
      }
      const next: MentorSession = { questions, messages: [], startedAt: Date.now(), completedAt: null };
      setMentorSession(next);
      setIndex(0);
      saveMentorSession(node.id, next);
    } catch {
      setError("Something went wrong starting the quiz. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const retake = () => {
    clearMentorSession(node.id);
    setMentorSession(null);
    setIndex(0);
    setLastMessage(null);
    setAnswer("");
    setError(null);
  };

  const submit = async () => {
    if (!mentorSession || !answer.trim()) return;
    setEvaluating(true);
    setError(null);
    const question = mentorSession.questions[index];
    try {
      const evaluation = await evaluateMentorAnswerAsync(question, answer);
      const message: MentorMessage = {
        question,
        answer: answer.trim(),
        feedback: evaluation.feedback,
        quality: evaluation.quality,
      };
      const updated: MentorSession = {
        ...mentorSession,
        messages: [...mentorSession.messages, message],
        completedAt: index + 1 >= mentorSession.questions.length ? Date.now() : null,
      };
      setMentorSession(updated);
      saveMentorSession(node.id, updated);
      setLastMessage(message);
      setAnswer("");
      setIndex((i) => i + 1);
    } catch {
      setError("Could not evaluate your answer. Try submitting again.");
    } finally {
      setEvaluating(false);
    }
  };

  if (!canAccessMentor(session ?? null)) {
    return (
      <Card className="space-y-4 text-center">
        <GraduationCap className="mx-auto text-[var(--text-muted)]" size={32} />
        <h2 className="text-xl font-semibold text-[var(--text-heading)]">Complete review first</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Generate an AI review of your notes before starting the mentor quiz.
        </p>
        <Button onClick={onBackToReview}>Go to Review</Button>
      </Card>
    );
  }

  if (!mentorSession) {
    return (
      <Card className="space-y-4 text-center">
        <GraduationCap className="mx-auto text-[var(--text-muted)]" size={32} />
        <h2 className="text-xl font-semibold text-[var(--text-heading)]">Mentor quiz</h2>
        <p className="text-sm text-[var(--text-muted)]">
          {node.name} · {subject.name}
        </p>
        <p className="text-sm text-[var(--text-muted)]">
          Five short questions to test what you retained. Answer in your own words.
        </p>
        {error && <p className="text-sm text-[var(--warning)]">{error}</p>}
        <Button onClick={() => void start()} disabled={loading}>
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Preparing questions…
            </>
          ) : (
            "Start quiz"
          )}
        </Button>
      </Card>
    );
  }

  if (index >= mentorSession.questions.length) {
    const solidCount = mentorSession.messages.filter(
      (m) => m.quality === "solid" || m.quality === "excellent",
    ).length;

    return (
      <Card className="space-y-4">
        <div className="text-center">
          <CheckCircle2 className="mx-auto text-[var(--text-muted)]" size={32} />
          <h2 className="mt-2 text-xl font-semibold text-[var(--text-heading)]">Quiz complete</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {solidCount} of {mentorSession.messages.length} answers rated solid or excellent.
          </p>
        </div>
        <div className="space-y-3">
          {mentorSession.messages.map((msg, i) => (
            <div key={i} className="rounded-[var(--radius)] border border-[var(--border)] p-3 text-sm">
              <div className="mb-1 flex items-center gap-2">
                <span className="font-medium text-[var(--text-heading)]">Q{i + 1}</span>
                <Badge>{QUALITY_LABELS[msg.quality]}</Badge>
              </div>
              <p className="text-[var(--text-muted)]">{msg.question}</p>
              <p className="mt-2 text-[var(--text)]">{msg.answer}</p>
              <p className="mt-2 text-[var(--text-muted)]">{msg.feedback}</p>
            </div>
          ))}
        </div>
        <Button variant="secondary" onClick={retake}>
          Retake quiz
        </Button>
      </Card>
    );
  }

  if (lastMessage && lastMessage.question === mentorSession.questions[index - 1]) {
    return (
      <Card className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge>{QUALITY_LABELS[lastMessage.quality]}</Badge>
          <span className="text-xs text-[var(--text-muted)]">
            Question {index} of {mentorSession.questions.length}
          </span>
        </div>
        <p className="text-sm leading-relaxed text-[var(--text)]">{lastMessage.feedback}</p>
        <Button onClick={() => setLastMessage(null)}>
          Next question
          <ChevronRight size={16} />
        </Button>
      </Card>
    );
  }

  return (
    <Card className="space-y-5">
      <div className="flex items-center justify-between text-sm text-[var(--text-muted)]">
        <span>Question {index + 1} of {mentorSession.questions.length}</span>
        <div className="h-1 w-24 overflow-hidden rounded-full bg-[var(--bg-elevated)]">
          <div
            className="h-full rounded-full bg-[var(--border-strong)] transition-all"
            style={{ width: `${((index + 1) / mentorSession.questions.length) * 100}%` }}
          />
        </div>
      </div>
      <h3 className="break-words text-lg font-semibold leading-snug text-[var(--text-heading)] sm:text-base">
        {mentorSession.questions[index]}
      </h3>
      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        rows={6}
        disabled={evaluating}
        className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-secondary)]/40 p-4 text-base leading-relaxed outline-none focus:border-[var(--border-strong)] disabled:opacity-60 sm:text-sm"
        placeholder="Type your answer in 2–4 sentences…"
      />
      {error && <p className="text-sm text-[var(--warning)]">{error}</p>}
      <Button onClick={() => void submit()} disabled={!answer.trim() || evaluating} className="min-h-12 w-full">
        {evaluating ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Evaluating…
          </>
        ) : (
          <>
            Submit answer
            <Send size={16} />
          </>
        )}
      </Button>
    </Card>
  );
}
