import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, CircleDashed, TimerReset } from "lucide-react";
import { Button, Card, Tag } from "@/components/ui";
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
import { cn } from "@/lib/cn";

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

  const totalMinutes = plan.steps.reduce((sum, step) => sum + step.minutes, 0);
  const sessionStepStatus = (stepId: string) => {
    if (!session) return "idle" as const;
    const step = session.steps.find((s) => s.id === stepId);
    if (!step) return "idle" as const;
    if (step.completedAt) return "done" as const;
    if (session.activeStepId === step.id) return "active" as const;
    return "queued" as const;
  };

  return (
    <Card variant="default" density="normal" className="min-w-0">
      <div className="flex flex-col gap-3 border-b border-[var(--rule)] pb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <TimerReset size={14} aria-hidden className="text-[var(--text-muted)]" />
            <p className="eyebrow-mono">Next session · {totalMinutes}m</p>
          </div>
          <h3 className="mt-2 text-base font-semibold tracking-tight text-[var(--text-heading)]">
            {plan.title}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-[var(--text-muted)]">
            {plan.rationale}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link to={plan.primaryHref} className="min-w-0 flex-1 sm:flex-none">
            <Button size="sm" className="w-full sm:w-auto">
              <span className="truncate">{plan.primaryLabel}</span>
              <ArrowRight size={13} aria-hidden className="shrink-0" />
            </Button>
          </Link>
          {!session || session.completedAt ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSession(startStudySession(plan))}
            >
              Start guided
            </Button>
          ) : null}
        </div>
      </div>

      <ol className="mt-4 space-y-2">
        {plan.steps.map((step, index) => {
          const stepStatus = sessionStepStatus(step.id);
          return (
            <li key={step.id}>
              <div
                className={cn(
                  "flex items-start gap-3 rounded-[var(--radius)] border px-3 py-2.5",
                  stepStatus === "done"
                    ? "border-[var(--success-border)] bg-[var(--success-bg)]"
                    : stepStatus === "active"
                      ? "border-[var(--accent-border)] bg-[var(--accent-bg)]"
                      : "border-[var(--rule)] bg-[var(--bg-sunken)]",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[var(--radius-sm)] font-mono text-[11px] font-medium tabular-nums",
                    stepStatus === "done"
                      ? "bg-[var(--success)] text-[#0e1a13]"
                      : stepStatus === "active"
                        ? "bg-[var(--accent)] text-[var(--accent-fg)]"
                        : "border border-[var(--rule)] bg-[var(--bg-panel)] text-[var(--text-muted)]",
                  )}
                >
                  {stepStatus === "done" ? (
                    <Check size={11} />
                  ) : stepStatus === "active" ? (
                    <CircleDashed size={11} />
                  ) : (
                    String(index + 1).padStart(2, "0")
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p
                      className={cn(
                        "min-w-0 truncate text-sm font-medium",
                        stepStatus === "done"
                          ? "text-[var(--text-muted)] line-through"
                          : "text-[var(--text-heading)]",
                      )}
                    >
                      {step.title}
                    </p>
                    <Tag tone="mono" size="sm">
                      {step.minutes}m
                    </Tag>
                  </div>
                  <p className="mt-0.5 text-xs leading-relaxed text-[var(--text-muted)]">
                    {step.detail}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <Link
                      to={step.href}
                      className="inline-flex min-h-7 items-center gap-1 text-xs font-medium text-[var(--accent)] hover:underline"
                    >
                      {step.ctaLabel}
                      <ArrowRight size={11} aria-hidden />
                    </Link>
                    {session && !session.completedAt && stepStatus !== "done" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSession(completeStudySessionStep(step.id))}
                      >
                        Mark done
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {session?.completedAt ? (
        <p className="mt-3 rounded-[var(--radius)] border border-[var(--success-border)] bg-[var(--success-bg)] px-3 py-2 text-xs text-[var(--success-fg)]">
          Guided block complete. Minutes added to local activity.
        </p>
      ) : null}
    </Card>
  );
}
