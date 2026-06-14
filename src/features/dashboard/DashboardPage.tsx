import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Brain } from "lucide-react";
import {
  Button,
  Card,
  KeyHint,
  PageContainer,
  PageHeader,
  PageLoading,
  Section,
  Tag,
} from "@/components/ui";
import { loadAllSubjects } from "@/curriculum/loader";
import type { Subject } from "@/curriculum/types";
import { usePreferences } from "@/stores/preferences";
import { useProgress } from "@/stores/progress";
import { DEFAULT_TRACK_ID } from "@/lib/campusHome";
import { getTrackChallengeCategory } from "@/lib/coursework";
import { shouldShowSatTodayCard } from "@/lib/satDailyStudy";
import { subjectToChallengeCategory } from "@/lib/subjectProgress";
import { formatAppVersion } from "@/lib/version";
import { buildTodayPriority, shouldShowSecondaryDrill } from "@/lib/todayPriority";
import { ContinueHero } from "./widgets/ContinueHero";
import { DailyChallengeCompact } from "./widgets/DailyChallengeCompact";
import { DrillQueueTodayCard } from "./widgets/DrillQueueTodayCard";
import { RightNowHero } from "./widgets/RightNowHero";
import { PriorityHero } from "./widgets/PriorityHero";
import { TodayMinimumStrip } from "./widgets/TodayMinimumStrip";
import { EssayDueToday, hasEssaysDueSoon } from "./widgets/EssayDueToday";
import { TodayEmptyFocus } from "./widgets/TodayEmptyFocus";
import { WeekPlanCard } from "./widgets/WeekPlanCard";
import { STUDY_INTENT_UPDATED_EVENT } from "@/lib/studyIntent";
import { ROUTES } from "@/app/navigation";
import { StudyIntentPicker } from "./widgets/StudyIntentPicker";
import { useIsSimpleMode } from "@/lib/uiMode";
import { includeSat } from "@/lib/buildFeatures";

