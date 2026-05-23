import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Brain } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { loadAllSubjects } from "@/curriculum/loader";
import type { Subject } from "@/curriculum/types";
import { useProgress } from "@/stores/progress";
import { formatAppVersion } from "@/lib/version";
import { subjectToChallengeCategory } from "@/lib/subjectProgress";
import { ContinueHero } from "./widgets/ContinueHero";
import { DailyChallengeWidget } from "./widgets/DailyChallengeWidget";
import { DailyGoalStrip } from "./widgets/DailyGoalStrip";
import { EulerQuizMastery } from "./widgets/EulerQuizMastery";
import { MathInspiredSection } from "./widgets/MathInspiredSection";
import { StreakCalendar } from "./widgets/StreakCalendar";
import { TrackRecommendation } from "./widgets/TrackRecommendation";

export function DashboardPage() {
  const getContinueTarget = useProgress((s) => s.getContinueTarget);
  const getStats = useProgress((s) => s.getStats);
  const getNodesNeedingReview = useProgress((s) => s.getNodesNeedingReview);
  const getDailyReviewCount = useProgress((s) => s.getDailyReviewCount);
  const getNextScheduledReview = useProgress((s) => s.getNextScheduledReview);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    loadAllSubjects().then(setSubjects);
  }, []);

  const target = subjects.length ? getContinueTarget(subjects) : null;
  const stats = subjects.length ? getStats(subjects) : null;
  const reviewDue = subjects.length ? getNodesNeedingReview(subjects).length : 0;
  const reviewedToday = getDailyReviewCount();
  const nextReview = getNextScheduledReview();
  const challengeCategory = target
    ? subjectToChallengeCategory(target.subject.id)
    : null;

  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl space-y-10 overflow-x-hidden px-3 py-4 pb-24 sm:px-4 md:p-8 md:pb-8">
      <header className="space-y-4 border-b border-[var(--border)] pb-6">
        <div className="space-y-2">
          <p className="font-mono text-[11px] uppercase tracking-widest text-[var(--text-muted)]">
            {formatAppVersion()}
          </p>
          <h1 className="text-[clamp(1.75rem,5vw,2.625rem)] font-semibold tracking-tight text-[var(--text-heading)]">
            Dashboard
          </h1>
          {stats && (
            <p className="text-sm text-[var(--text-muted)]">
              {stats.completedNodes}/{stats.totalNodes} lessons · {stats.totalXp} XP
            </p>
          )}
        </div>
        {stats && <DailyGoalStrip stats={stats} />}
      </header>

      {/* Primary — continue hero */}
      <section>
        {target ? (
          <ContinueHero subject={target.subject} node={target.node} />
        ) : (
          <Card variant="primary" className="p-6 md:p-8">
            <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--accent)]">
              Continue learning
            </p>
            <p className="mt-3 text-sm text-[var(--text-muted)]">
              Import v1 progress in Settings, or pick a subject to start.
            </p>
            <Link to="/subjects" className="mt-5 inline-block">
              <Button>Browse subjects</Button>
            </Link>
          </Card>
        )}
      </section>

      {/* Secondary — daily challenge + track */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DailyChallengeWidget defaultCategory={challengeCategory} />
        {subjects.length > 0 && <TrackRecommendation subjects={subjects} />}
      </section>

      {(reviewDue > 0 || nextReview) && (
        <section>
          <Card variant="quiet" className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Brain size={16} className="mt-0.5 shrink-0 text-[var(--text-muted)]" />
              <div>
                <p className="text-sm font-medium text-[var(--text-heading)]">Spaced review</p>
                {reviewDue > 0 ? (
                  <p className="mt-0.5 text-sm text-[var(--text-muted)]">
                    <span className="font-mono tabular-nums text-[var(--text-heading)]">{reviewDue}</span> due
                    {reviewedToday > 0 && ` · ${reviewedToday} done today`}
                  </p>
                ) : nextReview ? (
                  <p className="mt-0.5 text-sm text-[var(--text-muted)]">
                    Next review in{" "}
                    <span className="font-mono tabular-nums text-[var(--text-heading)]">
                      {nextReview.daysUntil}
                    </span>{" "}
                    {nextReview.daysUntil === 1 ? "day" : "days"}
                  </p>
                ) : null}
              </div>
            </div>
            {reviewDue > 0 && (
              <Link to="/review" className="shrink-0">
                <Button variant="secondary" className="min-h-10 w-full sm:w-auto">
                  Review
                  <ArrowRight size={14} />
                </Button>
              </Link>
            )}
          </Card>
        </section>
      )}

      {/* Stats — only when there is activity */}
      {stats && stats.completedNodes > 0 && (
        <section className="space-y-4">
          <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--text-muted)]">
            Activity
          </p>
          <Card variant="quiet">
            <StreakCalendar dailyMinutes={stats.dailyMinutes} />
          </Card>
        </section>
      )}

      {subjects.length > 0 && (
        <section className="space-y-4">
          <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--text-muted)]">
            Mastery
          </p>
          <EulerQuizMastery subjects={subjects} />
        </section>
      )}

      {stats && (
        <section>
          <MathInspiredSection completedNodes={stats.completedNodes} totalNodes={stats.totalNodes} />
        </section>
      )}

      <p className="text-[11px] text-[var(--text-muted)]">
        <kbd className="rounded border border-[var(--border)] px-1 py-0.5 font-mono">F</kbd> focus ·{" "}
        <kbd className="rounded border border-[var(--border)] px-1 py-0.5 font-mono">⌘K</kbd> search
      </p>
    </div>
  );
}
