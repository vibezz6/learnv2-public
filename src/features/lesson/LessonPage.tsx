import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileText,
  FlaskConical,
  Lightbulb,
  Lock,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  FocusShell,
  PageContainer,
  PageHeader,
  PageLoading,
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
  const { getNodeStatus, startNode, trackVisit, completeNode } = useProgress();

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
        <p>Lesson not found.</p>
        <Link to="/subjects">
          <Button variant="secondary" className="mt-4">
            Back
          </Button>
        </Link>
      </PageContainer>
    );
  }

  const status = getNodeStatus(node);
  const isCompleted = status === "completed";
  const isLocked = status === "locked";
  const tradingLessonIndex = subject.id === "trading" ? getTradingLessonIndex(node.id) : null;
  const showTradingLabCard = tradingLessonIndex !== null && tradingLessonIndex >= 11;

  const handleComplete = () => {
    completeNode(node.id, node.xpValue);
  };

  return (
    <FocusShell active={focusMode}>
      <PageContainer
        size="narrow"
        className={cn("space-y-8 md:space-y-10", focusMode && "pt-2")}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {!focusMode && (
          <PageHeader
            backTo={{ to: `/subjects/${subject.id}`, label: subject.name }}
            divider={false}
          />
        )}

        <header className="stagger-item space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{node.difficulty}</Badge>
            {isCompleted && (
              <span className="inline-flex items-center gap-1 text-sm text-[var(--success)]">
                <CheckCircle2 size={14} /> Completed
              </span>
            )}
            {isLocked && (
              <span className="inline-flex items-center gap-1 text-sm text-[var(--warning)]">
                <Lock size={14} /> Locked
              </span>
            )}
          </div>
          <h1
            className={cn(
              "break-words font-bold tracking-tight text-[var(--text-heading)]",
              focusMode
                ? "text-[clamp(2rem,4vw,2.75rem)] leading-[1.15]"
                : "text-[clamp(1.75rem,3.5vw,2.25rem)] leading-[1.2]",
            )}
          >
            {node.name}
          </h1>
          <p
            className={cn(
              "break-words max-w-[68ch] leading-relaxed text-[var(--text)]",
              focusMode ? "text-lg text-[var(--text-muted)]" : "text-base text-[var(--text-muted)]",
            )}
          >
            {node.description}
          </p>
        </header>

        {showTradingLabCard && (
          <Card variant="quiet" className="stagger-item">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <FlaskConical size={18} className="mt-0.5 shrink-0 text-[var(--text-muted)]" />
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-medium text-[var(--text-heading)]">Open Trading Lab</p>
                  <p className="text-sm text-[var(--text-muted)]">
                    Practice in the sandbox or continue with hands-on Algo Lab modules.
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Link to="/lab/trading">
                  <Button variant="secondary">Trading Lab</Button>
                </Link>
                <Link to="/subjects/algo-lab">
                  <Button variant="secondary">Algo Lab</Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        {node.whyItMatters && (
          <Card variant="quiet" className="stagger-item">
            <div className="mb-3 flex items-center gap-2 text-[var(--text-muted)]">
              <span className="font-mono text-[11px] uppercase tracking-widest">Why it matters</span>
            </div>
            <p className="break-words text-sm leading-relaxed text-[var(--text)]">{node.whyItMatters}</p>
          </Card>
        )}

        {node.keyConcepts.length > 0 && (
          <CollapsibleSection
            id={`${node.id}-concepts`}
            title="Key concepts"
            icon={<BookOpen size={16} />}
            count={node.keyConcepts.length}
            accentColor={subject.color}
          >
            <ul className="min-w-0 space-y-2 pl-4">
              {node.keyConcepts.map((c) => (
                <li key={c} className="break-words text-sm text-[var(--text)]">
                  {c}
                </li>
              ))}
            </ul>
          </CollapsibleSection>
        )}

        {node.resources.length > 0 && (
          <CollapsibleSection
            id={`${node.id}-resources`}
            title="Resources"
            icon={<BookOpen size={16} />}
            count={node.resources.length}
            accentColor={subject.color}
            defaultOpen
          >
            <div className="grid min-w-0 gap-6">
              {node.resources.map((r, i) => (
                <ResourceCard key={r.url} resource={r} nodeId={node.id} resourceIndex={i} />
              ))}
            </div>
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

        <LessonTakeaways nodeId={node.id} subjectId={subject.id} disabled={isLocked} />

        {/* ── Next step bar ── */}
        <Card variant="quiet" className="stagger-item">
          <div className="mb-5 flex items-center justify-between border-b border-[var(--border)] pb-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-[var(--text-muted)]">
                Next step
              </p>
              <p className="mt-0.5 text-sm text-[var(--text-muted)]">
                {(node.quiz?.length ?? 0) > 0
                  ? `${node.quiz!.length} questions · `
                  : ""}
                {node.xpValue} XP on complete
              </p>
            </div>
            {isCompleted && (
              <span className="flex items-center gap-1.5 text-sm font-medium text-[var(--success)]">
                <CheckCircle2 size={15} />
                Completed
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {(node.quiz?.length ?? 0) > 0 && !isLocked && (
              <Link to={`/subjects/${subject.id}/${node.id}/quiz`}>
                <Button className="gap-2">
                  Take quiz
                  <ArrowRight size={15} />
                </Button>
              </Link>
            )}
            <Link to={`/subjects/${subject.id}/${node.id}/notes`}>
              <Button variant="secondary">
                <FileText size={15} />
                Office hours
              </Button>
            </Link>
            {!isLocked && !isCompleted && (
              <Button variant="secondary" onClick={handleComplete}>
                <CheckCircle2 size={15} />
                Mark complete
              </Button>
            )}
            {focusMode && (
              <Button variant="ghost" onClick={toggleFocusMode} className="ml-auto">
                Exit focus
              </Button>
            )}
          </div>
        </Card>
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
    <Card className="stagger-item space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-[var(--text-muted)]">
        <Lightbulb size={16} />
        <span className="font-mono text-[11px] uppercase tracking-widest">Key takeaways</span>
        {bullets.length > 0 && (
          <Badge>
            {bullets.length}/{MAX_TAKEAWAYS}
          </Badge>
        )}
      </div>
      <p className="text-sm text-[var(--text-muted)]">
        One insight per line — add 1 to 5 bullets you want to remember.
      </p>
      <textarea
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          setError(null);
        }}
        disabled={disabled}
        rows={5}
        className="w-full resize-y rounded-[var(--radius)] border border-[var(--border)] bg-transparent p-3 text-sm leading-relaxed text-[var(--text)] outline-none focus:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
        placeholder={"First takeaway…\nSecond takeaway…"}
      />
      {error && <p className="text-sm text-[var(--warning)]">{error}</p>}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-xs text-[var(--text-muted)]">
          {bullets.length === 0
            ? "No takeaways yet"
            : `${bullets.length} takeaway${bullets.length === 1 ? "" : "s"}`}
          {bullets.length > MAX_TAKEAWAYS && ` · max ${MAX_TAKEAWAYS}`}
        </span>
        <Button
          onClick={handleSave}
          disabled={!canSave}
          className="min-h-11 w-full sm:w-auto"
        >
          {justSaved ? "Saved" : "Save takeaways"}
        </Button>
      </div>
    </Card>
  );
}
