import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  ClipboardList,
  Lock,
  Minus,
  Plus,
  Sparkles,
  Target,
} from "lucide-react";
import {
  Button,
  Card,
  EmptyState,
  Meter,
  PageContainer,
  PageHeader,
  PageLoading,
  Section,
  Stat,
  Tag,
} from "@/components/ui";
import { TrackDetailHeader } from "@/features/tracks/TrackDetailHeader";
import { loadSubjectResult } from "@/curriculum/loader";
import type { LoadSubjectResult } from "@/curriculum/loader";
import type { SkillNode, Subject } from "@/curriculum/types";
import { useProgress } from "@/stores/progress";
import { SatDiagnosticSection } from "@/features/sat/SatDiagnosticSection";
import { SatMistakeLogPanel } from "@/features/sat/SatMistakeLogPanel";
import { SatSkillMasterySection } from "@/features/sat/SatSkillMasterySection";
import { SatOfficialResourcesCard } from "@/features/sat/SatOfficialResourcesCard";
import { SatPracticeWeekCard } from "@/features/subjects/widgets/SatPracticeWeekCard";
import { SatRecommendedLessonsCard } from "@/features/sat/SatRecommendedLessonsCard";
import { getSatDailyStudyCommand } from "@/lib/satDailyStudy";
import { getTopMistakeCategories } from "@/lib/satMistakeTriage";
import { listMistakes } from "@/lib/satMistakeLog";
import { getSubjectAccent } from "@/lib/subjectAccent";
import { getSatSkillMastery } from "@/lib/satSkillMastery";
import { ROUTES } from "@/app/navigation";
import { cn } from "@/lib/cn";

type NodeStatus = "locked" | "available" | "completed";

const NODE_W = 184;
const NODE_H = 76;
const COL_GAP = 36;
const ROW_GAP = 24;

/** Approximate August 2026 SAT date for the countdown. */
const AUGUST_SAT_DATE = "2026-08-22";

interface TreeLayout {
  columns: SkillNode[][];
  orderedNodes: SkillNode[];
  edges: { from: string; to: string }[];
  positions: Map<string, { x: number; y: number }>;
  width: number;
  height: number;
}

function buildTreeLayout(nodes: SkillNode[]): TreeLayout {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const nodeIds = new Set(nodes.map((n) => n.id));
  const internalParents = (node: SkillNode) => node.parentIds.filter((pid) => nodeIds.has(pid));

  const layers = new Map<string, number>();
  const visiting = new Set<string>();

  function getLayer(id: string): number {
    const cached = layers.get(id);
    if (cached !== undefined) return cached;
    if (visiting.has(id)) return 0;
    visiting.add(id);
    const node = byId.get(id);
    if (!node) return 0;
    const parents = internalParents(node);
    const layer =
      parents.length === 0 ? 0 : Math.max(...parents.map((pid) => getLayer(pid) + 1));
    layers.set(id, layer);
    visiting.delete(id);
    return layer;
  }

  nodes.forEach((n) => getLayer(n.id));

  const maxLayer = Math.max(0, ...layers.values());
  const columns: SkillNode[][] = Array.from({ length: maxLayer + 1 }, () => []);
  for (const node of nodes) {
    columns[layers.get(node.id) ?? 0].push(node);
  }
  for (const col of columns) {
    col.sort((a, b) => a.name.localeCompare(b.name));
  }

  const orderedNodes = columns.flat();
  const edges: { from: string; to: string }[] = [];
  for (const node of nodes) {
    for (const parentId of internalParents(node)) {
      edges.push({ from: parentId, to: node.id });
    }
  }

  const colHeights = columns.map((col) =>
    col.length > 0 ? col.length * NODE_H + (col.length - 1) * ROW_GAP : 0,
  );
  const height = Math.max(NODE_H, ...colHeights);
  const positions = new Map<string, { x: number; y: number }>();

  columns.forEach((col, colIdx) => {
    const colHeight = col.length > 0 ? col.length * NODE_H + (col.length - 1) * ROW_GAP : NODE_H;
    const yOffset = (height - colHeight) / 2;
    col.forEach((node, rowIdx) => {
      positions.set(node.id, {
        x: colIdx * (NODE_W + COL_GAP),
        y: yOffset + rowIdx * (NODE_H + ROW_GAP),
      });
    });
  });

  const width =
    columns.length > 0 ? columns.length * NODE_W + (columns.length - 1) * COL_GAP : NODE_W;

  return { columns, orderedNodes, edges, positions, width, height };
}

