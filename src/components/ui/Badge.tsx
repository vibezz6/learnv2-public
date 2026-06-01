import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[var(--radius-sm)] border border-[var(--border)] px-2 py-0.5",
        "font-mono text-[11px] uppercase tracking-wide text-[var(--accent)]",
        className,
      )}
      {...props}
    />
  );
}
