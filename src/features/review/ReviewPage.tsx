import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  Flame,
  Sparkles,
  Target,
} from "lucide-react";
import {
  Badge,
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
import {
  MAX_DAILY_REVIEWS,
  SPACED_REPETITION_INTERVALS,
  useProgress,
  type ReviewConfidence,
  type ReviewItem,
} from "@/stores/progress";

const CONFIDENCE_STYLES: Record<
  ReviewConfidence,
  { label: string; hint: string; className: string }
> = {
  forgot: {
    label: "Forgot",
    hint: "Reset",
    className:
      "border-[var(--danger)] bg-[var(--danger-bg)] text-[var(--danger)] hover:brightness-110",
  },
  hard: {
    label: "Hard",
    hint: "Soon",
    className:
      "border-[var(--warning)] bg-[var(--warning-bg)] text-[var(--warning)] hover:brightness-110",
  },
  normal: {
    label: "Good",
    hint: "Solid",
    className:
      "border-[var(--accent-border)] bg-[var(--accent-bg)] text-[var(--accent)] hover:brightness-110",
  },
  easy: {
    label: "Easy",
    hint: "Nailed it",
    className:
      "border-[var(--success)] bg-[var(--success-bg)] text-[var(--success)] hover:brightness-110",
  },
};

export function ReviewPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const getDailyReviewItems = useProgress((s) => s.getDailyReviewItems);
  const getDailyReviewCount = useProgress((s) => s.getDailyReviewCount);
  const getRemainingReviewCount = useProgress((s) => s.getRemainingReviewCount);
  const getReviewStreak = useProgress((s) => s.getReviewStreak);
  const getReviewStats = useProgress((s) => s.getReviewStats);
  const completeReviewWithConfidence = useProgress((s) => s.completeReviewWithConfidence);

  useEffect(() => {
    loadAllSubjects().then((loaded) => {
      setSubjects(loaded);
      setLoadingSubjects(false);
    });
  }, []);

  const items = useMemo(
    () => (subjects.length ? getDailyReviewItems(subjects) : []),
    [subjects, getDailyReviewItems],
  );
  const dailyCount = getDailyReviewCount();
  const remaining = subjects.length ? getRemainingReviewCount(subjects) : 0;
  const streak = getReviewStreak();
  const stats = getReviewStats();
  const dailyProgress = Math.min(dailyCount / MAX_DAILY_REVIEWS, 1);

  const handleConfidence = (nodeId: string, confidence: ReviewConfidence) => {
    completeReviewWithConfidence(nodeId, confidence);
    setRefreshKey((k) => k + 1);
  };

  const { spotlight, rest } = useMemo(() => {
    const overdueItems = items.filter((item) => item.daysAgo > item.reviewInterval);
    const dueItems = items.filter((item) => item.daysAgo <= item.reviewInterval);
    const ordered = [...overdueItems, ...dueItems];
    return {
      spotlight: ordered[0] ?? null,
      rest: ordered.slice(1),
    };
  }, [items]);

  if (loadingSubjects) {
    return <PageLoading size="wide" />;
  }

  if (items.length === 0 && dailyCount === 0) {
    return (
      <PageContainer size="wide" className="space-y-6">
        <PageHeader
          eyebrow="Spaced repetition"
          title="Review"
          subtitle="Complete lessons to build your memory queue — reviews show up here on schedule."
        />
        <Card variant="quiet">
          <EmptyState
            icon={<Brain size={32} className="text-[var(--accent)]" />}
            title="Nothing to review yet"
            description="Finish a lesson and mark it complete. We'll schedule your first review automatically."
            actionLabel="Browse subjects"
            actionTo="/subjects"
          />
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer size="wide" className="space-y-6 md:space-y-8" key={refreshKey}>
      <PageHeader
        eyebrow="Spaced repetition"
        title="Review"
        subtitle="Rate each recall — honest taps train the interval algorithm."
      />

      <Section eyebrow="Daily goal" title="Today's review cap">
      <Card glow className="stagger-item border-l-2 border-l-[var(--accent)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-2">
              <Target size={14} className="text-[var(--accent)]" />
              <span className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
                Daily goal
              </span>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-3xl font-extrabold tabular-nums text-[var(--text-heading)]">
                {dailyCount}
              </span>
              <span className="text-lg text-[var(--text-muted)]">/ {MAX_DAILY_REVIEWS} reviews</span>
              {streak.current > 0 && (
                <Badge className="ml-1">
                  <Flame size={12} className="mr-1 inline" />
                  {streak.current}d streak
                </Badge>
              )}
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--border)]">
              <div
                className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
                style={{ width: `${dailyProgress * 100}%`, boxShadow: "0 0 12px rgba(0,212,170,0.4)" }}
              />
            </div>
            {dailyCount >= MAX_DAILY_REVIEWS ? (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-[var(--success)]">
                <Sparkles size={14} />
                Daily cap reached — great work.
              </p>
            ) : (
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                {items.length} in today&apos;s queue
                {remaining > 0 && ` · ${remaining} waiting beyond cap`}
              </p>
            )}
          </div>
          <div className="grid shrink-0 grid-cols-3 gap-3 md:w-72">
            <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-center">
              <div className="text-xl font-bold tabular-nums">{stats.passRate}%</div>
              <div className="text-[0.65rem] uppercase tracking-wide text-[var(--text-muted)]">
                On time
              </div>
            </div>
            <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-center">
              <div className="text-xl font-bold tabular-nums">{stats.totalReviews}</div>
              <div className="text-[0.65rem] uppercase tracking-wide text-[var(--text-muted)]">
                Total
              </div>
            </div>
            <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-center">
              <div className="text-xl font-bold tabular-nums">{streak.longest}</div>
              <div className="text-[0.65rem] uppercase tracking-wide text-[var(--text-muted)]">
                Best
              </div>
            </div>
          </div>
        </div>
      </Card>
      </Section>

      {spotlight && (
        <Section eyebrow="Up next" title="Current recall">
        <div className="stagger-item space-y-3">
          <ReviewCard
            item={spotlight}
            onConfidence={handleConfidence}
            urgent={spotlight.daysAgo > spotlight.reviewInterval}
            spotlight
          />
        </div>
        </Section>
      )}

      {rest.length > 0 && (
        <ReviewSection
          title="Still in queue"
          items={rest}
          onConfidence={handleConfidence}
        />
      )}

      {items.length === 0 && dailyCount > 0 && (
        <Card className="stagger-item py-10 text-center" glow>
          <CheckCircle2 className="mx-auto mb-3 text-[var(--success)]" size={36} />
          <p className="text-lg font-semibold text-[var(--text-heading)]">All caught up for today</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {dailyCount} review{dailyCount === 1 ? "" : "s"} logged · come back tomorrow for more.
          </p>
          <Link to="/stats" className="mt-4 inline-block text-sm font-medium text-[var(--accent)] hover:underline">
            View your stats →
          </Link>
        </Card>
      )}
    </PageContainer>
  );
}

