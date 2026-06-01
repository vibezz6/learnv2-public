import { cn } from "@/lib/cn";

type Tone = "default" | "accent" | "success" | "warning" | "danger" | "info" | "muted";

interface StatusDotProps {
  tone?: Tone;
  className?: string;
  "aria-label"?: string;
}

const toneClass: Record<Tone, string> = {
  default: "bg-[var(--text-muted)]",
  muted: "bg-[var(--text-subtle)]",
  accent: "bg-[var(--accent)]",
  success: "bg-[var(--success)]",
  warning: "bg-[var(--warning)]",
  danger: "bg-[var(--danger)]",
  info: "bg-[var(--info)]",
};

/** 8px colored dot for inline state (e.g. essay status, lesson progress). */
export function StatusDot({ tone = "default", className, ...props }: StatusDotProps) {
  return (
    <span
      aria-hidden={!props["aria-label"]}
      role={props["aria-label"] ? "status" : undefined}
      className={cn("inline-block h-2 w-2 shrink-0 rounded-full", toneClass[tone], className)}
      {...props}
    />
  );
}
