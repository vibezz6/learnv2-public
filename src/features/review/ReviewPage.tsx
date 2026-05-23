import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  Clock,
  Flame,
  Sparkles,
  Target,
} from "lucide-react";
import { Badge, Button, Card } from "@/components/ui";
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
  const [refreshKey, setRefreshKey] = useState(0);

  const getDailyReviewItems = useProgress((s) => s.getDailyReviewItems);
  const getDailyReviewCount = useProgress((s) => s.getDailyReviewCount);
  const getRemainingReviewCount = useProgress((s) => s.getRemainingReviewCount);
  const getReviewStreak = useProgress((s) => s.getReviewStreak);
  const getReviewStats = useProgress((s) => s.getReviewStats);
  const completeReviewWithConfidence = useProgress((s) => s.completeReviewWithConfidence);

  useEffect(() => {
    loadAllSubjects().then(setSubjects);
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

  if (items.length === 0 && dailyCount === 0) {
    return (
      <div className="mx-auto w-full min-w-0 max-w-4xl space-y-6 overflow-x-hidden px-3 py-4 md:p-8">
        <section className="stagger-item space-y-1.5">
          <Badge>Spaced repetition</Badge>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-heading)]">
            Review queue
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Complete lessons to build your memory queue — reviews show up here on schedule.
          </p>
        </section>
        <Card className="stagger-item py-14 text-center">
          <Brain className="mx-auto mb-4 text-[var(--accent)]" size={40} />
          <p className="font-medium text-[var(--text-heading)]">Nothing to review yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--text-muted)]">
            Finish a lesson and mark it complete. We&apos;ll schedule your first review automatically.
          </p>
          <Link to="/subjects" className="mt-6 inline-block">
            <Button>Browse subjects</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="mx-auto w-full min-w-0 max-w-4xl space-y-6 overflow-x-hidden px-3 py-4 md:space-y-8 md:p-8"
      key={refreshKey}
    >
      <section className="stagger-item space-y-1.5">
        <Badge>Spaced repetition</Badge>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-heading)]">
          Review queue
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          Rate each recall — honest taps train the interval algorithm.
        </p>
      </section>

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

      {spotlight && (
        <section className="stagger-item space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
            <Sparkles size={14} />
            Up next
          </div>
          <ReviewCard
            item={spotlight}
            onConfidence={handleConfidence}
            urgent={spotlight.daysAgo > spotlight.reviewInterval}
            spotlight
          />
        </section>
      )}

      {rest.length > 0 && (
        <ReviewSection
          title="Still in queue"
          icon={<Clock size={16} className="text-[var(--text-muted)]" />}
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
    </div>
  );
}

function ReviewSection({
  title,
  icon,
  items,
  onConfidence,
}: {
  title: string;
  icon: React.ReactNode;
  items: ReviewItem[];
  onConfidence: (nodeId: string, confidence: ReviewConfidence) => void;
}) {
  return (
    <section className="stagger-item space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-heading)]">
        {icon}
        {title}
        <span className="font-normal text-[var(--text-muted)]">({items.length})</span>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <ReviewCard
            key={item.node.id}
            item={item}
            onConfidence={onConfidence}
            urgent={item.daysAgo > item.reviewInterval}
          />
        ))}
      </div>
    </section>
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
