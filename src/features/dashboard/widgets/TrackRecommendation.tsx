import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { tracks } from "@/data/tracks";
import type { Subject } from "@/curriculum/types";
import { countAvailableTrackLessons, resolveTrackLesson } from "@/lib/trackIntegrity";
import { useProgress } from "@/stores/progress";

export function TrackRecommendation({ subjects }: { subjects: Subject[] }) {
  const getNodeStatus = useProgress((s) => s.getNodeStatus);

  const trackProgress = tracks.map((track) => {
    const completed = track.lessons.filter(({ subjectId, nodeId }) => {
      const resolved = resolveTrackLesson(subjectId, nodeId, subjects);
      return resolved && getNodeStatus(resolved.node) === "completed";
    }).length;
    const next = track.lessons.find(({ subjectId, nodeId }) => {
      const resolved = resolveTrackLesson(subjectId, nodeId, subjects);
      if (!resolved) return false;
      const status = getNodeStatus(resolved.node);
      return status !== "completed" && status !== "locked";
    });
    return { track, completed, total: countAvailableTrackLessons(track, subjects), next };
  });

  const best = trackProgress
    .filter((t) => t.completed < t.total)
    .sort((a, b) => b.completed / b.total - a.completed / a.total)[0];

  if (!best?.next) return null;

  return (
    <Card variant="default" hover className="min-w-0 p-6">
      <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--accent-2)]">
        Track
      </p>
      <h3 className="mt-2 break-words text-base font-medium text-[var(--text-heading)]">
        {best.track.name}
      </h3>
      <p className="mt-2 break-words text-sm leading-relaxed text-[var(--text-muted)]">
        {best.track.description}
      </p>
      <div className="mt-4 space-y-1.5">
        <div className="flex items-baseline justify-between text-[11px] text-[var(--text-muted)]">
          <span>Progress</span>
          <span className="font-mono tabular-nums">
            {best.completed}/{best.total}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--border)]">
          <div
            className="h-full rounded-full bg-[var(--accent-2)]"
            style={{ width: `${best.total > 0 ? (best.completed / best.total) * 100 : 0}%` }}
          />
        </div>
      </div>
      <Link to={`/subjects/${best.next.subjectId}/${best.next.nodeId}`} className="mt-5 block">
        <Button variant="secondary" className="min-h-11 w-full touch-manipulation">
          Continue track
          <ArrowRight size={14} />
        </Button>
      </Link>
    </Card>
  );
}