export function DashboardPage() {
  const getContinueTarget = useProgress((s) => s.getContinueTarget);
  const getStats = useProgress((s) => s.getStats);
  const getNodesNeedingReview = useProgress((s) => s.getNodesNeedingReview);
  const getDailyReviewCount = useProgress((s) => s.getDailyReviewCount);
  const getNextScheduledReview = useProgress((s) => s.getNextScheduledReview);
  const getNodeStatus = useProgress((s) => s.getNodeStatus);
  const placementGoal = usePreferences((s) => s.placementGoal);
  const enrolledTrackId = usePreferences((s) => s.enrolledTrackId);
  const simpleMode = useIsSimpleMode();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [, setIntentRevision] = useState(0);

  useEffect(() => {
    loadAllSubjects().then((loaded) => {
      setSubjects(loaded);
      setLoadingSubjects(false);
    });
  }, []);

  useEffect(() => {
    const syncIntent = () => setIntentRevision((revision) => revision + 1);
    window.addEventListener(STUDY_INTENT_UPDATED_EVENT, syncIntent);
    return () => window.removeEventListener(STUDY_INTENT_UPDATED_EVENT, syncIntent);
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

  // SAT is the daily driver: when SAT context applies, the SAT command is the
  // single dominant action. An in-progress lesson becomes a "resume" shortcut.
  const showSatFocus =
    subjects.length > 0 && shouldShowSatTodayCard(placementGoal, subjects, getNodeStatus);

  const showSpacedReview =
    reviewDue > 0 ||
    (nextReview !== null && typeof nextReview.daysUntil === "number" && nextReview.daysUntil <= 2);

  if (loadingSubjects) {
    return <PageLoading />;
  }

  const priority = buildTodayPriority({
    subjects,
    getNodeStatus,
    placementGoal,
    continueTarget: target,
    reviewDueCount: reviewDue,
  });
  const pageSubtitle = priority.pageSubtitle;
  const showDrillCard = shouldShowSecondaryDrill(priority);
  const showEssayDue = hasEssaysDueSoon();
  const showSpacedReviewAside =
    showSpacedReview && priority.surface !== "review";

  return (
    <PageContainer size="xl" className="space-y-6">
      <PageHeader title="Today" subtitle={pageSubtitle} divider={false} />
      {!simpleMode ? <StudyIntentPicker /> : null}
      {!simpleMode && stats ? <TodayMinimumStrip stats={stats} /> : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-6">
          <Section eyebrow="Right now" title="Your one move">
            {priority.surface === "college" || priority.surface === "review" || priority.kind === "catch_up" ? (
              <PriorityHero priority={priority} />
            ) : priority.surface === "continue" && target ? (
              <ContinueHero subject={target.subject} node={target.node} />
            ) : showSatFocus ? (
              <RightNowHero subjects={subjects} resume={target} compact={simpleMode} />
            ) : target ? (
              <ContinueHero subject={target.subject} node={target.node} />
            ) : (
              <TodayEmptyFocus />
            )}
          </Section>
          {showDrillCard && !simpleMode ? <DrillQueueTodayCard /> : null}
        </div>

        <aside className="min-w-0 space-y-6">
          {showEssayDue ? (
            <Section eyebrow="Due soon">
              <EssayDueToday />
            </Section>
          ) : null}

          <Section eyebrow="This week">
            <WeekPlanCard subjects={subjects} embedded maxRows={simpleMode ? 3 : 6} />
          </Section>

          {showSpacedReviewAside ? (
            <Section eyebrow="Spaced review">
              <Card variant="quiet" density="compact" className="min-w-0">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <Brain
                      size={14}
                      className="mt-0.5 shrink-0 text-[var(--text-muted)]"
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--text-heading)]">
                        Spaced review
                      </p>
                      {reviewDue > 0 ? (
                        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                          <Tag tone="accent" size="sm" mono>
                            {reviewDue}
                          </Tag>
                          <span className="ml-2">
                            due
                            {reviewedToday > 0 ? ` · ${reviewedToday} done today` : ""}
                          </span>
                        </p>
                      ) : nextReview ? (
                        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                          Next review in{" "}
                          <span className="font-mono tabular-nums text-[var(--text-heading)]">
                            {nextReview.daysUntil}
                          </span>{" "}
                          {nextReview.daysUntil === 1 ? "day" : "days"}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  {reviewDue > 0 ? (
                    <Link to="/review" className="shrink-0">
                      <Button variant="secondary" size="sm" className="w-full sm:w-auto">
                        Review
                        <ArrowRight size={12} aria-hidden />
                      </Button>
                    </Link>
                  ) : null}
                </div>
              </Card>
            </Section>
          ) : null}

          {!simpleMode ? (
            <Section eyebrow="Daily challenge">
              <DailyChallengeCompact defaultCategory={challengeCategory} />
            </Section>
          ) : null}
        </aside>
      </div>

      <footer className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[var(--rule)] pt-4 font-mono text-[11px] text-[var(--text-muted)]">
        {simpleMode ? (
          <>
            {includeSat ? (
              <Link to={ROUTES.sat} className="text-[var(--text-muted)] hover:text-[var(--accent)]">
                SAT
              </Link>
            ) : null}
            <Link to={ROUTES.college} className="text-[var(--text-muted)] hover:text-[var(--accent)]">
              College
            </Link>
            <Link to={ROUTES.settings} className="text-[var(--text-muted)] hover:text-[var(--accent)]">
              Settings
            </Link>
          </>
        ) : (
          <>
            <span className="inline-flex items-center gap-1.5">
              <KeyHint size="sm">F</KeyHint> focus
            </span>
            <span className="inline-flex items-center gap-1.5">
              <KeyHint size="sm">⌘K</KeyHint> quick open
            </span>
            <span className="inline-flex items-center gap-1.5">
              <KeyHint size="sm">[</KeyHint> sidebar
            </span>
            <span aria-hidden className="text-[var(--text-subtle)]">
              ·
            </span>
            {includeSat ? (
              <Link to={ROUTES.sat} className="text-[var(--text-muted)] hover:text-[var(--accent)]">
                SAT
              </Link>
            ) : null}
            <Link to={ROUTES.college} className="text-[var(--text-muted)] hover:text-[var(--accent)]">
              College
            </Link>
            <Link to={ROUTES.stats} className="text-[var(--text-muted)] hover:text-[var(--accent)]">
              Stats
            </Link>
          </>
        )}
        <span className="ml-auto text-[var(--text-subtle)]" title="App version">
          {formatAppVersion()}
        </span>
      </footer>
    </PageContainer>
  );
}
