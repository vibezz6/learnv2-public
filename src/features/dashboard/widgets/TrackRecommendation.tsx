import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { tracks } from "@/data/tracks";
import type { Subject } from "@/curriculum/types";
import { useProgress } from "@/stores/progress";

export function TrackRecommendation({ subjects }: { subjects: Subject[] }) {
  const getNodeStatus = useProgress((s) => s.getNodeStatus);

  const trackProgress = tracks.map((track) => {
    const completed = track.lessons.filter(({ subjectId, nodeId }) => {
      const sub = subjects.find((s) => s.id === subjectId);
      const node = sub?.nodes.find((n) => n.id === nodeId);
      return node && getNodeStatus(node) === "completed";
    }).length;
    const next = track.lessons.find(({ subjectId, nodeId }) => {
      const sub = subjects.find((s) => s.id === subjectId);
      const node = sub?.nodes.find((n) => n.id === nodeId);
      return node && getNodeStatus(node) !== "completed" && getNodeStatus(node) !== "locked";
    });
    return { track, completed, total: track.lessons.length, next };
  });

  const best = trackProgress
    .filter((t) => t.completed < t.total)
    .sort((a, b) => b.completed / b.total - a.completed / a.total)[0];

  if (!best?.next) return null;

  return (
    <Card>
      <div className="mb-2 text-sm font-semibold text-[var(--text-heading)]">Track recommendation</div>
      <p className="text-sm text-[var(--text-muted)]">{best.track.description}</p>
      <div className="mt-2 text-xs text-[var(--text-muted)]">
        {best.track.name} · {best.completed}/{best.total} complete
      </div>
      <Link to={`/subjects/${best.next.subjectId}/${best.next.nodeId}`} className="mt-3 inline-block">
        <Button variant="secondary">
          Continue track
          <ArrowRight size={14} />
        </Button>
      </Link>
    </Card>
  );
}
