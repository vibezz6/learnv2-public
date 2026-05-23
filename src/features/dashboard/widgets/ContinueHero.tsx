import { Link } from "react-router-dom";
import { ArrowRight, Clock, Target } from "lucide-react";
import { Button, Card } from "@/components/ui";
import type { SkillNode, Subject } from "@/curriculum/types";
import { useProgress } from "@/stores/progress";

interface Props {
  subject: Subject;
  node: SkillNode;
}

export function ContinueHero({ subject, node }: Props) {
  const getNodeStatus = useProgress((s) => s.getNodeStatus);
  const getNodeProgress = useProgress((s) => s.getNodeProgress);

  const completedInSubject = subject.nodes.filter(
    (n) => getNodeStatus(n) === "completed",
  ).length;
  const subjectPct =
    subject.nodes.length > 0
      ? Math.round((completedInSubject / subject.nodes.length) * 100)
      : 0;
  const lessonIndex = subject.nodes.findIndex((n) => n.id === node.id) + 1;
  const started = Boolean(getNodeProgress(node.id).startedAt);
  const status = getNodeStatus(node);

  return (
    <Card variant="primary" className="p-6 md:p-8">
      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-widest text-[var(--text-muted)]">
        <Target size={12} className="text-[var(--accent)]" aria-hidden />
        <span>Today&apos;s focus</span>
      </div>

      <div className="mt-5 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1 space-y-5">
          <div>
            <h2 className="text-[clamp(1.5rem,4vw,2rem)] font-semibold leading-tight tracking-tight text-[var(--text-heading)]">
              {node.name}
            </h2>
            <p className="mt-2 text-sm text-[var(--text-muted)]">{subject.name}</p>
            <p className="mt-3 font-mono text-lg font-medium tabular-nums text-[var(--text-heading)]">
              +{node.xpValue} XP
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[var(--text-muted)]">
            <span className="font-mono tabular-nums">
              Lesson {lessonIndex} of {subject.nodes.length}
            </span>
            {node.estimatedMinutes > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Clock size={12} aria-hidden />
                ~{node.estimatedMinutes} min
              </span>
            )}
            {started && status !== "completed" && (
              <span className="text-[var(--text-muted)]">In progress</span>
            )}
          </div>

          <div className="max-w-md space-y-2">
            <div className="flex items-baseline justify-between text-[11px] text-[var(--text-muted)]">
              <span>{subject.name}</span>
              <span className="font-mono tabular-nums">{subjectPct}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-[var(--border)]">
              <div
                className="h-full rounded-full transition-[width]"
                style={{ width: `${subjectPct}%`, background: subject.color }}
              />
            </div>
          </div>
        </div>

        <Link
          to={`/subjects/${subject.id}/${node.id}`}
          className="w-full shrink-0 lg:w-auto"
        >
          <Button className="min-h-12 w-full px-8 text-base lg:w-auto">
            {started && status !== "completed" ? "Resume" : "Start lesson"}
            <ArrowRight size={16} />
          </Button>
        </Link>
      </div>
    </Card>
  );
}
