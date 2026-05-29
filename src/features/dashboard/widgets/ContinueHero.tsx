import { Link } from "react-router-dom";
import { ArrowRight, Clock } from "lucide-react";
import { Button, Card, Meter, Tag } from "@/components/ui";
import type { SkillNode, Subject } from "@/curriculum/types";
import {
  CONTINUE_KIND_LABELS,
  continueHref,
  resolveContinueKind,
  type ContinueKind,
} from "@/lib/continuePresentation";
import { getSubjectAccent } from "@/lib/subjectAccent";
import { useProgress } from "@/stores/progress";

interface Props {
  subject: Subject;
  node: SkillNode;
}

function ctaLabel(kind: ContinueKind, started: boolean, completed: boolean): string {
  if (kind === "quiz") return "Resume quiz";
  if (kind === "notes") return "Continue notes";
  if (started && !completed) return "Resume lesson";
  return "Start lesson";
}

export function ContinueHero({ subject, node }: Props) {
  const kind: ContinueKind = resolveContinueKind(node.id);
  const getNodeStatus = useProgress((s) => s.getNodeStatus);
  const getNodeProgress = useProgress((s) => s.getNodeProgress);

  const completedInSubject = subject.nodes.filter(
    (n) => getNodeStatus(n) === "completed",
  ).length;
  const totalInSubject = subject.nodes.length;
  const subjectPct =
    totalInSubject > 0 ? Math.round((completedInSubject / totalInSubject) * 100) : 0;
  const lessonIndex = subject.nodes.findIndex((n) => n.id === node.id) + 1;
  const started = Boolean(getNodeProgress(node.id).startedAt);
  const status = getNodeStatus(node);
  const completed = status === "completed";

  return (
    <Card variant="primary" density="roomy" className="min-w-0">
      <div className="flex flex-col gap-2 border-b border-[var(--rule)] pb-4">
        <div className="flex items-center gap-2 text-[12px] font-mono text-[var(--text-muted)]">
          <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: getSubjectAccent(subject.id) }} />
          <span>{subject.name}</span>
          <span aria-hidden className="text-[var(--text-subtle)]">/</span>
          <span className="tabular-nums text-[var(--text-muted)]">
            lesson {lessonIndex}/{totalInSubject}
          </span>
        </div>
        <h2 className="text-[clamp(1.5rem,4vw,2rem)] font-semibold leading-tight tracking-tight text-[var(--text-heading)]">
          {node.name}
        </h2>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Tag tone="accent" mono size="sm">
            {CONTINUE_KIND_LABELS[kind]}
          </Tag>
          {completed ? (
            <Tag tone="success" mono size="sm">
              Completed
            </Tag>
          ) : started ? (
            <Tag tone="info" mono size="sm">
              In progress
            </Tag>
          ) : null}
          {node.estimatedMinutes > 0 && (
            <Tag tone="mono" size="sm" className="gap-1">
              <Clock size={10} aria-hidden />
              {node.estimatedMinutes}m
            </Tag>
          )}
          <Tag tone="mono" size="sm">
            +{node.xpValue} XP
          </Tag>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1">
          <Meter
            value={subjectPct}
            label={`${subject.name} progress`}
            hint={`${completedInSubject}/${totalInSubject} · ${subjectPct}%`}
          />
        </div>
        <Link
          to={continueHref(subject.id, node.id, kind)}
          className="w-full shrink-0 sm:w-auto lg:w-auto"
        >
          <Button className="w-full touch-manipulation sm:w-auto">
            {ctaLabel(kind, started, completed)}
            <ArrowRight size={14} aria-hidden />
          </Button>
        </Link>
      </div>
    </Card>
  );
}
