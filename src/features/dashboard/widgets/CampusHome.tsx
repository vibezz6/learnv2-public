import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Brain,
  GraduationCap,
  Lock,
  Timer,
} from "lucide-react";
import { Button, Card } from "@/components/ui";
import type { Subject } from "@/curriculum/types";
import { tracks } from "@/data/tracks";
import {
  DEFAULT_TRACK_ID,
  getSatNextLesson,
  getTrackById,
  getTrackProgress,
} from "@/lib/campusHome";
import { cn } from "@/lib/cn";
import { usePreferences } from "@/stores/preferences";
import { useProgress } from "@/stores/progress";

interface Props {
  subjects: Subject[];
}

export function CampusHome({ subjects }: Props) {
  const enrolledTrackId = usePreferences((s) => s.enrolledTrackId);
  const setEnrolledTrack = usePreferences((s) => s.setEnrolledTrack);
  const getNodeStatus = useProgress((s) => s.getNodeStatus);
  const getNodesNeedingReview = useProgress((s) => s.getNodesNeedingReview);

  const activeTrackId = enrolledTrackId ?? DEFAULT_TRACK_ID;
  const track = getTrackById(activeTrackId);
  const reviewDue = getNodesNeedingReview(subjects).length;

  if (!track) return null;

  const progress = getTrackProgress(track, subjects, getNodeStatus);
  const satNext = getSatNextLesson(subjects, getNodeStatus);

  return (
    <Card variant="default" hover className="min-w-0 p-6">
      <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--accent-2)]">
        Campus home
      </p>
      <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
        Your enrolled track and what to do next.
      </p>

      <div className="mt-5">
        <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--text-muted)]">
          Enrolled track
        </p>
        <div
          className="mt-2 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="listbox"
          aria-label="Choose enrolled track"
        >
          {tracks.map((t) => {
            const selected = t.id === activeTrackId;
            return (
              <button
                key={t.id}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => setEnrolledTrack(t.id)}
                className={cn(
                  "shrink-0 rounded-[var(--radius)] border px-3 py-2.5 text-left text-sm transition touch-manipulation",
                  "min-h-11 min-w-[9rem]",
                  selected
                    ? "border-[var(--accent-2)] bg-[var(--accent-bg)] text-[var(--text-heading)]"
                    : "border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:text-[var(--text)]",
                )}
              >
                <span className="block font-medium leading-snug">{t.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6">
        <h3 className="break-words text-base font-medium text-[var(--text-heading)]">
          {track.name}
        </h3>
        <p className="mt-1.5 text-sm text-[var(--text-muted)]">
          {progress.pct === 100
            ? "You finished this track — nice work."
            : progress.completed === 0
              ? "You haven't started this track yet. Pick a lesson below to begin."
              : `You're ${progress.pct}% through — ${progress.total - progress.completed} lessons left.`}
        </p>
        <div className="mt-4 space-y-1.5">
          <div className="flex items-baseline justify-between text-[11px] text-[var(--text-muted)]">
            <span>Progress</span>
            <span className="font-mono tabular-nums">
              {progress.completed}/{progress.total}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[var(--border)]">
            <div
              className="h-full rounded-full bg-[var(--accent-2)]"
              style={{ width: `${progress.pct}%` }}
            />
          </div>
        </div>
      </div>

      {satNext && (
        <div className="mt-6 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
          <div className="flex items-start gap-3">
            <GraduationCap size={16} className="mt-0.5 shrink-0 text-[var(--accent-2)]" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[var(--text-heading)]">SAT prep</p>
              <p className="mt-0.5 text-sm text-[var(--text-muted)]">
                Next SAT lesson:{" "}
                <span className="text-[var(--text-heading)]">{satNext.title}</span>
              </p>
              <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                <Link
                  to="/subjects/sat-prep#mistakes"
                  className="text-[var(--accent-2)] hover:underline"
                >
                  Log a miss
                </Link>
                <Link
                  to="/subjects/sat-prep#official"
                  className="text-[var(--accent-2)] hover:underline"
                >
                  Official practice
                </Link>
              </p>
            </div>
          </div>
          {satNext.status === "locked" || satNext.status === "coming_soon" ? (
            <Button variant="secondary" className="mt-4 min-h-11 w-full" disabled>
              {satNext.status === "coming_soon" ? "Coming soon" : "Locked"}
              {satNext.status === "locked" ? <Lock size={14} /> : null}
            </Button>
          ) : (
            <Link
              to={`/subjects/${satNext.subjectId}/${satNext.nodeId}`}
              className="mt-4 block"
            >
              <Button variant="secondary" className="min-h-11 w-full touch-manipulation">
                Go to SAT lesson
                <ArrowRight size={14} />
              </Button>
            </Link>
          )}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Brain size={16} className="mt-0.5 shrink-0 text-[var(--text-muted)]" aria-hidden />
          <div>
            <p className="text-sm font-medium text-[var(--text-heading)]">Spaced review</p>
            <p className="mt-0.5 text-sm text-[var(--text-muted)]">
              {reviewDue > 0 ? (
                <>
                  <span className="font-mono tabular-nums text-[var(--text-heading)]">
                    {reviewDue}
                  </span>{" "}
                  {reviewDue === 1 ? "lesson" : "lessons"} due
                </>
              ) : (
                "Nothing due right now"
              )}
            </p>
          </div>
        </div>
        {reviewDue > 0 && (
          <Link to="/review" className="shrink-0">
            <Button variant="secondary" className="min-h-11 w-full touch-manipulation sm:w-auto">
              Review
              <ArrowRight size={14} />
            </Button>
          </Link>
        )}
      </div>

      <div className="mt-6 border-t border-[var(--border)] pt-5">
        <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--text-muted)]">
          Quick links
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link to="/timer" className="min-w-0">
            <Button variant="ghost" className="min-h-11 w-full touch-manipulation">
              <Timer size={16} aria-hidden />
              Timer
            </Button>
          </Link>
          <Link to="/stats" className="min-w-0">
            <Button variant="ghost" className="min-h-11 w-full touch-manipulation">
              <BarChart3 size={16} aria-hidden />
              Stats
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
