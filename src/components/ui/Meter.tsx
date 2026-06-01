import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

interface MeterProps {
  /** Either a 0-100 number or a numerator/denominator pair. */
  value: number;
  max?: number;
  label?: ReactNode;
  hint?: ReactNode;
  tone?: "accent" | "success" | "warning" | "danger";
  size?: "xs" | "sm" | "md";
  className?: string;
  ariaLabel?: string;
}

const toneClass = {
  accent: "bg-[var(--accent)]",
  success: "bg-[var(--success)]",
  warning: "bg-[var(--warning)]",
  danger: "bg-[var(--danger)]",
} as const;

const sizeClass = {
  xs: "h-1",
  sm: "h-1.5",
  md: "h-2",
} as const;

/**
 * Meter — accessible progress bar.
 * Use for checklist completion, lesson progress, readiness.
 */
export function Meter({
  value,
  max = 100,
  label,
  hint,
  tone = "accent",
  size = "sm",
  className,
  ariaLabel,
}: MeterProps) {
  const denom = max <= 0 ? 100 : max;
  const pct = Math.max(0, Math.min(100, (value / denom) * 100));
  return (
    <div className={cn("min-w-0", className)}>
      {(label || hint) && (
        <div className="mb-1 flex items-baseline justify-between gap-3 text-xs">
          {label ? <span className="font-medium text-[var(--text)]">{label}</span> : <span />}
          {hint ? <span className="text-[var(--text-muted)] tabular-nums">{hint}</span> : null}
        </div>
      )}
      <div
        role="progressbar"
        aria-label={ariaLabel || (typeof label === "string" ? label : undefined)}
        aria-valuemin={0}
        aria-valuemax={denom}
        aria-valuenow={value}
        className={cn(
          "w-full overflow-hidden rounded-full bg-[var(--bg-sunken)] border border-[var(--rule)]",
          sizeClass[size],
        )}
      >
        <div
          className={cn("h-full rounded-full transition-[width] duration-500", toneClass[tone])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
