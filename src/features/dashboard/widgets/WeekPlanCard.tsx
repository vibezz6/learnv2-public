import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarClock } from "lucide-react";
import { Card } from "@/components/ui";
import type { Subject } from "@/curriculum/types";
import { ADMISSIONS_UPDATED_EVENT } from "@/lib/admissionsSync";
import { DEFAULT_TRACK_ID, getTrackById } from "@/lib/campusHome";
import {
  buildWeekPlanRows,
  WEEK_PLAN_SOURCE_LABELS,
} from "@/lib/weekPlan";
import { usePreferences } from "@/stores/preferences";
import { useProgress } from "@/stores/progress";

interface Props {
  subjects: Subject[];
}

export function WeekPlanCard({ subjects }: Props) {
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

  const rows = useMemo(() => {
    void revision;
    return buildWeekPlanRows({
      subjects,
      getNodeStatus,
      enrolledTrackId: activeTrackId,
      placementGoal,
    });
  }, [subjects, getNodeStatus, activeTrackId, placementGoal, revision]);

  if (rows.length === 0) {
    return (
      <Card variant="default" className="min-w-0 p-5">
        <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--accent-2)]">
          This week
        </p>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          You&apos;re caught up on track lessons and application deadlines for the next 7 days.
        </p>
        {track ? (
          <Link
            to={`/tracks/${track.id}`}
            className="mt-4 inline-flex min-h-10 items-center gap-1 text-sm font-medium text-[var(--accent)] hover:underline"
          >
            Open {track.name}
            <ArrowRight size={14} aria-hidden />
          </Link>
        ) : null}
      </Card>
    );
  }

  return (
    <Card variant="default" className="min-w-0 p-5">
      <div className="flex items-start gap-3">
        <CalendarClock size={16} className="mt-0.5 shrink-0 text-[var(--accent-2)]" aria-hidden />
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--accent-2)]">
              This week
            </p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Track lessons, college deadlines, and SAT follow-ups — up to six items.
            </p>
          </div>
          <ul className="divide-y divide-[var(--border)]">
            {rows.map((row) => (
              <li key={row.id}>
                {row.disabled ? (
                  <div className="flex min-h-11 items-center justify-between gap-2 py-2.5 text-sm text-[var(--text-muted)]">
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{row.title}</span>
                      {row.detail ? (
                        <span className="mt-0.5 block text-xs">{row.detail}</span>
                      ) : null}
                    </span>
                  </div>
                ) : (
                  <Link
                    to={row.href}
                    className="group flex min-h-11 items-center justify-between gap-2 py-2.5 touch-manipulation"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-[var(--text-heading)] group-hover:text-[var(--accent-2)]">
                        {row.title}
                      </span>
                      <span className="mt-0.5 block text-xs text-[var(--text-muted)]">
                        {WEEK_PLAN_SOURCE_LABELS[row.source]}
                        {row.detail ? ` · ${row.detail}` : ""}
                      </span>
                    </span>
                    <ArrowRight
                      size={14}
                      className="shrink-0 text-[var(--text-muted)] group-hover:text-[var(--accent-2)]"
                      aria-hidden
                    />
                  </Link>
                )}
              </li>
            ))}
          </ul>
          {track ? (
            <Link
              to={`/tracks/${track.id}`}
              className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-[var(--accent)] hover:underline"
            >
              Full plan — {track.name}
              <ArrowRight size={14} aria-hidden />
            </Link>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
