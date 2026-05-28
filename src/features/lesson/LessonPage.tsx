import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  FlaskConical,
  Lightbulb,
  Lock,
} from "lucide-react";
import {
  Button,
  Card,
  Field,
  FocusShell,
  KeyHint,
  PageContainer,
  PageLoading,
  Stat,
  Tag,
  Textarea,
} from "@/components/ui";
import { getAdjacentLessonNodes, getNode, loadSubject } from "@/curriculum/loader";
import type { SkillNode, Subject } from "@/curriculum/types";
import { ResourceCard } from "@/features/lesson/ResourceCard";
import { CollapsibleSection, WorkedExampleCard } from "@/features/lesson/LessonSections";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { usePreferences } from "@/stores/preferences";
import {
  getTakeaways,
  MAX_TAKEAWAYS,
  parseTakeaways,
  saveTakeaways,
} from "@/stores/noteSessions";
import { useProgress } from "@/stores/progress";
import { cn } from "@/lib/cn";

function getTradingLessonIndex(nodeId: string): number | null {
  const match = /^t(\d+)$/.exec(nodeId);
  if (!match) return null;
  return Number.parseInt(match[1], 10);
}

export function LessonPage() {
  const { subjectId = "", nodeId = "" } = useParams();
  const navigate = useNavigate();
  const { focusMode, toggleFocusMode } = usePreferences();
  const { getNodeStatus, startNode, trackVisit, completeNode, getNodeProgress } = useProgress();

  const [subject, setSubject] = useState<Subject | null>(null);
  const [node, setNode] = useState<SkillNode | null>(null);
  const [loading, setLoading] = useState(true);

  const neighbors = useMemo(
    () => (subject && node ? getAdjacentLessonNodes(subject, node.id) : null),
    [subject, node],
  );

  const goToLesson = useCallback(
    (targetId: string) => {
      navigate(`/subjects/${subjectId}/${targetId}`);
    },
    [navigate, subjectId],
  );

  const { onTouchStart, onTouchMove, onTouchEnd } = useSwipeNavigation({
    onSwipeLeft: neighbors ? () => goToLesson(neighbors.next.id) : undefined,
    onSwipeRight: neighbors ? () => goToLesson(neighbors.prev.id) : undefined,
  });

  useEffect(() => {
    let cancelled = false;
    loadSubject(subjectId).then((s) => {
      if (cancelled) return;
      setSubject(s ?? null);
      setNode(s ? getNode(s, nodeId) ?? null : null);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [subjectId, nodeId]);

  useEffect(() => {
    if (node && getNodeStatus(node) !== "locked") {
      startNode(node.id);
      trackVisit(node.id);
    }
  }, [node, getNodeStatus, startNode, trackVisit]);

  if (loading) {
    return <PageLoading size="narrow" />;
  }

  if (!subject || !node) {
    return (
      <PageContainer size="narrow">
        <p className="text-sm text-[var(--text-muted)]">Lesson not found.</p>
        <Link to="/subjects">
          <Button variant="secondary" className="mt-4">
            Back to subjects
          </Button>
        </Link>
      </PageContainer>
    );
  }

  const status = getNodeStatus(node);
  const isCompleted = status === "completed";
  const isLocked = status === "locked";
  const timeSpent = Math.round(getNodeProgress(node.id).timeSpentMinutes);
  const tradingLessonIndex = subject.id === "trading" ? getTradingLessonIndex(node.id) : null;
  const showTradingLabCard = tradingLessonIndex !== null && tradingLessonIndex >= 11;
  const lessonIndex = subject.nodes.findIndex((n) => n.id === node.id) + 1;

  const handleComplete = () => {
    completeNode(node.id, node.xpValue);
  };

  const quizCount = node.quiz?.length ?? 0;

  return (
    <FocusShell active={focusMode}>
      <PageContainer
        size="lg"
        className={cn("space-y-6 md:space-y-8", focusMode && "pt-2")}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {!focusMode && (
          <nav aria-label="Lesson breadcrumb" className="text-[12px]">
            <ol className="flex flex-wrap items-center gap-1 text-[var(--text-muted)]">
              <li>
                <Link to="/subjects" className="hover:text-[var(--text)]">
                  Subjects
                </Link>
              </li>
              <li aria-hidden>
                <ChevronRight size={11} className="text-[var(--text-subtle)]" />
              </li>
              <li>
                <Link
                  to={`/subjects/${subject.id}`}
                  className="inline-flex items-center gap-1.5 hover:text-[var(--text)]"
                >
                  <span
                    aria-hidden
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: subject.color }}
                  />
                  {subject.name}
                </Link>
              </li>
              <li aria-hidden>
                <ChevronRight size={11} className="text-[var(--text-subtle)]" />
              </li>
              <li className="font-mono text-[var(--text-subtle)] tabular-nums">
                lesson {lessonIndex}/{subject.nodes.length}
              </li>
            </ol>
          </nav>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,16rem)]">
          <div className="min-w-0 space-y-6 md:space-y-8">
            <header className="stagger-item space-y-4">
              <h1
                className={cn(
                  "break-words font-semibold tracking-tight text-[var(--text-heading)]",
                  focusMode
                    ? "text-[clamp(2rem,4vw,2.625rem)] leading-[1.15]"
                    : "text-[clamp(1.625rem,3.5vw,2.125rem)] leading-[1.2]",
                )}
              >
                {node.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <Tag tone="mono" size="sm">
                  {node.difficulty}
                </Tag>
                {isCompleted ? (
                  <Tag tone="success" size="sm" mono className="gap-1">
                    <CheckCircle2 size={11} aria-hidden />
                    Completed
                  </Tag>
                ) : isLocked ? (
                  <Tag tone="warning" size="sm" mono className="gap-1">
                    <Lock size={11} aria-hidden />
                    Locked
                  </Tag>
                ) : null}
                {node.estimatedMinutes > 0 ? (
                  <Tag tone="mono" size="sm" className="gap-1">
                    <Clock size={11} aria-hidden />
                    {node.estimatedMinutes}m
                  </Tag>
                ) : null}
                <Tag tone="mono" size="sm">
                  +{node.xpValue} XP
                </Tag>
                {timeSpent > 0 ? (
                  <Tag tone="muted" size="sm" mono>
                    {timeSpent}m logged
                  </Tag>
                ) : null}
              </div>
              <p className="max-w-[var(--measure-prose)] break-words text-[15px] leading-[1.7] text-[var(--text-muted)] md:text-base">
                {node.description}
              </p>
            </header>

            {showTradingLabCard ? (
              <Card
                variant="quiet"
                density="normal"
                className="stagger-item flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <FlaskConical size={16} className="mt-0.5 shrink-0 text-[var(--text-muted)]" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--text-heading)]">Open Trading Lab</p>
                    <p className="text-sm text-[var(--text-muted)]">
                      Practice in the sandbox or continue with hands-on Algo Lab modules.
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Link to="/lab/trading">
                    <Button variant="secondary" size="sm">
                      Trading Lab
                    </Button>
                  </Link>
                  <Link to="/subjects/algo-lab">
                    <Button variant="secondary" size="sm">
                      Algo Lab
                    </Button>
                  </Link>
                </div>
              </Card>
            ) : null}

            {node.whyItMatters ? (
              <section
                className="stagger-item max-w-[var(--measure-prose)] border-l-2 border-[var(--accent-border)] bg-[var(--accent-bg)] px-4 py-3"
                aria-label="Why it matters"
              >
                <p className="eyebrow-mono mb-1.5">Why it matters</p>
                <p className="break-words text-[15px] leading-[1.7] text-[var(--text)]">
                  {node.whyItMatters}
                </p>
              </section>
            ) : null}

            {node.keyConcepts.length > 0 && (
              <CollapsibleSection
                id={`${node.id}-concepts`}
                title="Key concepts"
                icon={<BookOpen size={14} />}
                count={node.keyConcepts.length}
                accentColor={subject.color}
              >
                <ul className="min-w-0 space-y-2 pl-4 [list-style:disc] marker:text-[var(--text-subtle)]">
                  {node.keyConcepts.map((c) => (
                    <li
                      key={c}
                      className="break-words text-[15px] leading-[1.7] text-[var(--text)]"
                    >
                      {c}
                    </li>
                  ))}
                </ul>
              </CollapsibleSection>
            )}

            {node.workedExamples?.map((ex, i) => (
              <WorkedExampleCard
                key={i}
                index={i}
                nodeId={node.id}
                problem={ex.problem}
                solution={ex.solution}
                explanation={ex.explanation}
                accentColor={subject.color}
              />
            ))}

            {node.resources.length > 0 && (
              <CollapsibleSection
                id={`${node.id}-resources`}
                title="Resources"
                icon={<BookOpen size={14} />}
                count={node.resources.length}
                accentColor={subject.color}
                defaultOpen={false}
              >
                <div className="grid min-w-0 gap-4">
                  {node.resources.map((r, i) => (
                    <ResourceCard key={r.url} resource={r} nodeId={node.id} resourceIndex={i} />
                  ))}
                </div>
              </CollapsibleSection>
            )}

            <LessonTakeaways nodeId={node.id} subjectId={subject.id} disabled={isLocked} />

            {neighbors ? (
              <div className="flex flex-col gap-2 border-t border-[var(--rule)] pt-4 sm:flex-row sm:justify-between">
                <Link to={`/subjects/${subject.id}/${neighbors.prev.id}`} className="min-w-0">
                  <Button variant="ghost" size="sm" className="w-full justify-start sm:w-auto">
                    <ArrowLeft size={14} aria-hidden />
                    <span className="truncate">Prev: {neighbors.prev.name}</span>
                  </Button>
                </Link>
                <Link to={`/subjects/${subject.id}/${neighbors.next.id}`} className="min-w-0">
                  <Button variant="ghost" size="sm" className="w-full justify-end sm:w-auto">
                    <span className="truncate">Next: {neighbors.next.name}</span>
                    <ArrowRight size={14} aria-hidden />
                  </Button>
                </Link>
              </div>
            ) : null}
          </div>

          <aside className="min-w-0 space-y-3 lg:sticky lg:top-[calc(var(--topbar-height)+1rem)] lg:self-start">
            <Card variant="default" density="normal" className="min-w-0 space-y-4">
              <div className="border-b border-[var(--rule)] pb-3">
                <p className="eyebrow-mono">Lesson actions</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Minutes" value={timeSpent || "—"} size="sm" />
                <Stat label="XP" value={`+${node.xpValue}`} size="sm" />
                {quizCount > 0 ? (
                  <Stat label="Quiz" value={`${quizCount}q`} size="sm" />
                ) : null}
                <Stat label="Status" value={isCompleted ? "Done" : isLocked ? "Locked" : "Open"} size="sm" />
              </div>

              <div className="flex flex-col gap-2">
                {quizCount > 0 && !isLocked ? (
                  <Link to={`/subjects/${subject.id}/${node.id}/quiz`} className="block">
                    <Button className="w-full">
                      Take quiz
                      <ArrowRight size={14} aria-hidden />
                    </Button>
                  </Link>
                ) : null}
                <Link to={`/subjects/${subject.id}/${node.id}/notes`} className="block">
                  <Button variant="secondary" className="w-full">
                    <FileText size={14} aria-hidden />
                    Office hours
                  </Button>
                </Link>
                {!isLocked && !isCompleted ? (
                  <Button variant="secondary" onClick={handleComplete} className="w-full">
                    <CheckCircle2 size={14} aria-hidden />
                    Mark complete
                  </Button>
                ) : null}
                {focusMode ? (
                  <Button variant="ghost" onClick={toggleFocusMode} className="w-full">
                    Exit focus
                    <KeyHint size="sm">F</KeyHint>
                  </Button>
                ) : null}
              </div>
            </Card>
          </aside>
        </div>
      </PageContainer>
    </FocusShell>
  );
}

function LessonTakeaways({
  nodeId,
  subjectId,
  disabled,
}: {
  nodeId: string;
  subjectId: string;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState(() => getTakeaways(nodeId));
  const [saved, setSaved] = useState(() => getTakeaways(nodeId));
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    const text = getTakeaways(nodeId);
    setDraft(text);
    setSaved(text);
    setError(null);
    setJustSaved(false);
  }, [nodeId]);

  const bullets = parseTakeaways(draft);
  const isDirty = draft !== saved;
  const canSave =
    !disabled && isDirty && bullets.length >= 1 && bullets.length <= MAX_TAKEAWAYS;

  const handleSave = () => {
    const result = saveTakeaways(nodeId, subjectId, draft);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const normalized = getTakeaways(nodeId);
    setDraft(normalized);
    setSaved(normalized);
    setError(null);
    setJustSaved(true);
    window.setTimeout(() => setJustSaved(false), 2000);
  };

  return (
    <Card variant="default" density="normal" className="stagger-item space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Lightbulb size={14} className="text-[var(--text-muted)]" aria-hidden />
        <span className="eyebrow-mono">Key takeaways</span>
        {bullets.length > 0 ? (
          <Tag tone="mono" size="sm">
            {bullets.length}/{MAX_TAKEAWAYS}
          </Tag>
        ) : null}
      </div>
      <Field
        label="One insight per line"
        hint={`Add 1–${MAX_TAKEAWAYS} bullets you want to remember.`}
        error={error ?? undefined}
      >
        {(id) => (
          <Textarea
            id={id}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setError(null);
            }}
            disabled={disabled}
            rows={5}
            placeholder={"First takeaway…\nSecond takeaway…"}
            invalid={Boolean(error)}
          />
        )}
      </Field>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="font-mono text-xs text-[var(--text-muted)] tabular-nums">
          {bullets.length === 0
            ? "No takeaways yet"
            : `${bullets.length} takeaway${bullets.length === 1 ? "" : "s"}`}
          {bullets.length > MAX_TAKEAWAYS && ` · max ${MAX_TAKEAWAYS}`}
        </span>
        <Button onClick={handleSave} disabled={!canSave} className="w-full sm:w-auto">
          {justSaved ? "Saved" : "Save takeaways"}
        </Button>
      </div>
    </Card>
  );
}
