import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Clock } from "lucide-react";
import { findNodeAcrossSubjects } from "@/curriculum/loader";
import type { Subject } from "@/curriculum/types";
import { Card } from "@/components/ui";
import { DATA_UPDATED_EVENT } from "@/lib/dataSync";
import {
  formatActivityLabel,
  listActivitiesForDate,
  subscribeActivityUpdated,
  type StudyActivityEvent,
} from "@/lib/studyActivity";
import { getToday } from "@/stores/progress";

function formatTime(at: number): string {
  return new Date(at).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function activityHref(event: StudyActivityEvent, subjects: Subject[]): string | null {
  if (!event.nodeId) {
    if (event.type.startsWith("sat_")) return "/subjects/sat-prep";
    return null;
  }
  const found = findNodeAcrossSubjects(subjects, event.nodeId);
  if (!found) return null;
  return `/subjects/${found.subject.id}/${found.node.id}`;
}

export function RecentStudyStrip({ subjects }: { subjects: Subject[] }) {
  const [events, setEvents] = useState<StudyActivityEvent[]>(() =>
    listActivitiesForDate(getToday()).slice(0, 5),
  );

  useEffect(() => {
    const refresh = () => setEvents(listActivitiesForDate(getToday()).slice(0, 5));
    refresh();
    const unsubActivity = subscribeActivityUpdated(refresh);
    window.addEventListener(DATA_UPDATED_EVENT, refresh);
    return () => {
      unsubActivity();
      window.removeEventListener(DATA_UPDATED_EVENT, refresh);
    };
  }, []);

  if (events.length === 0) return null;

  return (
    <Card className="min-w-0">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--text-heading)]">
        <Clock size={16} className="shrink-0 text-[var(--accent)]" />
        Recent study today
      </div>
      <ul className="space-y-2 text-sm">
        {events.map((event) => {
          const found = event.nodeId
            ? findNodeAcrossSubjects(subjects, event.nodeId)
            : null;
          const label = formatActivityLabel(
            event,
            found?.node.name,
          );
          const href = activityHref(event, subjects);
          return (
            <li
              key={event.id}
              className="flex min-w-0 items-baseline justify-between gap-3 text-[var(--text-muted)]"
            >
              {href ? (
                <Link
                  to={href}
                  className="min-w-0 truncate text-[var(--text)] hover:text-[var(--accent)]"
                >
                  {label}
                </Link>
              ) : (
                <span className="min-w-0 truncate text-[var(--text)]">{label}</span>
              )}
              <span className="shrink-0 tabular-nums text-xs">{formatTime(event.at)}</span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
