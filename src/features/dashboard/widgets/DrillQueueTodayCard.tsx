import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Target, X } from "lucide-react";
import { ROUTES } from "@/app/navigation";
import { Button, Card } from "@/components/ui";
import {
  DRILL_QUEUE_TODAY_SNOOZE_ID,
  shouldShowDrillQueueTodayCard,
} from "@/lib/drillQueueToday";
import { getDrillQueue } from "@/lib/satDrillQueue";
import { snoozeNudge } from "@/lib/nudgeSnooze";
import { ADMISSIONS_UPDATED_EVENT } from "@/lib/admissionsSync";

function formatRecency(latestAt: number, now: number): string {
  const days = Math.floor((now - latestAt) / (24 * 60 * 60 * 1000));
  if (days <= 0) return "last logged today";
  if (days === 1) return "last logged yesterday";
  return `last logged ${days} days ago`;
}

export function DrillQueueTodayCard() {
  const [revision, setRevision] = useState(0);
  const [now] = useState(() => Date.now());

  const visible = useMemo(() => {
    void revision;
    return shouldShowDrillQueueTodayCard(localStorage, now);
  }, [revision, now]);

  const top = useMemo(() => {
    void revision;
    return getDrillQueue(1)[0];
  }, [revision]);

  if (!visible || !top) return null;

  const handleSnooze = () => {
    snoozeNudge(DRILL_QUEUE_TODAY_SNOOZE_ID, 1);
    setRevision((r) => r + 1);
    window.dispatchEvent(new Event(ADMISSIONS_UPDATED_EVENT));
  };

  return (
    <Card
      variant="default"
      density="normal"
      className="relative min-w-0"
      role="region"
      aria-labelledby="drill-queue-today-heading"
    >
      <button
        type="button"
        className="absolute right-3 top-3 text-[var(--text-muted)] hover:text-[var(--text-heading)]"
        aria-label="Snooze drill reminder for 24 hours"
        onClick={handleSnooze}
      >
        <X size={14} aria-hidden />
      </button>
      <div className="flex items-center gap-2 pr-8">
        <Target size={14} className="text-[var(--text-muted)]" aria-hidden />
        <p id="drill-queue-today-heading" className="eyebrow-mono">
          Drill next
        </p>
      </div>
      <p className="mt-2 text-lg font-medium text-[var(--text-heading)]">{top.label}</p>
      <p className="mt-1 text-sm text-[var(--text-muted)]">
        {top.count} {top.count === 1 ? "miss" : "misses"} · {formatRecency(top.latestAt, now)}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link to={`${ROUTES.satDrill}?skill=${top.skillId}`}>
          <Button size="sm">
            Drill {top.label}
            <ArrowRight size={14} aria-hidden />
          </Button>
        </Link>
        <Link to={ROUTES.sat}>
          <Button variant="ghost" size="sm">
            Open SAT hub
          </Button>
        </Link>
      </div>
    </Card>
  );
}
