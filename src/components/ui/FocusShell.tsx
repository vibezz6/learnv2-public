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
      {/* Ambient glow behind the reading column in focus mode */}
      {active && (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-0"
          style={{
            background:
              "radial-gradient(ellipse 55% 40% at 50% 0%, var(--accent-bg) 0%, transparent 70%)",
          }}
        />
      )}
      {chrome}
      <div
        className={cn(
          "relative z-10 mx-auto w-full transition-all duration-300",
          active ? "max-w-[var(--measure-prose)] px-6 py-10 md:px-8" : "max-w-6xl px-6 py-6",
        )}
      >
        {children}
      </div>
    </div>
  );
}
