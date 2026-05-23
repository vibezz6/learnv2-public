import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Brain, Sparkles, Target } from "lucide-react";
import { Badge, Button, Card } from "@/components/ui";
import { loadAllSubjects } from "@/curriculum/loader";
import type { Subject } from "@/curriculum/types";
import { useProgress } from "@/stores/progress";
import { formatAppVersion } from "@/lib/version";
import { DailyChallengeWidget } from "./widgets/DailyChallengeWidget";
import { EulerQuizMastery } from "./widgets/EulerQuizMastery";
import { MathInspiredSection } from "./widgets/MathInspiredSection";
import { StreakCalendar } from "./widgets/StreakCalendar";
import { TrackRecommendation } from "./widgets/TrackRecommendation";

export function DashboardPage() {
  const getContinueTarget = useProgress((s) => s.getContinueTarget);
  const getStats = useProgress((s) => s.getStats);
  const getNodesNeedingReview = useProgress((s) => s.getNodesNeedingReview);
  const getDailyReviewCount = useProgress((s) => s.getDailyReviewCount);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    loadAllSubjects().then(setSubjects);
  }, []);

  const target = subjects.length ? getContinueTarget(subjects) : null;
  const stats = subjects.length ? getStats(subjects) : null;
  const reviewDue = subjects.length ? getNodesNeedingReview(subjects).length : 0;
  const reviewedToday = getDailyReviewCount();

  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl space-y-6 overflow-x-hidden px-3 py-4 pb-24 sm:px-4 md:space-y-6 md:p-8 md:pb-8">
      {/* Page header — identity + stats bar */}
      <section className="stagger-item space-y-1.5">
        <Badge>{formatAppVersion()}</Badge>
        <h1 className="break-words text-[clamp(1.5rem,6vw,1.875rem)] font-bold tracking-tight text-[var(--text-heading)]">
          Neural Command Center
        </h1>
        {stats && (
          <p className="break-words text-sm text-[var(--text-muted)]">
            Level {stats.level} · {stats.completedNodes}/{stats.totalNodes} lessons · {stats.totalXp} XP
            {stats.streakCurrent > 0 && ` · ${stats.streakCurrent} day streak`}
          </p>
        )}
      </section>

      {/* Hero — Continue Learning (full-width, dominant) */}
      <section className="stagger-item">
        <Card
          glow
          className="border-l-2 border-l-[var(--accent)] max-[480px]:p-6"
        >
          <div className="mb-3 flex items-center gap-2">
            <Target size={14} className="text-[var(--accent)]" />
            <span className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
              Continue Learning
            </span>
          </div>
          {target ? (
            <div className="flex flex-col gap-4 min-[481px]:flex-row min-[481px]:items-start min-[481px]:justify-between min-[481px]:gap-6">
              <div className="min-w-0 flex-1">
                <h2 className="break-words text-[clamp(1.375rem,5.5vw,1.5rem)] font-bold tracking-tight text-[var(--text-heading)] min-[481px]:text-2xl">
                  {target.node.name}
                </h2>
                <p className="mt-1.5 text-sm font-medium text-[var(--accent-2)]">
                  {target.subject.name}
                </p>
              </div>
              <Link
                to={`/subjects/${target.subject.id}/${target.node.id}`}
                className="w-full min-[481px]:w-auto min-[481px]:shrink-0"
              >
                <Button className="min-h-11 w-full touch-manipulation px-6 py-2.5 text-base min-[481px]:w-auto">
                  Continue
                  <ArrowRight size={16} />
                </Button>
              </Link>
            </div>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">
              Import v1 progress in Settings, or start from Subjects.
            </p>
          )}
        </Card>
      </section>

      {/* Secondary row — review + daily challenge + track (equal weight, calm) */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Review — visible but subdued */}
        <Card className="stagger-item">
          <div className="mb-3 flex items-center gap-2 text-[var(--accent-2)]">
            <Brain size={16} />
            <span className="text-sm font-medium">Review</span>
          </div>
          {reviewDue > 0 ? (
            <>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-2xl font-semibold text-[var(--text-heading)]">
                  {reviewDue}
                </span>
                <span className="text-sm text-[var(--text-muted)]">due</span>
              </div>
              {reviewedToday > 0 && (
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">{reviewedToday} reviewed today</p>
              )}
              <Link to="/review" className="mt-3 block min-[481px]:inline-block">
                <Button variant="secondary" className="min-h-11 w-full touch-manipulation text-sm min-[481px]:w-auto">
                  Start review
                  <ArrowRight size={14} />
                </Button>
              </Link>
            </>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">
              No reviews due.
            </p>
          )}
        </Card>

        <div className="stagger-item">
          <DailyChallengeWidget />
        </div>

        {subjects.length > 0 && (
          <div className="stagger-item">
            <TrackRecommendation subjects={subjects} />
          </div>
        )}
      </section>

      {/* Streak calendar — only once there's data to show */}
      {stats && stats.completedNodes > 0 && (
        <section className="stagger-item">
          <Card>
            <StreakCalendar dailyMinutes={stats.dailyMinutes} />
          </Card>
        </section>
      )}

      {/* Quiz mastery — collapsed by default */}
      {subjects.length > 0 && (
        <section className="stagger-item">
          <EulerQuizMastery subjects={subjects} />
        </section>
      )}

      {/* Math widgets — collapsed by default */}
      {stats && (
        <section className="stagger-item">
          <MathInspiredSection completedNodes={stats.completedNodes} totalNodes={stats.totalNodes} />
        </section>
      )}

      {/* Footer hints */}
      <Card className="stagger-item">
        <div className="mb-2 flex items-center gap-2 text-[var(--accent)]">
          <Sparkles size={16} />
          <span className="text-sm font-medium">Learn v2.0 — daily driver</span>
        </div>
        <p className="text-sm text-[var(--text-muted)]">
          234 lessons · notes · SRS · stats · timer · PWA. Migrate v1 progress in Settings.
        </p>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Press <kbd className="rounded border border-[var(--border)] px-1.5 py-0.5 font-mono text-xs">F</kbd>{" "}
          for focus mode · <kbd className="rounded border border-[var(--border)] px-1.5 py-0.5 font-mono text-xs">⌘K</kbd>{" "}
          to search.
        </p>
      </Card>
    </div>
  );
}
