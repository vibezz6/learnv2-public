import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Brain, CheckCircle2, Clock, Flame } from "lucide-react";
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

  const items = subjects.length ? getDailyReviewItems(subjects) : [];
  const dailyCount = getDailyReviewCount();
  const remaining = subjects.length ? getRemainingReviewCount(subjects) : 0;
  const streak = getReviewStreak();
  const stats = getReviewStats();
  const dailyProgress = Math.min(dailyCount / MAX_DAILY_REVIEWS, 1);

  const handleConfidence = (nodeId: string, confidence: ReviewConfidence) => {
    completeReviewWithConfidence(nodeId, confidence);
    setRefreshKey((k) => k + 1);
  };

  const overdue = items.filter((item) => item.daysAgo > item.reviewInterval);
  const dueToday = items.filter((item) => item.daysAgo <= item.reviewInterval);

  if (items.length === 0 && dailyCount === 0) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-8">
        <h1 className="text-3xl font-bold text-[var(--text-heading)]">Review</h1>
        <Card className="text-center">
          <Brain className="mx-auto mb-3 text-[var(--accent)]" size={32} />
          <p className="text-sm text-[var(--text-muted)]">
            Complete lessons to build your spaced repetition queue.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8" key={refreshKey}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Badge>Batch 3 · SRS</Badge>
          <h1 className="mt-2 text-3xl font-bold text-[var(--text-heading)]">Review queue</h1>
        </div>
        <div className="flex items-center gap-2">
          {streak.current > 0 && (
            <Badge>
              <Flame size={12} className="mr-1 inline" />
              {streak.current}d streak
            </Badge>
          )}
          <Badge>{dailyCount}/{MAX_DAILY_REVIEWS} today</Badge>
        </div>
      </div>

      <div className="h-1 overflow-hidden rounded-full bg-[var(--border)]">
        <div
          className="h-full bg-[var(--accent)] transition-all"
          style={{ width: `${dailyProgress * 100}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center">
          <div className="text-2xl font-bold">{stats.totalReviews}</div>
          <div className="text-xs text-[var(--text-muted)]">Total reviews</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-[var(--accent)]">{stats.passRate}%</div>
          <div className="text-xs text-[var(--text-muted)]">Pass rate</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold">{streak.longest}</div>
          <div className="text-xs text-[var(--text-muted)]">Best streak</div>
        </Card>
      </div>

      {remaining > 0 && (
        <p className="text-sm text-[var(--text-muted)]">
          {remaining} more waiting beyond today&apos;s cap.
        </p>
      )}

      {overdue.length > 0 && (
        <ReviewSection
          title="Overdue"
          icon={<AlertTriangle size={16} className="text-[var(--danger)]" />}
          items={overdue}
          onConfidence={handleConfidence}
          urgent
        />
      )}

      {dueToday.length > 0 && (
        <ReviewSection
          title="Due today"
          icon={<Clock size={16} className="text-[var(--warning)]" />}
          items={dueToday}
          onConfidence={handleConfidence}
        />
      )}

      {items.length === 0 && dailyCount > 0 && (
        <Card className="text-center">
          <CheckCircle2 className="mx-auto mb-3 text-[var(--success)]" size={32} />
          <p className="font-medium text-[var(--text-heading)]">All caught up for today</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            You&apos;ve done {dailyCount} of {MAX_DAILY_REVIEWS} daily reviews.
          </p>
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
  urgent,
}: {
  title: string;
  icon: React.ReactNode;
  items: ReviewItem[];
  onConfidence: (nodeId: string, confidence: ReviewConfidence) => void;
  urgent?: boolean;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-heading)]">
        {icon}
        {title}
        <span className="text-[var(--text-muted)]">({items.length})</span>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <ReviewCard key={item.node.id} item={item} onConfidence={onConfidence} urgent={urgent} />
        ))}
      </div>
    </section>
  );
}

function ReviewCard({
  item,
  onConfidence,
  urgent,
}: {
  item: ReviewItem;
  onConfidence: (nodeId: string, confidence: ReviewConfidence) => void;
  urgent?: boolean;
}) {
  const idx = SPACED_REPETITION_INTERVALS.indexOf(item.reviewInterval as (typeof SPACED_REPETITION_INTERVALS)[number]);
  const nextGood = idx < SPACED_REPETITION_INTERVALS.length - 1 ? SPACED_REPETITION_INTERVALS[idx + 1] : item.reviewInterval;
  const nextEasy = idx < SPACED_REPETITION_INTERVALS.length - 2 ? SPACED_REPETITION_INTERVALS[idx + 2] : nextGood;

  return (
    <Card className={urgent ? "border-l-4 border-l-[var(--danger)]" : "border-l-4 border-l-[var(--warning)]"}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-[var(--text-heading)]">{item.node.name}</h3>
          <p className="text-sm text-[var(--text-muted)]">
            {item.subject.name} · completed {item.daysAgo}d ago
          </p>
        </div>
        <Link to={`/subjects/${item.subject.id}/${item.node.id}`}>
          <Button variant="secondary">Open lesson</Button>
        </Link>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {([
          ["forgot", "Forgot", 1],
          ["hard", "Hard", item.reviewInterval],
          ["normal", "Good", nextGood],
          ["easy", "Easy", nextEasy],
        ] as const).map(([key, label, days]) => (
          <button
            key={key}
            type="button"
            onClick={() => onConfidence(item.node.id, key)}
            className="rounded-[var(--radius)] border border-[var(--border)] px-2 py-2 text-xs font-semibold text-[var(--text-muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            {label}
            <div className="font-normal opacity-70">→{days}d</div>
          </button>
        ))}
      </div>
    </Card>
  );
}
