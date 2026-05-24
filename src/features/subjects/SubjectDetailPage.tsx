import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { BookOpen, ChevronLeft, Lock, CheckCircle2, Circle, Minus, Plus } from "lucide-react";
import { Button, Card, EmptyState } from "@/components/ui";
import { TrackDetailHeader } from "@/features/tracks/TrackDetailHeader";
import { loadSubjectResult } from "@/curriculum/loader";
import type { LoadSubjectResult } from "@/curriculum/loader";
import type { SkillNode, Subject } from "@/curriculum/types";
import { useProgress } from "@/stores/progress";
import { SatMistakeLogPanel } from "@/features/sat/SatMistakeLogPanel";
import { SatOfficialResourcesCard } from "@/features/sat/SatOfficialResourcesCard";
import { cn } from "@/lib/cn";

type NodeStatus = "locked" | "available" | "completed";

const NODE_W = 184;
const NODE_H = 76;
const COL_GAP = 36;
const ROW_GAP = 24;

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

function edgePath(
  from: { x: number; y: number },
  to: { x: number; y: number },
): string {
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
          "border-[var(--success)]/50 bg-[var(--success-bg)]/30 transition-colors hover:border-[var(--success)]/70",
        dotClass: "bg-[var(--success)]",
        iconClass: "text-[var(--success)]",
        textClass: "text-[var(--text-heading)]",
        legendClass: "border-[var(--success)]/40 bg-[var(--success-bg)]/20",
      };
    case "available":
      return {
        label: "Open",
        icon: Circle,
        nodeClass:
          "border-[var(--border-strong)] bg-[var(--bg-elevated)] ring-1 ring-[var(--accent)]/30 transition-colors hover:border-[var(--accent)]/50 hover:ring-[var(--accent)]/45",
        dotClass: "bg-[var(--accent)]",
        iconClass: "text-[var(--accent)]",
        textClass: "text-[var(--text-heading)]",
        legendClass: "border-[var(--accent)]/40 bg-[var(--accent-bg)]/30",
      };
    default:
      return {
        label: "Locked",
        icon: Lock,
        nodeClass: "border-[var(--border-strong)] bg-[var(--bg-secondary)]/60 opacity-70",
        dotClass: "border border-[var(--border-strong)] bg-[var(--bg-elevated)]",
        iconClass: "text-[var(--text-muted)]",
        textClass: "text-[var(--text-muted)]",
        legendClass: "border-[var(--border-strong)] bg-[var(--bg-secondary)]/60",
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
    <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-muted)]">
      {items.map(({ status, label }) => {
        const meta = statusMeta(status);
        const Icon = meta.icon;
        return (
          <span
            key={status}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border px-2 py-1 font-medium",
              meta.legendClass,
            )}
          >
            <Icon size={12} className={meta.iconClass} aria-hidden />
            {label}
          </span>
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
      className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-64 -translate-x-1/2 rounded-[var(--radius)] border border-[var(--border-strong)] bg-[var(--bg-elevated)] p-4 text-left opacity-0 shadow-[var(--shadow-md)] transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      role="tooltip"
    >
      <p className="text-xs font-medium text-[var(--text-heading)]">{node.name}</p>
      <p className="mt-1 text-[11px] text-[var(--text-muted)]">
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
  const locked = status === "locked";

  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-[var(--radius)] border p-3",
        meta.nodeClass,
        compact ? "min-h-[76px]" : "",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className="truncate font-mono text-[10px] font-medium tabular-nums text-[var(--text-muted)]"
        >
          {node.id}
        </span>
        <Icon size={compact ? 13 : 15} className={cn("shrink-0", meta.iconClass)} />
      </div>
      <h3
        className={cn(
          "mt-1.5 line-clamp-3 text-[12px] font-medium leading-snug",
          meta.textClass,
        )}
      >
        {node.name}
      </h3>
      {!compact && (
        <p className="mt-1 line-clamp-2 text-xs text-[var(--text-muted)]">{node.description}</p>
      )}
      <div className="mt-auto pt-2">
        <span
          className={cn(
            "font-mono text-[10px] tabular-nums",
            locked ? "text-[var(--text-muted)]" : "text-[var(--text-muted)]",
          )}
        >
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
    <div className="relative overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-elevated)]">
      <div className="absolute right-3 top-3 z-10 flex gap-1">
        <Button variant="secondary" className="h-8 w-8 p-0" onClick={zoomOut} aria-label="Zoom out">
          <Minus size={14} />
        </Button>
        <Button variant="secondary" className="h-8 min-w-10 px-2 font-mono text-xs" onClick={zoomReset}>
          {Math.round(scale * 100)}%
        </Button>
        <Button variant="secondary" className="h-8 w-8 p-0" onClick={zoomIn} aria-label="Zoom in">
          <Plus size={14} />
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
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          aria-hidden
        >
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
                stroke={active ? "var(--accent)" : "var(--border-strong)"}
                strokeWidth={active ? 1.5 : 1}
                opacity={active ? 0.65 : 0.35}
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
                  : "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-elevated)]",
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
        className="absolute bottom-4 left-[11px] top-4 w-px bg-[var(--border-strong)]"
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
              index > 0 ? "mt-3" : "",
            )}
            aria-disabled={locked}
          >
            <span
              className={cn(
                "absolute left-0 top-5 z-[1] h-6 w-6 rounded-full border-2 border-[var(--bg)]",
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

export function SubjectDetailPage() {
  const { subjectId = "" } = useParams();
  const location = useLocation();
  const progressNodes = useProgress((s) => s.data.nodes);
  const getNodeStatus = useProgress((s) => s.getNodeStatus);
  const [loadState, setLoadState] = useState<SubjectLoadState>({ phase: "loading" });

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
    if (hash !== "mistakes" && hash !== "official") return;
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
  }, [loadState, getNodeStatus, progressNodes]);

  if (loadState.phase === "loading") {
    return <div className="p-8 text-[var(--text-muted)]">Loading subject…</div>;
  }

  if (loadState.phase === "error") {
    return (
      <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-8">
        <Link
          to="/subjects"
          className="inline-flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
        >
          <ChevronLeft size={16} />
          Subjects
        </Link>
        <Card>
          <EmptyState
            title="Course not available yet"
            description={unavailableDescription(loadState.reason)}
            actionLabel="Browse subjects"
            actionTo="/subjects"
          />
        </Card>
      </div>
    );
  }

  if (loadState.phase !== "ok") {
    return null;
  }

  if (!layout) {
    return null;
  }

  const { subject } = loadState;
  const isSatPrep = subject.id === "sat-prep";

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 md:p-8">
      <Link
        to="/subjects"
        className="inline-flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
      >
        <ChevronLeft size={16} />
        Subjects
      </Link>

      <TrackDetailHeader
        name={subject.name}
        description={subject.description}
        color={subject.color}
        icon={BookOpen}
        completed={completedCount}
        total={subject.nodes.length}
        className="mt-4"
      />

      {isSatPrep ? (
        <div id="mistakes" className="scroll-mt-6">
          <SatMistakeLogPanel />
        </div>
      ) : null}

      <section className="space-y-5 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-sm font-medium uppercase tracking-widest text-[var(--text-muted)]">
            Skill tree
          </h2>
          <SkillTreeLegend />
        </div>

        {isSatPrep ? <SatOfficialResourcesCard id="official" /> : null}

        <div className="md:hidden">
          <SkillNodeList
            subject={subject}
            nodes={layout.orderedNodes}
            getNodeStatus={getNodeStatus}
          />
        </div>

        <div className="hidden md:block">
          <SkillTreeGraph
            subject={subject}
            layout={layout}
            getNodeStatus={getNodeStatus}
          />
        </div>
      </section>
    </div>
  );
}
