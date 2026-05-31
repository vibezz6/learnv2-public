import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarClock } from "lucide-react";
import { Card, Tag } from "@/components/ui";
import type { Subject } from "@/curriculum/types";
import { ADMISSIONS_UPDATED_EVENT } from "@/lib/admissionsSync";
import { DEFAULT_TRACK_ID, getTrackById } from "@/lib/campusHome";
import { ROUTES } from "@/app/navigation";
import {
  buildWeekPlan,
  WEEK_PLAN_SOURCE_LABELS,
} from "@/lib/weekPlan";
import { isDailySatQuizDone } from "@/lib/satDailyQuiz";
import { usePreferences } from "@/stores/preferences";
import { useProgress } from "@/stores/progress";

interface Props {
  subjects: Subject[];
  /** When true, parent Section supplies the "This week" eyebrow. */
  embedded?: boolean;
}

const WEEK_PLAN_SUBTITLE = "Track, deadlines, and SAT follow-ups — up to six items.";

export function WeekPlanCard({ subjects, embedded = false }: Props) {
  const enrolledTrackId = usePreferences((s) => s.enrolledTrackId);
  const placementGoal = usePreferences((s) => s.placementGoal);
  const getNodeStatus = useProgress((s) => s.getNodeStatus);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const bump = () => setRevision((r) => r + 1);
    window.addEventListener(ADMISSIONS_UPDATED_EVENT, bump);
    return () => window.removeEventListener(ADMISSIONS_UPDATED_EVENT, bump);
  }, []);

  const activeTrackId = enrolledTrackId ?? DEFAULT_TRACK_ID;
  const track = getTrackById(activeTrackId);

  const { rows, collegeOverflow } = useMemo(() => {
    void revision;
    return buildWeekPlan({
      subjects,
      getNodeStatus,
      enrolledTrackId: activeTrackId,
      placementGoal,
    });
  }, [subjects, getNodeStatus, activeTrackId, placementGoal, revision]);

  const dailyDone = useMemo(() => {
    void revision;
    return isDailySatQuizDone();
  }, [revision]);

  if (rows.length === 0) {
    return (
      <Card variant="default" density="normal" className="min-w-0">
        {!embedded ? (
          <div className="mb-2 flex items-center gap-2">
            <CalendarClock size={14} aria-hidden className="text-[var(--text-muted)]" />
            <p className="eyebrow-mono">This week</p>
          </div>
        ) : null}
        <p className="text-sm text-[var(--text-muted)]">{WEEK_PLAN_SUBTITLE}</p>
        <p className="mt-2 text-sm text-[var(--text)]">
          You&apos;re caught up on track lessons and application deadlines for the next 7 days.
        </p>
        {dailyDone ? (
          <Link
            to={ROUTES.satDrill}
            className="mt-3 inline-flex min-h-9 items-center gap-1 text-sm font-medium text-[var(--accent)] hover:underline"
          >
            Drill your top mistake skill
            <ArrowRight size={14} aria-hidden />
          </Link>
        ) : (
          <Link
            to={ROUTES.satDailyQuiz}
            className="mt-3 inline-flex min-h-9 items-center gap-1 text-sm font-medium text-[var(--accent)] hover:underline"
          >
            Take today&apos;s Daily 5
            <ArrowRight size={14} aria-hidden />
          </Link>
        )}
        {track ? (
          <Link
            to={`/tracks/${track.id}`}
            className="mt-2 inline-flex min-h-9 items-center gap-1 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--accent)] hover:underline"
          >
            Open {track.name}
            <ArrowRight size={14} aria-hidden />
          </Link>
        ) : null}
      </Card>
    );
  }

  return (
    <Card variant="default" density="normal" className="min-w-0">
      {!embedded ? (
        <div className="mb-2 flex items-center gap-2">
          <CalendarClock size={14} aria-hidden className="text-[var(--text-muted)]" />
          <p className="eyebrow-mono">This week</p>
        </div>
      ) : null}
      <p className="text-sm text-[var(--text-muted)]">{WEEK_PLAN_SUBTITLE}</p>
      <ul className="mt-3 divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
        {rows.map((row) => (
          <li key={row.id}>
            {row.disabled ? (
              <div className="flex min-h-11 items-center justify-between gap-3 py-2.5 text-sm text-[var(--text-muted)]">
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{row.title}</span>
                  {row.detail ? <span className="mt-0.5 block text-xs">{row.detail}</span> : null}
                </span>
              </div>
            ) : (
              <Link
                to={row.href}
                className="group flex min-h-11 items-center justify-between gap-3 py-2.5 touch-manipulation"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-[var(--text-heading)] group-hover:text-[var(--accent)]">
                    {row.title}
                  </span>
                  <span className="mt-0.5 flex items-center gap-2 text-xs text-[var(--text-muted)]">
                    <Tag tone="mono" size="sm">
                      {WEEK_PLAN_SOURCE_LABELS[row.source]}
                    </Tag>
                    {row.detail ? <span className="truncate">{row.detail}</span> : null}
                  </span>
                </span>
                <ArrowRight
                  size={14}
                  className="shrink-0 text-[var(--text-subtle)] group-hover:text-[var(--accent)]"
                  aria-hidden
                />
              </Link>
            )}
          </li>
        ))}
      </ul>
      {collegeOverflow > 0 ? (
        <Link
          to={ROUTES.college}
          className="mt-2 inline-flex min-h-9 items-center gap-1 text-sm font-medium text-[var(--accent)] hover:underline"
        >
          +{collegeOverflow} more in Campus
          <ArrowRight size={14} aria-hidden />
        </Link>
      ) : null}
      {track ? (
        <Link
          to={`/tracks/${track.id}`}
          className="mt-3 inline-flex min-h-9 items-center gap-1 text-sm font-medium text-[var(--accent)] hover:underline"
        >
          Full plan — {track.name}
          <ArrowRight size={14} aria-hidden />
        </Link>
      ) : null}
    </Card>
  );
}
