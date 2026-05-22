import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BookOpen, CheckCircle2, FileText, Lock, Sparkles } from "lucide-react";
import { Badge, Button, Card, FocusShell } from "@/components/ui";
import { loadSubject, getNode } from "@/curriculum/loader";
import type { SkillNode, Subject } from "@/curriculum/types";
import { ResourceCard } from "@/features/lesson/ResourceCard";
import { CollapsibleSection, WorkedExampleCard } from "@/features/lesson/LessonSections";
import { usePreferences } from "@/stores/preferences";
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
          "mx-auto w-full min-w-0 max-w-3xl space-y-5 overflow-x-hidden px-3 py-4 sm:space-y-6 sm:p-4 md:p-8",
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

        <header className="stagger-item space-y-3">
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
              focusMode ? "text-[clamp(1.5rem,6vw,2rem)]" : "text-[clamp(1.375rem,5.5vw,1.75rem)]",
            )}
          >
            {node.name}
          </h1>
          <p className="break-words text-[var(--text-muted)] leading-relaxed">{node.description}</p>
        </header>

        {node.whyItMatters && (
          <Card className="stagger-item border-[var(--accent)]/20">
            <div className="mb-2 flex items-center gap-2 text-[var(--accent)]">
              <Sparkles size={16} />
              <span className="text-sm font-medium">Why it matters</span>
            </div>
            <p className="break-words text-sm leading-relaxed">{node.whyItMatters}</p>
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

        <Card className="stagger-item flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="font-medium text-[var(--text-heading)]">Ready to test recall?</p>
            <p className="text-sm text-[var(--text-muted)]">
              {node.quiz?.length ?? 0} questions · {node.xpValue} XP on complete
            </p>
          </div>
          <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
            <Link to={`/subjects/${subject.id}/${node.id}/notes`} className="w-full sm:w-auto">
              <Button variant="secondary" className="min-h-11 w-full sm:w-auto">
                <FileText size={16} />
                Notes
              </Button>
            </Link>
            {(node.quiz?.length ?? 0) > 0 && !isLocked && (
              <Link to={`/subjects/${subject.id}/${node.id}/quiz`} className="w-full sm:w-auto">
                <Button variant="secondary" className="min-h-11 w-full sm:w-auto">
                  Take quiz
                </Button>
              </Link>
            )}
            {!isLocked && !isCompleted && (
              <Button onClick={handleComplete} className="min-h-11 w-full sm:w-auto">
                Mark complete
              </Button>
            )}
            {focusMode && (
              <Button variant="ghost" onClick={toggleFocusMode} className="min-h-11 w-full sm:w-auto">
                Exit focus
              </Button>
            )}
          </div>
        </Card>
      </div>
    </FocusShell>
  );
}
