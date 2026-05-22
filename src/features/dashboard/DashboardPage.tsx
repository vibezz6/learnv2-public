import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Brain, Sparkles, Target } from "lucide-react";
import { Badge, Button, Card } from "@/components/ui";
import { loadAllSubjects } from "@/curriculum/loader";
import type { Subject } from "@/curriculum/types";
import { useProgress } from "@/stores/progress";
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
    <div className="mx-auto max-w-5xl space-y-6 p-4 pb-24 md:p-8 md:pb-8">
      <section className="stagger-item space-y-2">
        <Badge>v2.0.0</Badge>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-heading)]">
          Neural Command Center
        </h1>
        {stats && (
          <p className="text-[var(--text-muted)]">
            Level {stats.level} · {stats.completedNodes}/{stats.totalNodes} lessons · {stats.totalXp} XP
            {stats.streakCurrent > 0 && ` · ${stats.streakCurrent} day streak`}
          </p>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card glow className="stagger-item md:col-span-2">
          <div className="mb-3 flex items-center gap-2 text-[var(--accent)]">
            <Target size={18} />
            <span className="font-medium">Today</span>
          </div>
          {target ? (
            <>
              <h2 className="text-xl font-semibold text-[var(--text-heading)]">{target.node.name}</h2>
              <p className="mt-2 text-sm text-[var(--text-muted)]">{target.subject.name}</p>
              <Link
                to={`/subjects/${target.subject.id}/${target.node.id}`}
                className="mt-4 inline-block"
              >
                <Button>
                  Open lesson
                  <ArrowRight size={16} />
                </Button>
              </Link>
            </>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">
              Import v1 progress in Settings, or start from Subjects.
            </p>
          )}
        </Card>

        <Card className="stagger-item">
          <div className="mb-3 flex items-center gap-2 text-[var(--accent-2)]">
            <Brain size={18} />
            <span className="font-medium">Review</span>
          </div>
          {reviewDue > 0 ? (
            <>
              <p className="text-2xl font-bold text-[var(--text-heading)]">{reviewDue}</p>
              <p className="text-sm text-[var(--text-muted)]">
                lessons due · {reviewedToday} reviewed today
              </p>
              <Link to="/review" className="mt-4 inline-block">
                <Button variant="secondary">
                  Open review queue
                  <ArrowRight size={16} />
                </Button>
              </Link>
            </>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">
              No reviews due. Complete lessons to start spaced repetition.
            </p>
          )}
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="stagger-item">
          <DailyChallengeWidget />
        </div>
        {subjects.length > 0 && (
          <div className="stagger-item">
            <TrackRecommendation subjects={subjects} />
          </div>
        )}
      </section>

      {stats && stats.completedNodes > 0 && (
        <section className="stagger-item">
          <Card>
            <StreakCalendar dailyMinutes={stats.dailyMinutes} />
          </Card>
        </section>
      )}

      {subjects.length > 0 && (
        <section className="stagger-item">
          <EulerQuizMastery subjects={subjects} />
        </section>
      )}

      {stats && (
        <section className="stagger-item">
          <MathInspiredSection completedNodes={stats.completedNodes} totalNodes={stats.totalNodes} />
        </section>
      )}

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
