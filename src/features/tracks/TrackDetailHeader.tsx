import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

interface Props {
  name: string;
  description: string;
  color: string;
  icon: LucideIcon;
  completed: number;
  total: number;
  className?: string;
}

/** Sticky terminal-style header for track / subject detail views */
export function TrackDetailHeader({
  name,
  description,
  color,
  icon: Icon,
  completed,
  total,
  className,
}: Props) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div
      className={cn(
        "sticky top-0 z-20 -mx-4 border-b border-[var(--border-strong)] bg-[var(--bg)]/95 px-4 py-5 shadow-[var(--shadow-md)] backdrop-blur-md md:-mx-8 md:px-8",
        className,
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-lg)] border border-[var(--border)]"
            style={{ background: `${color}14`, color }}
          >
            <Icon size={22} strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-heading)]">
              {name}
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--text-muted)]">
              {description}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3 self-start sm:self-center">
          <div className="rounded-full border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-3 py-1.5 font-mono text-sm">
            <span style={{ color }}>{completed}/{total}</span>
            <span className="ml-2 text-[10px] font-medium uppercase tracking-widest text-[var(--text-muted)]">
              complete
            </span>
          </div>
          <span className="font-mono text-xs tabular-nums text-[var(--text-muted)]">{pct}%</span>
        </div>
      </div>
    </div>
  );
}
