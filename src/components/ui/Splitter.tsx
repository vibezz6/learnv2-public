import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

interface SplitterProps {
  label?: ReactNode;
  tone?: "default" | "danger";
  className?: string;
}

/**
 * Splitter — labeled hairline divider.
 * Used inside long pages (e.g. Settings) to separate logical groupings.
 */
export function Splitter({ label, tone = "default", className }: SplitterProps) {
  if (!label) {
    return (
      <hr
        className={cn(
          "border-0",
          tone === "danger"
            ? "h-px bg-[var(--danger-border)]"
            : "h-px bg-[var(--rule)]",
          className,
        )}
      />
    );
  }
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span
        aria-hidden
        className={cn(
          "h-px flex-1",
          tone === "danger" ? "bg-[var(--danger-border)]" : "bg-[var(--rule)]",
        )}
      />
      <span
        className={cn(
          "eyebrow-mono",
          tone === "danger" && "text-[var(--danger-fg)]",
        )}
      >
        {label}
      </span>
      <span
        aria-hidden
        className={cn(
          "h-px flex-1",
          tone === "danger" ? "bg-[var(--danger-border)]" : "bg-[var(--rule)]",
        )}
      />
    </div>
  );
}