function edgePath(from: { x: number; y: number }, to: { x: number; y: number }): string {
  const x1 = from.x + NODE_W;
  const y1 = from.y + NODE_H / 2;
  const x2 = to.x;
  const y2 = to.y + NODE_H / 2;
  const midX = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
}

function statusMeta(status: NodeStatus) {
  switch (status) {
    case "completed":
      return {
        label: "Done",
        icon: CheckCircle2,
        nodeClass:
          "border-[var(--success-border)] bg-[var(--bg-panel)] hover:border-[var(--success)]",
        dotClass: "bg-[var(--success)]",
        iconClass: "text-[var(--success)]",
        textClass: "text-[var(--text-heading)]",
        tagTone: "success" as const,
      };
    case "available":
      return {
        label: "Open",
        icon: Circle,
        nodeClass:
          "border-[var(--accent-border)] bg-[var(--bg-panel)] hover:border-[var(--accent)]",
        dotClass: "bg-[var(--accent)]",
        iconClass: "text-[var(--accent)]",
        textClass: "text-[var(--text-heading)]",
        tagTone: "accent" as const,
      };
    default:
      return {
        label: "Locked",
        icon: Lock,
        nodeClass: "border-[var(--rule)] bg-[var(--bg-sunken)] opacity-70",
        dotClass: "border border-[var(--rule-strong)] bg-[var(--bg-panel)]",
        iconClass: "text-[var(--text-subtle)]",
        textClass: "text-[var(--text-muted)]",
        tagTone: "muted" as const,
      };
  }
}

function SkillTreeLegend() {
  const items: { status: NodeStatus; label: string }[] = [
    { status: "completed", label: "Done" },
    { status: "available", label: "Open" },
    { status: "locked", label: "Locked" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {items.map(({ status, label }) => {
        const meta = statusMeta(status);
        return (
          <Tag key={status} tone={meta.tagTone} size="sm" mono>
            {label}
          </Tag>
        );
      })}
    </div>
  );
}

function nodeMeta(subject: Subject, node: SkillNode) {
  const byId = new Map(subject.nodes.map((n) => [n.id, n]));
  const prereqs = node.parentIds
    .map((id) => byId.get(id)?.name)
    .filter(Boolean) as string[];
  const unlocks = subject.nodes
    .filter((n) => n.parentIds.includes(node.id))
    .map((n) => n.name)
    .slice(0, 4);
  return { prereqs, unlocks };
}

function SkillNodeTooltip({
  node,
  status,
  subject,
}: {
  node: SkillNode;
  status: NodeStatus;
  subject: Subject;
}) {
  const { prereqs, unlocks } = nodeMeta(subject, node);
  const meta = statusMeta(status);

  return (
    <div
      className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-64 -translate-x-1/2 rounded-[var(--radius-md)] border border-[var(--rule-strong)] bg-[var(--bg-panel)] p-4 text-left opacity-0 shadow-[var(--shadow-md)] transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      role="tooltip"
    >
      <p className="text-xs font-medium text-[var(--text-heading)]">{node.name}</p>
      <p className="mt-1 font-mono text-[11px] text-[var(--text-muted)] tabular-nums">
        {meta.label} · ~{node.estimatedMinutes} min · {node.xpValue} XP
      </p>
      {prereqs.length > 0 && (
        <p className="mt-2 text-[10px] leading-relaxed text-[var(--text-muted)]">
          <span className="text-[var(--text-heading)]">Requires:</span> {prereqs.join(", ")}
        </p>
      )}
      {unlocks.length > 0 && (
        <p className="mt-1 text-[10px] leading-relaxed text-[var(--text-muted)]">
          <span className="text-[var(--text-heading)]">Unlocks:</span> {unlocks.join(", ")}
        </p>
      )}
    </div>
  );
}

function SkillNodeCard({
  node,
  status,
  compact = false,
}: {
  node: SkillNode;
  status: NodeStatus;
  compact?: boolean;
}) {
  const meta = statusMeta(status);
  const Icon = meta.icon;

  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-[var(--radius)] border p-3 transition-colors",
        meta.nodeClass,
        compact && "min-h-[76px]",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate font-mono text-[10px] font-medium text-[var(--text-subtle)] tabular-nums">
          {node.id}
        </span>
        <Icon size={compact ? 12 : 14} className={cn("shrink-0", meta.iconClass)} aria-hidden />
      </div>
      <h3 className={cn("mt-1.5 line-clamp-3 text-[12px] font-medium leading-snug", meta.textClass)}>
        {node.name}
      </h3>
      {!compact && (
        <p className="mt-1 line-clamp-2 text-xs text-[var(--text-muted)]">{node.description}</p>
      )}
      <div className="mt-auto pt-2">
        <span className="font-mono text-[10px] text-[var(--text-subtle)] tabular-nums">
          {node.xpValue} XP
        </span>
      </div>
    </div>
  );
}

