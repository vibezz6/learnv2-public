import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft, Lock, CheckCircle2, Circle } from "lucide-react";
import { Badge, Button, Card } from "@/components/ui";
import { loadSubject } from "@/curriculum/loader";
import type { SkillNode, Subject } from "@/curriculum/types";
import { useProgress } from "@/stores/progress";
import { cn } from "@/lib/cn";

type NodeStatus = "locked" | "available" | "completed";

const NODE_W = 152;
const NODE_H = 92;
const COL_GAP = 28;
const ROW_GAP = 14;

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
        label: "Completed",
        icon: CheckCircle2,
        nodeClass:
          "border-[var(--success)] bg-[var(--success-bg)] shadow-[0_0_0_1px_rgba(var(--success-rgb),0.4),0_0_16px_rgba(var(--success-rgb),0.12)]",
        dotClass: "bg-[var(--success)] shadow-[0_0_6px_rgba(var(--success-rgb),0.55)]",
        iconClass: "text-[var(--success)]",
        textClass: "text-[var(--text-heading)]",
        legendClass:
          "border-[var(--success)] bg-[var(--success-bg)] shadow-[0_0_0_1px_rgba(var(--success-rgb),0.35)]",
      };
    case "available":
      return {
        label: "Available",
        icon: Circle,
        nodeClass:
          "border-[var(--accent-border)] bg-[var(--accent-bg)] shadow-[var(--accent-glow)] hover:border-[var(--accent)] hover:shadow-[0_0_24px_rgba(var(--accent-rgb),0.22)]",
        dotClass: "bg-[var(--accent)] shadow-[0_0_8px_rgba(var(--accent-rgb),0.65)]",
        iconClass: "text-[var(--accent)]",
        textClass: "text-[var(--text-heading)]",
        legendClass:
          "border-[var(--accent-border)] bg-[var(--accent-bg)] shadow-[var(--accent-glow)]",
      };
    default:
      return {
        label: "Locked",
        icon: Lock,
        nodeClass:
          "border border-dashed border-[var(--border-strong)] bg-[var(--bg-secondary)]/80 saturate-[0.65]",
        dotClass: "border border-dashed border-[var(--border-strong)] bg-[var(--bg-elevated)]",
        iconClass: "text-[var(--text-muted)]",
        textClass: "text-[var(--text-muted)]",
        legendClass:
          "border border-dashed border-[var(--border-strong)] bg-[var(--bg-secondary)]/80",
      };
  }
}

