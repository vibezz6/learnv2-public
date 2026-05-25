import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { findNodeAcrossSubjects } from "@/curriculum/loader";
import type { Subject } from "@/curriculum/types";
import {
  ACTIVITY_UPDATED_EVENT,
  formatActivityLabel,
  listActivities,
  type StudyActivityEvent,
} from "@/lib/studyActivity";

function activityHref(event: StudyActivityEvent, subjects: Subject[]): string | null {
  if (!event.nodeId) {
    if (event.type.startsWith("sat_")) return "/subjects/sat-prep";
    return null;
  }
  const found = findNodeAcrossSubjects(subjects, event.nodeId);
  if (!found) return null;
  return `/subjects/${found.subject.id}/${found.node.id}`;
}

export function StudyActivityList({ subjects, limit = 25 }: { subjects: Subject[]; limit?: number }) {
  const [events, setEvents] = useState<StudyActivityEvent[]>(() => listActivities(limit));

  const refresh = useCallback(() => setEvents(listActivities(limit)), [limit]);

  useEffect(() => {
    refresh();
    window.addEventListener(ACTIVITY_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(ACTIVITY_UPDATED_EVENT, refresh);
  }, [refresh]);

  if (events.length === 0) {
    return (
      <p className="text-sm text-[var(--text-muted)]">
        Complete a lesson, save office-hours notes, or log SAT practice to build your activity timeline.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-[var(--border)]/60 text-sm">
      {events.map((event) => {
        const found = event.nodeId ? findNodeAcrossSubjects(subjects, event.nodeId) : null;
        const label = formatActivityLabel(event, found?.node.name);
        const href = activityHref(event, subjects);
        return (
          <li
            key={event.id}
            className="flex min-w-0 flex-col gap-0.5 py-2.5 min-[481px]:flex-row min-[481px]:items-center min-[481px]:justify-between"
          >
            <div className="min-w-0">
              {href ? (
                <Link to={href} className="font-medium text-[var(--text-heading)] hover:text-[var(--accent)]">
                  {label}
                </Link>
              ) : (
                <span className="font-medium text-[var(--text-heading)]">{label}</span>
              )}
              <span className="mt-0.5 block text-xs text-[var(--text-muted)]">{event.date}</span>
            </div>
            <time className="shrink-0 text-xs tabular-nums text-[var(--text-muted)]">
              {new Date(event.at).toLocaleString()}
            </time>
          </li>
        );
      })}
    </ul>
  );
}
