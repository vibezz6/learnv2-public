import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

interface KeyHintProps extends HTMLAttributes<HTMLElement> {
  size?: "sm" | "md";
}

const sizeClass = {
  sm: "h-5 min-w-5 px-1 text-[10px]",
  md: "h-6 min-w-6 px-1.5 text-[11px]",
} as const;

/** Keyboard glyph block — used for ⌘K / F / [ shortcut hints. */
export function KeyHint({ className, size = "md", children, ...props }: KeyHintProps) {
  return (
    <kbd
      className={cn(
        "inline-flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--rule-strong)] bg-[var(--bg-sunken)]",
        "font-mono font-medium tabular-nums text-[var(--text-muted)]",
        sizeClass[size],
        className,
      )}
      {...props}
    >
      {children}
    </kbd>
  );
}
