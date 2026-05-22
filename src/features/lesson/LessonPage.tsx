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
    return <div className="p-8 text-[var(--text-muted)]">Loading lesson…</div>;
  }

  if (!subject || !node) {
    return (
      <div className="p-8">
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
      <div className={cn("mx-auto max-w-3xl space-y-6 p-4 md:p-8", focusMode && "pt-2")}>
        {!focusMode && (
          <Link
            to={`/subjects/${subject.id}`}
            className="inline-flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
          >
            <ArrowLeft size={16} />
            {subject.name}
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
            className="font-bold tracking-tight text-[var(--text-heading)]"
            style={{ fontSize: focusMode ? 32 : 28 }}
          >
            {node.name}
          </h1>
          <p className="text-[var(--text-muted)] leading-relaxed">{node.description}</p>
        </header>

        {node.whyItMatters && (
          <Card className="stagger-item border-[var(--accent)]/20">
            <div className="mb-2 flex items-center gap-2 text-[var(--accent)]">
              <Sparkles size={16} />
              <span className="text-sm font-medium">Why it matters</span>
            </div>
            <p className="text-sm leading-relaxed">{node.whyItMatters}</p>
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
            <ul className="space-y-2 pl-4">
              {node.keyConcepts.map((c) => (
                <li key={c} className="text-sm text-[var(--text)]">
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
            <div className="grid gap-3">
              {node.resources.map((r) => (
                <ResourceCard key={r.url} resource={r} />
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

        <Card className="stagger-item flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-[var(--text-heading)]">Ready to test recall?</p>
            <p className="text-sm text-[var(--text-muted)]">
              {node.quiz?.length ?? 0} questions · {node.xpValue} XP on complete
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to={`/subjects/${subject.id}/${node.id}/notes`}>
              <Button variant="secondary">
                <FileText size={16} />
                Notes
              </Button>
            </Link>
            {(node.quiz?.length ?? 0) > 0 && !isLocked && (
              <Link to={`/subjects/${subject.id}/${node.id}/quiz`}>
                <Button variant="secondary">Take quiz</Button>
              </Link>
            )}
            {!isLocked && !isCompleted && (
              <Button onClick={handleComplete}>Mark complete</Button>
            )}
            {focusMode && (
              <Button variant="ghost" onClick={toggleFocusMode}>
                Exit focus
              </Button>
            )}
          </div>
        </Card>
      </div>
    </FocusShell>
  );
}
