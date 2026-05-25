import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, Brain } from "lucide-react";
import {
  Button,
  Card,
  EmptyState,
  PageContainer,
  PageHeader,
  PageLoading,
  Section,
} from "@/components/ui";
import { loadAllSubjects } from "@/curriculum/loader";
import type { Subject } from "@/curriculum/types";
import { usePreferences } from "@/stores/preferences";
import { useProgress } from "@/stores/progress";
import { DEFAULT_TRACK_ID } from "@/lib/campusHome";
import { getTrackChallengeCategory } from "@/lib/coursework";
import { shouldShowSatTodayCard } from "@/lib/satDailyStudy";
import { subjectToChallengeCategory } from "@/lib/subjectProgress";
import { ContinueHero } from "./widgets/ContinueHero";
import { DailyChallengeCompact } from "./widgets/DailyChallengeCompact";
import { DailyGoalStrip } from "./widgets/DailyGoalStrip";
import { SatTodayCard } from "./widgets/SatTodayCard";
import { RecentStudyStrip } from "./widgets/RecentStudyStrip";
import { WeekPlanCard } from "./widgets/WeekPlanCard";

export function DashboardPage() {
  const getContinueTarget = useProgress((s) => s.getContinueTarget);
  const getStats = useProgress((s) => s.getStats);
  const getNodesNeedingReview = useProgress((s) => s.getNodesNeedingReview);
  const getDailyReviewCount = useProgress((s) => s.getDailyReviewCount);
  const getNextScheduledReview = useProgress((s) => s.getNextScheduledReview);
  const getNodeStatus = useProgress((s) => s.getNodeStatus);
  const placementGoal = usePreferences((s) => s.placementGoal);
  const enrolledTrackId = usePreferences((s) => s.enrolledTrackId);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);

  useEffect(() => {
    loadAllSubjects().then((loaded) => {
      setSubjects(loaded);
      setLoadingSubjects(false);
    });
  }, []);

  const target = subjects.length ? getContinueTarget(subjects) : null;
  const stats = subjects.length ? getStats(subjects) : null;
  const reviewDue = subjects.length ? getNodesNeedingReview(subjects).length : 0;
  const reviewedToday = getDailyReviewCount();
  const nextReview = getNextScheduledReview();
  const activeTrackId = enrolledTrackId ?? DEFAULT_TRACK_ID;
  const challengeCategory =
    getTrackChallengeCategory(activeTrackId) ??
    (target ? subjectToChallengeCategory(target.subject.id) : null);

  const showSatFocus =
    !target &&
    subjects.length > 0 &&
    shouldShowSatTodayCard(placementGoal, subjects, getNodeStatus);

  const showSpacedReview =
    reviewDue > 0 ||
    (nextReview !== null && typeof nextReview.daysUntil === "number" && nextReview.daysUntil <= 2);

  if (loadingSubjects) {
    return <PageLoading />;
  }

  return (
    <PageContainer className="space-y-8">
      <div className="space-y-4 border-b border-[var(--border)] pb-6">
        <PageHeader
          title="Today"
          subtitle="Your next lesson, this week&apos;s plan, and college deadlines."
          divider={false}
        />
        {stats && <DailyGoalStrip stats={stats} />}
        {subjects.length > 0 && <RecentStudyStrip subjects={subjects} />}
      </div>

      <Section eyebrow="Today's focus">
        {target ? (
          <ContinueHero subject={target.subject} node={target.node} />
        ) : showSatFocus ? (
          <SatTodayCard subjects={subjects} compact />
        ) : (
          <Card variant="primary">
            <EmptyState
              icon={<span aria-hidden>◎</span>}
              title="No lesson in progress"
              description="Import v1 progress in Settings, or pick a subject to start your first lesson."
              actionLabel="Browse subjects"
              actionTo="/subjects"
            />
          </Card>
        )}
      </Section>

      <Section
        eyebrow="This week"
        title="Track, deadlines, and SAT follow-ups"
      >
        <WeekPlanCard subjects={subjects} embedded />
      </Section>

      {showSpacedReview && (
        <Section eyebrow="Spaced review">
        <Card variant="quiet" className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Brain size={16} className="mt-0.5 shrink-0 text-[var(--text-muted)]" />
            <div>
              <p className="text-sm font-medium text-[var(--text-heading)]">Spaced review</p>
              {reviewDue > 0 ? (
                <p className="mt-0.5 text-sm text-[var(--text-muted)]">
                  <span className="font-mono tabular-nums text-[var(--text-heading)]">{reviewDue}</span>{" "}
                  due
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
        </Section>
      )}

      <Section eyebrow="Daily challenge">
        <DailyChallengeCompact defaultCategory={challengeCategory} />
      </Section>

      <p className="text-[11px] text-[var(--text-muted)]">
        <kbd className="rounded border border-[var(--border)] px-1 py-0.5 font-mono">F</kbd> focus ·{" "}
        <kbd className="rounded border border-[var(--border)] px-1 py-0.5 font-mono">⌘K</kbd> search ·{" "}
        <Link to="/stats" className="text-[var(--accent-2)] hover:underline">
          <BarChart3 size={12} className="mr-0.5 inline" aria-hidden />
          Stats
        </Link>
      </p>
    </PageContainer>
  );
}
