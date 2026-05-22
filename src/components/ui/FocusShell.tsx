import { cn } from "@/lib/cn";
import type { HTMLAttributes, ReactNode } from "react";

interface FocusShellProps extends HTMLAttributes<HTMLDivElement> {
  active: boolean;
  chrome?: ReactNode;
  children: ReactNode;
}

/** Deep focus wrapper — hides chrome when active (port of v1 NodeDetail focus mode). */
export function FocusShell({ active, chrome, children, className, ...props }: FocusShellProps) {
  return (
    <div className={cn("relative min-h-full", className)} {...props}>
      {chrome}
      <div
        className={cn(
          "mx-auto w-full transition-all duration-200",
          active ? "max-w-3xl px-4 py-8" : "max-w-6xl px-6 py-6",
        )}
      >
        {active && (
          <div className="mb-4 flex items-center justify-between rounded-[var(--radius)] border border-[var(--accent)]/30 bg-[var(--accent)]/5 px-3 py-2 text-sm text-[var(--accent)]">
            <span>Focus mode — press F to exit</span>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
