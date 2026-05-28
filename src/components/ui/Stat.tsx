import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

interface StatProps {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  trend?: "up" | "down" | "flat";
  icon?: ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const valueSize = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-3xl",
} as const;

/**
 * Stat — tabular-num metric block: label + value + optional sub.
 * Unstyled by container so it composes inside Cards or rows alike.
 */
export function Stat({ label, value, sub, trend, icon, size = "md", className }: StatProps) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className="eyebrow-mono flex items-center gap-1.5">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div
        className={cn(
          "mt-1 flex items-baseline gap-2 tabular-nums font-semibold tracking-tight text-[var(--text-heading)]",
          valueSize[size],
        )}
      >
        {value}
        {trend ? (
          <span
            aria-hidden
            className={cn(
              "text-xs font-medium",
              trend === "up" && "text-[var(--success-fg)]",
              trend === "down" && "text-[var(--danger-fg)]",
              trend === "flat" && "text-[var(--text-subtle)]",
            )}
          >
            {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"}
          </span>
        ) : null}
      </div>
      {sub ? <div className="mt-1 text-xs text-[var(--text-muted)]">{sub}</div> : null}
    </div>
  );
}
