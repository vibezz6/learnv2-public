import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
  variant?: "default" | "primary" | "accent" | "quiet";
  hover?: boolean;
}

const variantClass: Record<NonNullable<CardProps["variant"]>, string> = {
  default: "border-[var(--border)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)]",
  primary:
    "border-[var(--accent-border)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] border-l-2 border-l-[var(--accent)]",
  accent: "border-[var(--accent-border)]/50 bg-[var(--accent-bg)]/40 shadow-[var(--shadow-card)]",
  quiet: "border-[var(--border)]/70 bg-[var(--bg-secondary)]/35 shadow-none",
};

export function Card({
  className,
  glow,
  variant = "default",
  hover,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border p-5",
        variantClass[variant],
        glow && "shadow-[var(--accent-glow)]",
        hover &&
          "transition-[transform,box-shadow] duration-150 hover:-translate-y-px hover:shadow-[var(--shadow-md)]",
        className,
      )}
      {...props}
    />
  );
}
