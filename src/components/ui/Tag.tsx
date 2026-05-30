import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

type Tone = "default" | "muted" | "accent" | "success" | "warning" | "danger" | "info" | "mono";
type Size = "sm" | "md";

interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  size?: Size;
  /** Render the label in the mono font (IDE-style metadata). */
  mono?: boolean;
}

const toneClass: Record<Tone, string> = {
  default: "border-[var(--rule)] bg-[var(--bg-panel)] text-[var(--text)]",
  muted: "border-[var(--rule)] bg-transparent text-[var(--text-muted)]",
  accent: "border-[var(--accent-border)] bg-[var(--accent-bg)] text-[var(--accent)]",
  success: "border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success-fg)]",
  warning: "border-[var(--warning-border)] bg-[var(--warning-bg)] text-[var(--warning-fg)]",
  danger: "border-[var(--danger-border)] bg-[var(--danger-bg)] text-[var(--danger-fg)]",
  info: "border-[var(--info-border)] bg-[var(--info-bg)] text-[var(--info-fg)]",
  mono: "border-[var(--rule)] bg-[var(--bg-sunken)] text-[var(--text-muted)]",
};

const sizeClass: Record<Size, string> = {
  sm: "px-1.5 py-0.5 text-[11px]",
  md: "px-2 py-0.5 text-xs",
};

/**
 * Tag — quiet inline status/metadata chip.
 * Replaces the v1 Badge for non-version uses; Badge remains for version pills.
 */
export function Tag({ className, tone = "default", size = "md", mono = false, ...props }: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[var(--radius-sm)] border whitespace-nowrap",
        sizeClass[size],
        toneClass[tone],
        mono || tone === "mono" ? "font-mono uppercase tracking-wide" : "font-medium",
        className,
      )}
      {...props}
    />
  );
}
