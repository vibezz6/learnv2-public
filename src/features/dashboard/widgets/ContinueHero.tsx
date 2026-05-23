import { Link } from "react-router-dom";
import { ArrowRight, Clock } from "lucide-react";
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
      <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--accent)]">
        Continue learning
      </p>

      <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1 space-y-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--text-heading)] md:text-[1.75rem]">
              {node.name}
            </h2>
            <p className="mt-1.5 text-sm text-[var(--text-muted)]">{subject.name}</p>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--text-muted)]">
            <span className="font-mono tabular-nums">
              Lesson {lessonIndex} of {subject.nodes.length}
            </span>
            {node.estimatedMinutes > 0 && (
              <span className="inline-flex items-center gap-1">
                <Clock size={12} aria-hidden />
                ~{node.estimatedMinutes} min
              </span>
            )}
            <span className="text-[var(--accent-2)]">+{node.xpValue} XP</span>
            {started && status !== "completed" && (
              <span className="text-[var(--accent)]">In progress</span>
            )}
          </div>

          <div className="max-w-md space-y-1.5">
            <div className="flex items-baseline justify-between text-[11px] text-[var(--text-muted)]">
              <span>{subject.name} progress</span>
              <span className="font-mono tabular-nums">{subjectPct}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--border)]">
              <div
                className="h-full rounded-full"
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