function SkillTreeLegend() {
  const items: { status: NodeStatus; label: string }[] = [
    { status: "completed", label: "Completed" },
    { status: "available", label: "Available" },
    { status: "locked", label: "Locked" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
      {items.map(({ status, label }) => {
        const meta = statusMeta(status);
        const Icon = meta.icon;
        return (
          <span key={status} className="inline-flex items-center gap-2">
            <span
              className={cn(
                "inline-flex h-6 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border",
                meta.legendClass,
              )}
            >
              <Icon size={12} className={meta.iconClass} />
            </span>
            {label}
          </span>
        );
      })}
    </div>
  );
}

function SkillNodeCard({
  node,
  status,
  subjectColor,
  compact = false,
}: {
  node: SkillNode;
  status: NodeStatus;
  subjectColor: string;
  compact?: boolean;
}) {
  const meta = statusMeta(status);
  const Icon = meta.icon;
  const locked = status === "locked";

  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-[var(--radius)] border p-3 transition",
        meta.nodeClass,
        compact ? "min-h-[92px]" : "",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className="inline-flex h-5 shrink-0 items-center rounded px-1.5 font-mono text-[10px] font-semibold uppercase tracking-wide"
          style={{ background: `${subjectColor}18`, color: subjectColor }}
        >
          {node.id}
        </span>
        <Icon size={compact ? 14 : 16} className={cn("shrink-0", meta.iconClass)} />
      </div>
      <h3
        className={cn(
          "mt-1.5 line-clamp-2 text-sm font-semibold leading-snug",
          meta.textClass,
        )}
      >
        {node.name}
      </h3>
      {!compact && (
        <p className="mt-1 line-clamp-2 text-xs text-[var(--text-muted)]">{node.description}</p>
      )}
      {locked && node.parentIds.length > 0 && (
        <p className="mt-1 line-clamp-1 text-[10px] text-[var(--text-muted)]">
          Requires prior lessons
        </p>
      )}
      <div className="mt-auto flex items-center justify-between pt-1.5">
        <span
          className={cn(
            "font-mono text-[10px]",
            locked ? "text-[var(--text-muted)]" : "text-[var(--accent)]",
          )}
        >
          {node.xpValue} XP
        </span>
        <span className={cn("text-[10px] font-medium", meta.iconClass)}>{meta.label}</span>
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

  const nodeById = useMemo(
    () => new Map(subject.nodes.map((n) => [n.id, n])),
    [subject.nodes],
  );

  return (
    <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-secondary)]/40">
      <div
        className="relative mx-auto bg-[linear-gradient(var(--grid-line)_1px,transparent_1px),linear-gradient(90deg,var(--grid-line)_1px,transparent_1px)] bg-size-[24px_24px] p-6"
        style={{ width: width + pad * 2, minHeight: height + pad * 2 }}
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
                strokeWidth={active ? 2 : 1.5}
                strokeDasharray={active ? undefined : "6 5"}
                opacity={active ? 0.85 : 0.4}
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
                "absolute block transition-transform duration-150",
                locked
                  ? "pointer-events-none cursor-not-allowed"
                  : "hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-secondary)]",
              )}
              style={{
                left: pos.x + pad,
                top: pos.y + pad,
                width: NODE_W,
                height: NODE_H,
              }}
              aria-disabled={locked}
            >
              <SkillNodeCard
                node={node}
                status={status}
                subjectColor={subject.color}
                compact
              />
            </Link>
          );
        })}
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
            <div
              className={cn(
                "stagger-item transition",
                !locked && "group-hover:scale-[1.01]",
                locked && "opacity-80",
              )}
              style={{ animationDelay: `${index * 35}ms` }}
            >
              <SkillNodeCard node={node} status={status} subjectColor={subject.color} />
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function ProgressSummary({
  completed,
  total,
  color,
}: {
  completed: number;
  total: number;
  color: string;
  children?: ReactNode;
}) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-[var(--text-heading)]">Skill progress</p>
          <p className="text-xs text-[var(--text-muted)]">
            {completed} of {total} lessons completed
          </p>
        </div>
        <Badge>{pct}%</Badge>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[var(--border)]">
        <div
          className="h-full rounded-full transition-[width]"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </Card>
  );
}

export function SubjectDetailPage() {
  const { subjectId = "" } = useParams();
  const progressNodes = useProgress((s) => s.data.nodes);
  const getNodeStatus = useProgress((s) => s.getNodeStatus);
  const [subject, setSubject] = useState<Subject | null>(null);

  useEffect(() => {
    loadSubject(subjectId).then((s) => setSubject(s ?? null));
  }, [subjectId]);

  const layout = useMemo(
    () => (subject ? buildTreeLayout(subject.nodes) : null),
    [subject],
  );

  const completedCount = useMemo(() => {
    if (!subject) return 0;
    return subject.nodes.filter((n) => getNodeStatus(n) === "completed").length;
  }, [subject, getNodeStatus, progressNodes]);

  if (!subject || !layout) {
    return <div className="p-8 text-[var(--text-muted)]">Loading subject…</div>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-8">
      <Link
        to="/subjects"
        className="inline-flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
      >
        <ChevronLeft size={16} />
        Subjects
      </Link>

      <div>
        <div
          className="mb-3 h-1 w-12 rounded-full"
          style={{ background: subject.color }}
        />
        <Badge>{subject.id}</Badge>
        <h1 className="mt-2 text-3xl font-bold text-[var(--text-heading)]">{subject.name}</h1>
        <p className="text-[var(--text-muted)]">{subject.description}</p>
      </div>

      <ProgressSummary
        completed={completedCount}
        total={subject.nodes.length}
        color={subject.color}
      />

      <div className="space-y-3 md:-mx-4 md:max-w-none lg:-mx-8">
        <div className="flex flex-wrap items-center justify-between gap-3 md:px-4 lg:px-8">
          <h2 className="text-lg font-semibold text-[var(--text-heading)]">Skill tree</h2>
          <SkillTreeLegend />
        </div>

        <div className="md:hidden">
          <SkillNodeList
            subject={subject}
            nodes={layout.orderedNodes}
            getNodeStatus={getNodeStatus}
          />
        </div>

        <div className="hidden md:block md:px-4 lg:px-8">
          <SkillTreeGraph
            subject={subject}
            layout={layout}
            getNodeStatus={getNodeStatus}
          />
        </div>
      </div>

      <Link to="/subjects">
        <Button variant="secondary">All subjects</Button>
      </Link>
    </div>
  );
}
