import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  CheckCircle2,
  ChevronLeft,
  Circle,
  Code,
  FunctionSquare,
  Lock,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Badge, Button, Card } from "@/components/ui";
import { loadAllSubjects } from "@/curriculum/loader";
import type { LearningTrack } from "@/data/tracks";
import { tracks } from "@/data/tracks";
import type { SkillNode, Subject } from "@/curriculum/types";
import { useProgress } from "@/stores/progress";
import { cn } from "@/lib/cn";

const trackIcons: Record<string, LucideIcon> = {
  "trending-up": TrendingUp,
  code: Code,
  wallet: Wallet,
  function: FunctionSquare,
};

function ProgressRing({
  pct,
  color,
  size = 72,
  children,
}: {
  pct: number;
  color: string;
  size?: number;
  children?: React.ReactNode;
}) {
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - Math.min(Math.max(pct, 0), 1));
  const center = size / 2;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="absolute inset-[-6px] rounded-full opacity-[0.12] blur-[10px]"
        style={{ background: color }}
      />
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={stroke}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

function resolveTrackLessons(track: LearningTrack, subjects: Subject[]) {
  return track.lessons
    .map(({ subjectId, nodeId }, index) => {
      const subject = subjects.find((s) => s.id === subjectId);
      const node = subject?.nodes.find((n) => n.id === nodeId);
      if (!subject || !node) return null;
      return { index: index + 1, subject, node };
    })
    .filter((item): item is { index: number; subject: Subject; node: SkillNode } => item !== null);
}

function getTrackStats(track: LearningTrack, subjects: Subject[], getNodeStatus: (node: SkillNode) => string) {
  const lessons = resolveTrackLessons(track, subjects);
  const completed = lessons.filter(({ node }) => getNodeStatus(node) === "completed").length;
  return { lessons, completed, total: track.lessons.length };
}

export function TracksPage() {
  const { trackId } = useParams();
  const getNodeStatus = useProgress((s) => s.getNodeStatus);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    loadAllSubjects().then(setSubjects);
  }, []);

  const trackStats = useMemo(
    () =>
      tracks.map((track) => ({
        track,
        ...getTrackStats(track, subjects, getNodeStatus),
      })),
    [subjects, getNodeStatus],
  );

  const selected = trackId ? trackStats.find(({ track }) => track.id === trackId) : null;

  if (trackId && subjects.length > 0 && !selected) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-4 md:p-8">
        <Link
          to="/tracks"
          className="inline-flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
        >
          <ChevronLeft size={16} />
          All tracks
        </Link>
        <Card>
          <p className="text-[var(--text-muted)]">Track not found.</p>
          <Link to="/tracks" className="mt-4 inline-block">
            <Button variant="secondary">Back to tracks</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (selected) {
    const { track, lessons, completed, total } = selected;
    const Icon = trackIcons[track.icon] ?? Circle;
    const pct = total > 0 ? completed / total : 0;

    return (
      <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-8">
        <Link
          to="/tracks"
          className="inline-flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
        >
          <ChevronLeft size={16} />
          All tracks
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
          <ProgressRing pct={pct} color={track.color} size={88}>
            <Icon size={24} style={{ color: track.color }} />
          </ProgressRing>
          <div className="min-w-0 flex-1">
            <Badge>{completed}/{total} complete</Badge>
            <h1 className="mt-2 text-3xl font-bold text-[var(--text-heading)]">{track.name}</h1>
            <p className="mt-1 text-[var(--text-muted)]">{track.description}</p>
          </div>
        </div>

        <div className="space-y-2">
          {lessons.map(({ index, subject, node }) => {
            const status = getNodeStatus(node);
            const locked = status === "locked";
            return (
              <Link
                key={`${subject.id}-${node.id}`}
                to={locked ? "#" : `/subjects/${subject.id}/${node.id}`}
                className={locked ? "pointer-events-none" : ""}
              >
                <Card
                  className={cn(
                    "stagger-item flex items-start gap-4 transition hover:border-[var(--accent)]/30",
                    locked && "opacity-50",
                  )}
                >
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-xs font-semibold"
                    style={{
                      background: `${track.color}18`,
                      color: track.color,
                    }}
                  >
                    {index}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold text-[var(--text-heading)]">{node.name}</h2>
                    <p className="mt-0.5 text-xs text-[var(--accent-2)]">{subject.name}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-[var(--text-muted)]">{node.description}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="font-mono text-xs text-[var(--accent)]">{node.xpValue} XP</span>
                    {status === "completed" && (
                      <CheckCircle2 size={16} className="text-[var(--success)]" />
                    )}
                    {status === "available" && (
                      <Circle size={16} className="text-[var(--accent)]" />
                    )}
                    {status === "locked" && <Lock size={16} className="text-[var(--warning)]" />}
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>

        <Link to="/tracks">
          <Button variant="secondary">All tracks</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <div>
        <Badge>{tracks.length} learning paths</Badge>
        <h1 className="mt-2 text-3xl font-bold text-[var(--text-heading)]">Tracks</h1>
        <p className="text-[var(--text-muted)]">
          Curated paths through the curriculum — pick a track and follow the sequence.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {trackStats.map(({ track, completed, total }) => {
          const Icon = trackIcons[track.icon] ?? Circle;
          const pct = total > 0 ? completed / total : 0;
          const done = completed === total && total > 0;

          return (
            <Link key={track.id} to={`/tracks/${track.id}`}>
              <Card className="stagger-item flex h-full gap-4 transition hover:border-[var(--accent)]/40">
                <ProgressRing pct={pct} color={track.color}>
                  <Icon size={20} style={{ color: track.color }} />
                </ProgressRing>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-lg font-semibold text-[var(--text-heading)]">{track.name}</h2>
                    {done && <CheckCircle2 size={16} className="shrink-0 text-[var(--success)]" />}
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-[var(--text-muted)]">{track.description}</p>
                  <p className="mt-3 font-mono text-xs" style={{ color: track.color }}>
                    {completed}/{total} lessons
                  </p>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
