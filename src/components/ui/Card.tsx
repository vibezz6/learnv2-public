import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

type Variant = "default" | "primary" | "accent" | "quiet" | "panel" | "sunken";
type Density = "compact" | "normal" | "roomy";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** @deprecated visual glow has been removed in the serious redesign; prop kept for back-compat. */
  glow?: boolean;
  variant?: Variant;
  hover?: boolean;
  density?: Density;
}

const variantClass: Record<Variant, string> = {
  default: "border-[var(--rule)] bg-[var(--bg-panel)] shadow-[var(--shadow-card)]",
  primary:
    "border-[var(--accent-border)] bg-[var(--bg-panel)] shadow-[var(--shadow-card)] border-l-2 border-l-[var(--accent)]",
  accent:
    "border-[var(--rule-strong)] bg-[var(--bg-panel)] shadow-[var(--shadow-card)]",
  quiet: "border-[var(--rule)] bg-[var(--bg-canvas)] shadow-none",
  panel: "border-[var(--rule)] bg-[var(--bg-panel)] shadow-none",
  sunken: "border-[var(--rule)] bg-[var(--bg-sunken)] shadow-none",
};

const densityClass: Record<Density, string> = {
  compact: "p-4",
  normal: "p-5 md:p-6",
  roomy: "p-6 md:p-8",
};

export function Card({
  className,
  variant = "default",
  hover,
  density = "normal",
  glow,
  ...props
}: CardProps) {
  void glow;
  return (
    <div
      className={cn(
        "rounded-[var(--radius-md)] border",
        variantClass[variant],
        densityClass[density],
        hover &&
          "transition-[border-color,transform] duration-150 hover:-translate-y-px hover:border-[var(--rule-strong)]",
        className,
      )}
      {...props}
    />
  );
}
