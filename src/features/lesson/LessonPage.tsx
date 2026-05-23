import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, FileText, Lightbulb, Lock, Sparkles } from "lucide-react";
import { Badge, Button, Card, FocusShell } from "@/components/ui";
import { loadSubject, getNode } from "@/curriculum/loader";
import type { SkillNode, Subject } from "@/curriculum/types";
import { ResourceCard } from "@/features/lesson/ResourceCard";
import { CollapsibleSection, WorkedExampleCard } from "@/features/lesson/LessonSections";
import { usePreferences } from "@/stores/preferences";
import {
  getTakeaways,
  MAX_TAKEAWAYS,
  parseTakeaways,
  saveTakeaways,
} from "@/stores/noteSessions";
import { useProgress } from "@/stores/progress";
import { cn } from "@/lib/cn";

export function LessonPage() {
  const { subjectId = "", nodeId = "" } = useParams();
  const { focusMode, toggleFocusMode } = usePreferences();
  const { getNodeStatus, startNode, trackVisit, completeNode } = useProgress();

  const [subject, setSubject] = useState<Subject | null>(null);
  const [node, setNode] = useState<SkillNode | null>(null);
  const [loading, setLoading] = useState(true);

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
    return <div className="px-3 py-4 text-[var(--text-muted)] sm:p-8">Loading lesson…</div>;
  }

  if (!subject || !node) {
    return (
      <div className="px-3 py-4 sm:p-8">
        <p>Lesson not found.</p>
        <Link to="/subjects">
          <Button variant="secondary" className="mt-4">
            Back
          </Button>
        </Link>
      </div>
    );
  }

  const status = getNodeStatus(node);
  const isCompleted = status === "completed";
  const isLocked = status === "locked";

  const handleComplete = () => {
    completeNode(node.id, node.xpValue);
  };

  return (
    <FocusShell active={focusMode}>
      <div
        className={cn(
          "mx-auto w-full min-w-0 max-w-3xl space-y-6 overflow-x-hidden px-3 py-4 sm:p-4 md:space-y-8 md:p-8",
          focusMode && "pt-2",
        )}
      >
        {!focusMode && (
          <Link
            to={`/subjects/${subject.id}`}
            className="-ml-1 inline-flex min-h-11 items-center gap-1 rounded-[var(--radius)] px-1 text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
          >
            <ArrowLeft size={16} />
            <span className="break-words">{subject.name}</span>
          </Link>
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

        {node.whyItMatters && (
          <div
            className="stagger-item rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-elevated)] p-5 [border-left-color:var(--accent)] [border-left-width:3px]"
          >
            <div className="mb-2 flex items-center gap-2 text-[var(--accent)]">
              <Sparkles size={16} />
              <span className="text-sm font-medium uppercase tracking-wider">Why it matters</span>
            </div>
            <p className="break-words text-sm leading-relaxed text-[var(--text)]">{node.whyItMatters}</p>
          </div>
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
            <div className="grid min-w-0 gap-3">
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
        <div className="stagger-item rounded-[var(--radius-lg)] border border-[var(--border-strong)] bg-[var(--bg-elevated)] p-5">
          <div className="mb-4 flex items-center justify-between border-b border-[var(--border)] pb-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
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
                Notes
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
        </div>
      </div>
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
      <div className="flex flex-wrap items-center gap-2 text-[var(--accent)]">
        <Lightbulb size={16} />
        <span className="text-sm font-medium">Key takeaways</span>
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
