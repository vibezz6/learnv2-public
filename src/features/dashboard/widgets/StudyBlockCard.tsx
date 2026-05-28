import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, TimerReset } from "lucide-react";
import { Button, Card } from "@/components/ui";
import type { Subject } from "@/curriculum/types";
import { ADMISSIONS_UPDATED_EVENT } from "@/lib/admissionsSync";
import { buildStudyBlockPlan } from "@/lib/studyBlockPlan";
import {
  completeStudySessionStep,
  loadStudySession,
  startStudySession,
  type StudySessionState,
} from "@/lib/studySession";
import { usePreferences } from "@/stores/preferences";
import { useProgress } from "@/stores/progress";

interface Props {
  subjects: Subject[];
}

export function StudyBlockCard({ subjects }: Props) {
  const placementGoal = usePreferences((s) => s.placementGoal);
  const getNodeStatus = useProgress((s) => s.getNodeStatus);
  const [revision, setRevision] = useState(0);
  const [session, setSession] = useState<StudySessionState | null>(() => loadStudySession());

  useEffect(() => {
    const bump = () => setRevision((r) => r + 1);
    window.addEventListener(ADMISSIONS_UPDATED_EVENT, bump);
    return () => window.removeEventListener(ADMISSIONS_UPDATED_EVENT, bump);
  }, []);

  const plan = useMemo(() => {
    void revision;
    return buildStudyBlockPlan({
      subjects,
      getNodeStatus,
      placementGoal,
    });
  }, [subjects, getNodeStatus, placementGoal, revision]);

  if (subjects.length === 0) return null;

  return (
    <Card variant="quiet" className="min-w-0 p-5">
      <div className="flex items-start gap-3">
        <TimerReset size={16} className="mt-0.5 shrink-0 text-[var(--accent-2)]" aria-hidden />
        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-col gap-3 min-[720px]:flex-row min-[720px]:items-start min-[720px]:justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--accent-2)]">
                Next study block
              </p>
              <p className="mt-1 text-sm font-medium text-[var(--text-heading)]">{plan.title}</p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">{plan.rationale}</p>
            </div>
            <Link to={plan.primaryHref} className="shrink-0">
              <Button className="min-h-10 w-full touch-manipulation min-[720px]:w-auto">
                {plan.primaryLabel}
                <ArrowRight size={14} />
              </Button>
            </Link>
            <Button
              variant="secondary"
              className="min-h-10 w-full touch-manipulation min-[720px]:w-auto"
              onClick={() => setSession(startStudySession(plan))}
            >
              Start guided block
            </Button>
          </div>
          {session && !session.completedAt ? (
            <div className="rounded-[var(--radius)] border border-[var(--accent-border)] bg-[var(--accent-bg)] p-3">
              <p className="text-xs font-medium uppercase tracking-widest text-[var(--accent)]">
                Guided session active
              </p>
              <div className="mt-2 space-y-2">
                {session.steps.map((step) => (
                  <div key={step.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className={step.completedAt ? "text-[var(--text-muted)] line-through" : "text-[var(--text-heading)]"}>
                      {step.title} · {step.minutes}m
                    </span>
                    {!step.completedAt && (
                      <Button
                        variant={session.activeStepId === step.id ? "primary" : "secondary"}
                        className="min-h-8 px-3 text-xs"
                        onClick={() => setSession(completeStudySessionStep(step.id))}
                      >
                        Mark done
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : session?.completedAt ? (
            <p className="rounded-[var(--radius)] border border-[var(--success)]/30 bg-[var(--success)]/10 p-3 text-sm text-[var(--text-heading)]">
              Guided block complete. Nice. The minutes were added to local activity.
            </p>
          ) : null}
          <ol className="grid gap-2 min-[720px]:grid-cols-2">
            {plan.steps.map((step, index) => (
              <li
                key={step.id}
                className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elevated)]/65 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--text-heading)]">
                      {index + 1}. {step.title}
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">{step.detail}</p>
                  </div>
                  <span className="shrink-0 rounded-full border border-[var(--border)] px-2 py-1 font-mono text-[11px] text-[var(--text-muted)]">
                    {step.minutes}m
                  </span>
                </div>
                <Link
                  to={step.href}
                  className="mt-2 inline-flex min-h-8 items-center gap-1 text-xs font-medium text-[var(--accent-2)] hover:underline"
                >
                  {step.ctaLabel}
                  <ArrowRight size={12} aria-hidden />
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Card>
  );
}