function ReviewSection({
  title,
  items,
  onConfidence,
}: {
  title: string;
  items: ReviewItem[];
  onConfidence: (nodeId: string, confidence: ReviewConfidence) => void;
}) {
  return (
    <Section eyebrow={title} title={`${items.length} in queue`}>
      <div className="stagger-item space-y-3">
        {items.map((item) => (
          <ReviewCard
            key={item.node.id}
            item={item}
            onConfidence={onConfidence}
            urgent={item.daysAgo > item.reviewInterval}
          />
        ))}
      </div>
    </Section>
  );
}

function ReviewCard({
  item,
  onConfidence,
  urgent,
  spotlight,
}: {
  item: ReviewItem;
  onConfidence: (nodeId: string, confidence: ReviewConfidence) => void;
  urgent?: boolean;
  spotlight?: boolean;
}) {
  const idx = SPACED_REPETITION_INTERVALS.indexOf(item.reviewInterval as (typeof SPACED_REPETITION_INTERVALS)[number]);
  const nextGood = idx < SPACED_REPETITION_INTERVALS.length - 1 ? SPACED_REPETITION_INTERVALS[idx + 1] : item.reviewInterval;
  const nextEasy = idx < SPACED_REPETITION_INTERVALS.length - 2 ? SPACED_REPETITION_INTERVALS[idx + 2] : nextGood;

  const confidenceOptions = [
    ["forgot", 1],
    ["hard", item.reviewInterval],
    ["normal", nextGood],
    ["easy", nextEasy],
  ] as const;

  return (
    <Card
      glow={spotlight}
      className={`min-w-0 overflow-hidden ${spotlight ? "p-6 md:p-8" : "p-4 md:p-5"} ${
        urgent
          ? "border-l-[3px] border-l-[var(--danger)]"
          : "border-l-[3px] border-l-[var(--warning)]"
      }`}
    >
      <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          {urgent && (
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--danger)]">
              <AlertTriangle size={12} />
              Overdue
            </div>
          )}
          <h3
            className={`break-words font-semibold text-[var(--text-heading)] ${
              spotlight ? "text-xl md:text-2xl" : "text-base"
            }`}
          >
            {item.node.name}
          </h3>
          <p className="mt-1 break-words text-sm text-[var(--text-muted)]">
            {item.subject.name} · last studied {item.daysAgo}d ago · interval {item.reviewInterval}d
          </p>
        </div>
        <Link
          to={`/subjects/${item.subject.id}/${item.node.id}`}
          className="shrink-0 md:ml-4"
        >
          <Button variant="secondary" className="w-full md:w-auto">
            Open lesson
          </Button>
        </Link>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
          How well did you recall it?
        </p>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {confidenceOptions.map(([key, days]) => {
            const style = CONFIDENCE_STYLES[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => onConfidence(item.node.id, key)}
                className={`flex min-h-14 flex-col items-center justify-center rounded-[var(--radius)] border-2 px-3 py-2.5 text-sm font-bold transition active:scale-[0.98] ${style.className}`}
              >
                <span>{style.label}</span>
                <span className="mt-0.5 text-[0.65rem] font-normal uppercase tracking-wide opacity-80">
                  {style.hint} · {days}d
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