function SkillTreeGraph({
  subject,
  layout,
  getNodeStatus,
}: {
  subject: Subject;
  layout: TreeLayout;
  getNodeStatus: (node: SkillNode) => NodeStatus;
}) {
  const { edges, positions, width, height } = layout;
  const pad = 24;
  const [scale, setScale] = useState(1);

  const nodeById = useMemo(
    () => new Map(subject.nodes.map((n) => [n.id, n])),
    [subject.nodes],
  );

  const zoomIn = () => setScale((s) => Math.min(1.5, Math.round((s + 0.1) * 10) / 10));
  const zoomOut = () => setScale((s) => Math.max(0.6, Math.round((s - 0.1) * 10) / 10));
  const zoomReset = () => setScale(1);

  return (
    <div className="relative overflow-x-auto rounded-[var(--radius-md)] border border-[var(--rule)] bg-[var(--bg-canvas)]">
      <div className="absolute right-3 top-3 z-10 flex gap-1">
        <Button variant="secondary" size="sm" className="h-8 w-8 p-0" onClick={zoomOut} aria-label="Zoom out">
          <Minus size={13} />
        </Button>
        <Button variant="secondary" size="sm" className="h-8 min-w-12 px-2 font-mono" onClick={zoomReset}>
          {Math.round(scale * 100)}%
        </Button>
        <Button variant="secondary" size="sm" className="h-8 w-8 p-0" onClick={zoomIn} aria-label="Zoom in">
          <Plus size={13} />
        </Button>
      </div>
      <div
        className="relative mx-auto origin-top-left p-8"
        style={{
          width: (width + pad * 2) * scale,
          minHeight: (height + pad * 2) * scale,
        }}
      >
        <div
          className="relative"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            width: width + pad * 2,
            minHeight: height + pad * 2,
          }}
        >
          <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
            {edges.map(({ from, to }) => {
              const fromPos = positions.get(from);
              const toPos = positions.get(to);
              if (!fromPos || !toPos) return null;
              const parent = nodeById.get(from);
              const active = parent ? getNodeStatus(parent) === "completed" : false;
              return (
                <path
                  key={`${from}-${to}`}
                  d={edgePath(
                    { x: fromPos.x + pad, y: fromPos.y + pad },
                    { x: toPos.x + pad, y: toPos.y + pad },
                  )}
                  fill="none"
                  stroke={active ? "var(--accent)" : "var(--rule-strong)"}
                  strokeWidth={active ? 1.5 : 1}
                  opacity={active ? 0.7 : 0.45}
                />
              );
            })}
          </svg>

          {subject.nodes.map((node) => {
            const pos = positions.get(node.id);
            if (!pos) return null;
            const status = getNodeStatus(node);
            const locked = status === "locked";

            return (
              <Link
                key={node.id}
                to={locked ? "#" : `/subjects/${subject.id}/${node.id}`}
                className={cn(
                  "group absolute block",
                  locked
                    ? "pointer-events-none cursor-not-allowed"
                    : "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-canvas)]",
                )}
                style={{
                  left: pos.x + pad,
                  top: pos.y + pad,
                  width: NODE_W,
                  height: NODE_H,
                }}
                aria-disabled={locked}
              >
                {!locked && <SkillNodeTooltip node={node} status={status} subject={subject} />}
                <SkillNodeCard node={node} status={status} compact />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SkillNodeList({
  subject,
  nodes,
  getNodeStatus,
}: {
  subject: Subject;
  nodes: SkillNode[];
  getNodeStatus: (node: SkillNode) => NodeStatus;
}) {
  return (
    <div className="relative space-y-0">
      <div
        className="absolute bottom-4 left-[11px] top-4 w-px bg-[var(--rule-strong)]"
        aria-hidden
      />
      {nodes.map((node, index) => {
        const status = getNodeStatus(node);
        const meta = statusMeta(status);
        const locked = status === "locked";

        return (
          <Link
            key={node.id}
            to={locked ? "#" : `/subjects/${subject.id}/${node.id}`}
            className={cn(
              "relative block pl-8",
              locked ? "pointer-events-none" : "group",
              index > 0 && "mt-3",
            )}
            aria-disabled={locked}
          >
            <span
              className={cn(
                "absolute left-0 top-5 z-[1] h-6 w-6 rounded-full border-2 border-[var(--bg-canvas)]",
                meta.dotClass,
              )}
              aria-hidden
            />
            <SkillNodeCard node={node} status={status} />
          </Link>
        );
      })}
    </div>
  );
}

type SubjectLoadState =
  | { phase: "loading" }
  | { phase: "ok"; subject: Subject }
  | { phase: "error"; reason: Exclude<LoadSubjectResult["status"], "ok"> };

function unavailableDescription(reason: Exclude<LoadSubjectResult["status"], "ok">): string {
  switch (reason) {
    case "not_listed":
      return "That subject isn't in the catalog. The link may be wrong, or it may have been removed.";
    case "missing_file":
      return "This course is listed but its content file hasn't been added yet. Check back later.";
    case "invalid_data":
      return "This course's data couldn't be read. It may be incomplete or formatted incorrectly.";
  }
}

function daysUntil(dateString: string): number {
  const target = new Date(`${dateString}T12:00:00`);
  const today = new Date();
  const start = new Date(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
      today.getDate(),
    ).padStart(2, "0")}T12:00:00`,
  );
  return Math.max(0, Math.round((target.getTime() - start.getTime()) / 86_400_000));
}

function SatHeroBand({ subject, completed }: { subject: Subject; completed: number }) {
  const total = subject.nodes.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const days = daysUntil(AUGUST_SAT_DATE);
  const weakest = useMemo(
    () => getSatSkillMastery([subject]).find((row) => row.hasSignal) ?? null,
    [subject],
  );
  return (
    <Card variant="primary" density="roomy" className="min-w-0">
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--rule)] pb-3">
        <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: getSubjectAccent(subject.id) }} />
        <span className="eyebrow-mono">August SAT command center</span>
        <Tag tone="accent" size="sm" mono className="ml-auto gap-1">
          <Calendar size={11} aria-hidden />
          T-{days} days
        </Tag>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Stat label="Skill tree" value={`${pct}%`} sub={`${completed}/${total} done`} />
        <Stat label="Days to SAT" value={days} sub="Aug 22, 2026" />
        <Stat label="Track" value="August" sub="75 lessons" />
      </div>
      <div className="mt-4">
        <Meter value={pct} ariaLabel="August SAT progress" />
      </div>
      {weakest ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--rule)] pt-3 text-sm">
          <span className="text-[var(--text-muted)]">Weakest skill</span>
          <span className="font-medium text-[var(--text-heading)]">{weakest.label}</span>
          <Link to={`${ROUTES.satDrill}?skill=${weakest.skillId}`} className="ml-auto">
            <Button variant="secondary" size="sm">
              <Target size={14} aria-hidden />
              Drill it
            </Button>
          </Link>
        </div>
      ) : null}
    </Card>
  );
}

function SatMistakesPrimary() {
  const top = useMemo(() => getTopMistakeCategories(3), []);
  const total = useMemo(() => listMistakes().length, []);
  return (
    <Card variant="default" density="normal" className="min-w-0">
      <div className="flex items-center gap-2 border-b border-[var(--rule)] pb-3">
        <Target size={14} className="text-[var(--text-muted)]" aria-hidden />
        <p className="eyebrow-mono">Mistakes to drill</p>
        <Tag tone="mono" size="sm" className="ml-auto">
          {total} logged
        </Tag>
      </div>
      <div className="mt-3 space-y-2">
        {top.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">
            Log misses below after a Bluebook or Khan session — the top three categories will show
            up here so retarget drills stay focused.
          </p>
        ) : (
          top.map((row) => (
            <div
              key={row.category}
              className="flex items-baseline justify-between gap-3 rounded-[var(--radius)] border border-[var(--rule)] bg-[var(--bg-sunken)] px-3 py-2 text-sm"
            >
              <span className="min-w-0 truncate font-medium text-[var(--text)]">{row.category}</span>
              <Tag tone="warning" size="sm" mono>
                {row.count} {row.count === 1 ? "miss" : "misses"}
              </Tag>
            </div>
          ))
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link to="/subjects/sat-prep#mistakes">
          <Button variant="secondary" size="sm">
            <ClipboardList size={14} aria-hidden />
            Open mistake log
          </Button>
        </Link>
        <Link to="/subjects/sat-prep#recommended">
          <Button variant="ghost" size="sm">
            Suggestions
            <ArrowRight size={12} aria-hidden />
          </Button>
        </Link>
      </div>
    </Card>
  );
}

function SatTodayPrimary({
  subject,
  getNodeStatus,
}: {
  subject: Subject;
  getNodeStatus: (node: SkillNode) => NodeStatus;
}) {
  const study = getSatDailyStudyCommand({ subjects: [subject], getNodeStatus });
  if (!study) return null;
  return (
    <Card variant="primary" density="normal" className="min-w-0">
      <div className="flex items-center gap-2 border-b border-[var(--rule)] pb-3">
        <Sparkles size={14} className="text-[var(--accent)]" aria-hidden />
        <p className="eyebrow-mono">SAT today</p>
      </div>
      <div className="mt-3 space-y-2">
        <h3 className="text-base font-semibold text-[var(--text-heading)]">{study.headline}</h3>
        <p className="text-sm leading-relaxed text-[var(--text-muted)]">{study.detail}</p>
        {study.diagnosticNote ? (
          <p className="text-xs text-[var(--text-subtle)]">{study.diagnosticNote}</p>
        ) : null}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link to={study.href} className="min-w-0">
          <Button className="max-w-full">
            <span className="truncate">{study.buttonLabel}</span>
            <ArrowRight size={14} aria-hidden className="shrink-0" />
          </Button>
        </Link>
      </div>
    </Card>
  );
}

export function SubjectDetailPage() {
  const { subjectId = "" } = useParams();
  const location = useLocation();
  const progressNodes = useProgress((s) => s.data.nodes);
  const getNodeStatus = useProgress((s) => s.getNodeStatus);
  const [loadState, setLoadState] = useState<SubjectLoadState>({ phase: "loading" });
  const [skillTreeOpen, setSkillTreeOpen] = useState(true);
  const [secondaryOpen, setSecondaryOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadState({ phase: "loading" });
    loadSubjectResult(subjectId).then((result) => {
      if (cancelled) return;
      if (result.status === "ok") {
        setLoadState({ phase: "ok", subject: result.subject });
      } else {
        setLoadState({ phase: "error", reason: result.status });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [subjectId]);

  useEffect(() => {
    if (subjectId !== "sat-prep" || loadState.phase !== "ok") return;
    const hash = location.hash.replace("#", "");
    if (
      hash !== "mistakes" &&
      hash !== "official" &&
      hash !== "recommended" &&
      hash !== "diagnostic" &&
      hash !== "skills"
    ) {
      return;
    }
    if (hash === "diagnostic" || hash === "official") {
      setSecondaryOpen(true);
    }
    const target = document.getElementById(hash);
    if (!target) return;
    requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [subjectId, loadState.phase, location.hash]);

  const layout = useMemo(
    () => (loadState.phase === "ok" ? buildTreeLayout(loadState.subject.nodes) : null),
    [loadState],
  );

  const completedCount = useMemo(() => {
    if (loadState.phase !== "ok") return 0;
    return loadState.subject.nodes.filter((n) => getNodeStatus(n) === "completed").length;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `progressNodes` is the recompute trigger; getNodeStatus is a stable store selector
  }, [loadState, getNodeStatus, progressNodes]);

  if (loadState.phase === "loading") {
    return <PageLoading size="xl" />;
  }

  if (loadState.phase === "error") {
    return (
      <PageContainer size="wide" className="space-y-6">
        <PageHeader backTo={{ to: "/subjects", label: "Subjects" }} divider={false} />
        <EmptyState
          title="Course not available yet"
          description={unavailableDescription(loadState.reason)}
          actionLabel="Browse subjects"
          actionTo="/subjects"
        />
      </PageContainer>
    );
  }

  if (loadState.phase !== "ok" || !layout) {
    return null;
  }

  const { subject } = loadState;
  const isSatPrep = subject.id === "sat-prep";

  return (
    <PageContainer size="xl" className="space-y-7">
      <PageHeader backTo={{ to: "/subjects", label: "Subjects" }} divider={false} />

      {!isSatPrep ? (
        <TrackDetailHeader
          name={subject.name}
          description={subject.description}
          color={getSubjectAccent(subject.id)}
          icon={BookOpen}
          completed={completedCount}
          total={subject.nodes.length}
          className="mt-4"
        />
      ) : (
        <SatHeroBand subject={subject} completed={completedCount} />
      )}

      {isSatPrep ? (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <SatTodayPrimary subject={subject} getNodeStatus={getNodeStatus} />
            <SatMistakesPrimary />
          </div>

          <Section eyebrow="Recommended" id="recommended">
            <SatRecommendedLessonsCard subjects={[subject]} getNodeStatus={getNodeStatus} />
          </Section>

          <Section eyebrow="Practice rhythm">
            <Card variant="default" density="normal" className="min-w-0">
              <SatPracticeWeekCard />
            </Card>
          </Section>

          <Section eyebrow="Skill mastery" id="skills" divider>
            <SatSkillMasterySection subject={subject} />
          </Section>

          <Section eyebrow="Mistake log" id="mistakes" divider>
            <SatMistakeLogPanel />
          </Section>

          <section className="space-y-3" aria-label="Optional SAT tools">
            <button
              type="button"
              onClick={() => setSecondaryOpen((v) => !v)}
              className="flex w-full items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--rule)] bg-[var(--bg-canvas)] px-4 py-3 text-left transition hover:border-[var(--rule-strong)]"
              aria-expanded={secondaryOpen}
            >
              <div className="min-w-0">
                <p className="eyebrow-mono">Optional · diagnostic & official</p>
                <p className="mt-0.5 text-sm text-[var(--text-muted)]">
                  In-app baseline (Drafts 1/2/3) and Bluebook/Khan reference links.
                </p>
              </div>
              {secondaryOpen ? (
                <ChevronUp size={16} className="shrink-0 text-[var(--text-subtle)]" aria-hidden />
              ) : (
                <ChevronDown size={16} className="shrink-0 text-[var(--text-subtle)]" aria-hidden />
              )}
            </button>
            {secondaryOpen ? (
              <div className="space-y-4">
                <div id="diagnostic" className="scroll-mt-6">
                  <SatDiagnosticSection />
                </div>
                <SatOfficialResourcesCard id="official" />
              </div>
            ) : null}
          </section>
        </>
      ) : null}

      <Section
        eyebrow={isSatPrep ? "Skill map" : "Skill tree"}
        actions={
          <div className="flex items-center gap-3">
            <SkillTreeLegend />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSkillTreeOpen((v) => !v)}
              aria-expanded={skillTreeOpen}
            >
              {skillTreeOpen ? "Collapse" : "Expand"}
              {skillTreeOpen ? (
                <ChevronUp size={13} aria-hidden />
              ) : (
                <ChevronDown size={13} aria-hidden />
              )}
            </Button>
          </div>
        }
        divider
      >
        {skillTreeOpen ? (
          <>
            <div className="md:hidden">
              <SkillNodeList
                subject={subject}
                nodes={layout.orderedNodes}
                getNodeStatus={getNodeStatus}
              />
            </div>
            <div className="hidden md:block">
              <SkillTreeGraph subject={subject} layout={layout} getNodeStatus={getNodeStatus} />
            </div>
          </>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">
            {completedCount} of {subject.nodes.length} lessons complete. Expand to see the full tree.
          </p>
        )}
      </Section>
    </PageContainer>
  );
}
