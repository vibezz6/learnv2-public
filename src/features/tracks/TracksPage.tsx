import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import {
  CheckCircle2,
  Circle,
  Code,
  FunctionSquare,
  Lock,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Card, EmptyState, PageContainer, PageHeader, Section } from "@/components/ui";
import { loadAllSubjects } from "@/curriculum/loader";
import type { LearningTrack } from "@/data/tracks";
import { tracks } from "@/data/tracks";
import type { SkillNode, Subject } from "@/curriculum/types";
import { TrackDetailHeader } from "@/features/tracks/TrackDetailHeader";
import { useProgress } from "@/stores/progress";
import { getLockTooltip } from "@/lib/lockRules";
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
  size = 80,
  children,
}: {
  pct: number;
  color: string;
  size?: number;
  children?: ReactNode;
}) {
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - Math.min(Math.max(pct, 0), 1));
  const center = size / 2;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
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
  const getNodeProgress = useProgress((s) => s.getNodeProgress);
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
      <PageContainer size="wide" className="space-y-4">
        <PageHeader backTo={{ to: "/tracks", label: "Tracks" }} divider={false} />
        <Card>
          <EmptyState
            title="Track not found"
            description="That path doesn't exist. Pick another track from the list."
            actionLabel="Browse all tracks"
            actionTo="/tracks"
          />
        </Card>
      </PageContainer>
    );
  }

  if (selected) {
    const { track, lessons, completed, total } = selected;
    const Icon = trackIcons[track.icon] ?? Circle;

    return (
      <PageContainer size="wide" className="space-y-6">
        <PageHeader backTo={{ to: "/tracks", label: "Tracks" }} divider={false} />

        <TrackDetailHeader
          name={track.name}
          description={track.description}
          color={track.color}
          icon={Icon}
          completed={completed}
          total={total}
        />

        {lessons.length === 0 ? (
          <Card>
            <EmptyState
              title="Path loading"
              description="Lessons for this track will appear once curriculum data is available."
              actionLabel="Browse subjects"
              actionTo="/subjects"
            />
          </Card>
        ) : (
          <Section eyebrow="Lessons" title={`${lessons.length} on this path`}>
          <div className="space-y-3">
            {lessons.map(({ index, subject, node }) => {
              const status = getNodeStatus(node);
              const locked = status === "locked";
              const byId = new Map(subject.nodes.map((n) => [n.id, n]));
              const lockHint = locked
                ? getLockTooltip(node, getNodeProgress, (id) => byId.get(id)?.name ?? id)
                : null;
              return (
                <Link
                  key={`${subject.id}-${node.id}`}
                  to={locked ? "#" : `/subjects/${subject.id}/${node.id}`}
                  className={locked ? "cursor-not-allowed" : ""}
                  title={lockHint ?? undefined}
                  onClick={locked ? (e) => e.preventDefault() : undefined}
                >
                  <Card
                    className={cn(
                      "flex items-start gap-5 transition hover:border-[var(--border-strong)]",
                      locked && "opacity-50",
                    )}
                  >
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-mono text-xs font-semibold"
                      style={{
                        background: `${track.color}18`,
                        color: track.color,
                      }}
                    >
                      {index}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="font-medium text-[var(--text-heading)]">{node.name}</h2>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">{subject.name}</p>
                      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[var(--text-muted)]">
                        {node.description}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <span className="font-mono text-[11px] tabular-nums text-[var(--text-muted)]">
                        {node.xpValue} XP
                      </span>
                      {status === "completed" && (
                        <CheckCircle2 size={16} className="text-[var(--success)]" />
                      )}
                      {status === "available" && (
                        <Circle size={16} className="text-[var(--text-muted)]" />
                      )}
                      {status === "locked" && <Lock size={16} className="text-[var(--text-muted)]" />}
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
          </Section>
        )}
      </PageContainer>
    );
  }

  const allEmpty = trackStats.every(({ completed }) => completed === 0);

  return (
    <PageContainer size="lg" className="space-y-8">
      <PageHeader
        eyebrow={`${tracks.length} learning paths`}
        title="Tracks"
        subtitle="Curated paths through the curriculum — pick a track and follow the sequence."
      />

      {allEmpty && subjects.length > 0 && (
        <Card variant="quiet">
          <EmptyState
            icon={<span aria-hidden>◎</span>}
            title="No tracks started yet"
            description="Pick a track below to start your first lessons."
          />
        </Card>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        {trackStats.map(({ track, completed, total }) => {
          const Icon = trackIcons[track.icon] ?? Circle;
          const pct = total > 0 ? completed / total : 0;
          const done = completed === total && total > 0;

          return (
            <Link key={track.id} to={`/tracks/${track.id}`}>
              <Card
                hover
                className="flex h-full gap-5 ring-offset-[var(--bg)] hover:ring-2 hover:ring-offset-2"
                style={{ "--tw-ring-color": `${track.color}40` } as CSSProperties}
              >
                <ProgressRing pct={pct} color={track.color} size={80}>
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-[var(--radius)]"
                    style={{ background: `${track.color}12` }}
                  >
                    <Icon size={22} style={{ color: track.color }} />
                  </div>
                </ProgressRing>
                <div className="min-w-0 flex-1 py-1">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-lg font-medium text-[var(--text-heading)]">{track.name}</h2>
                    {done && <CheckCircle2 size={16} className="shrink-0 text-[var(--success)]" />}
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[var(--text-muted)]">
                    {track.description}
                  </p>
                  <p className="mt-4 font-mono text-xs tabular-nums text-[var(--text-muted)]">
                    <span style={{ color: track.color }}>{completed}/{total}</span> lessons
                  </p>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </PageContainer>
  );
}
