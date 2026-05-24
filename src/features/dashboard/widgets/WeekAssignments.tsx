import { Link } from "react-router-dom";
import { BookOpen, ChevronRight, Lock } from "lucide-react";
import { Card } from "@/components/ui";
import type { Subject } from "@/curriculum/types";
import { hasNotesForSubject } from "@/data/notePrompts";
import { DEFAULT_TRACK_ID, getTrackById } from "@/lib/campusHome";
import { getWeekAssignments } from "@/lib/coursework";
import { usePreferences } from "@/stores/preferences";
import { useProgress } from "@/stores/progress";

interface Props {
  subjects: Subject[];
}

export function WeekAssignments({ subjects }: Props) {
  const enrolledTrackId = usePreferences((s) => s.enrolledTrackId);
  const getNodeStatus = useProgress((s) => s.getNodeStatus);

  const activeTrackId = enrolledTrackId ?? DEFAULT_TRACK_ID;
  const track = getTrackById(activeTrackId);
  if (!track) return null;

  const { assignments } = getWeekAssignments(track, subjects, getNodeStatus);

  return (
    <Card variant="default" hover className="min-w-0 p-6">
      <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--accent-2)]">
        Due this week
      </p>
      <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
        Lessons on your {track.name} plan for this week.
      </p>

      {assignments.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--text-muted)]">
          You&apos;re caught up — no lessons due this week.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-[var(--border)]">
          {assignments.map((item) => {
            const locked = item.status === "locked";
            const comingSoon = item.status === "coming_soon";
            const showNotes = !comingSoon && hasNotesForSubject(item.subjectId);

            if (locked || comingSoon) {
              return (
                <li
                  key={`${item.subjectId}-${item.nodeId}`}
                  className="flex min-h-11 items-center gap-2 py-2.5 text-[var(--text-muted)]"
                  aria-disabled
                >
                  <span className="min-w-0 flex-1 break-words text-sm">{item.title}</span>
                  {comingSoon ? (
                    <span className="shrink-0 text-[11px]">Coming soon</span>
                  ) : (
                    <>
                      <span className="shrink-0 text-[11px]">Locked</span>
                      <Lock size={14} className="shrink-0" aria-hidden />
                    </>
                  )}
                </li>
              );
            }

            return (
              <li
                key={`${item.subjectId}-${item.nodeId}`}
                className="flex min-h-11 items-center gap-2 py-2.5"
              >
                <Link
                  to={`/subjects/${item.subjectId}/${item.nodeId}`}
                  className="flex min-w-0 flex-1 items-center gap-2 text-[var(--text-heading)] touch-manipulation hover:text-[var(--accent-2)]"
                >
                  <span className="min-w-0 flex-1 break-words text-sm">{item.title}</span>
                  <ChevronRight size={14} className="shrink-0 text-[var(--text-muted)]" aria-hidden />
                </Link>
                {showNotes && (
                  <Link
                    to={`/subjects/${item.subjectId}/${item.nodeId}/notes`}
                    className="flex shrink-0 items-center gap-1 rounded-[var(--radius)] px-2 py-1 text-[11px] text-[var(--text-muted)] touch-manipulation hover:bg-[var(--bg-hover)] hover:text-[var(--text-heading)]"
                  >
                    <BookOpen size={12} aria-hidden />
                    Notes
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
