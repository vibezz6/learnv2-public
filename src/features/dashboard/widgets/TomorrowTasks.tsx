import { Link } from "react-router-dom";
import { ArrowRight, CalendarClock } from "lucide-react";
import { Card } from "@/components/ui";
import type { Subject } from "@/curriculum/types";
import { buildTomorrowTasks } from "@/lib/tomorrowTasks";
import { usePreferences } from "@/stores/preferences";
import { useProgress } from "@/stores/progress";

interface Props {
  subjects: Subject[];
}

const SOURCE_LABELS = {
  college: "College",
  review: "Review",
  sat: "SAT",
  pretest: "Diagnostic",
} as const;

export function TomorrowTasks({ subjects }: Props) {
  const placementGoal = usePreferences((s) => s.placementGoal);
  const getNodeStatus = useProgress((s) => s.getNodeStatus);
  const getNodesNeedingReview = useProgress((s) => s.getNodesNeedingReview);

  const reviewDue = subjects.length ? getNodesNeedingReview(subjects).length : 0;
  const tasks = buildTomorrowTasks({
    subjects,
    getNodeStatus,
    reviewDueCount: reviewDue,
    placementGoal,
  });

  if (tasks.length === 0) return null;

  return (
    <Card variant="quiet" className="min-w-0 p-5">
      <div className="flex items-start gap-3">
        <CalendarClock size={16} className="mt-0.5 shrink-0 text-[var(--accent-2)]" aria-hidden />
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--text-muted)]">
              Tomorrow
            </p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Up to three realistic next steps after work — college, review, SAT, or diagnostic.
            </p>
          </div>
          <ul className="divide-y divide-[var(--border)]">
            {tasks.map((task) => (
              <li key={task.id}>
                <Link
                  to={task.href}
                  className="group flex min-h-11 items-center justify-between gap-2 py-2.5 touch-manipulation"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-[var(--text-heading)] group-hover:text-[var(--accent-2)]">
                      {task.title}
                    </span>
                    <span className="mt-0.5 block text-xs text-[var(--text-muted)]">
                      {SOURCE_LABELS[task.source]}
                      {task.detail ? ` · ${task.detail}` : ""}
                    </span>
                  </span>
                  <ArrowRight
                    size={14}
                    className="shrink-0 text-[var(--text-muted)] group-hover:text-[var(--accent-2)]"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
