import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--accent)] text-[#041410] hover:brightness-110 shadow-[var(--accent-glow)]",
  secondary:
    "border border-[var(--border-strong)] bg-[var(--bg-elevated)] text-[var(--text)] hover:border-[var(--accent)]",
  ghost: "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-white/5",
};

export function Button({
  className,
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[var(--radius)] px-4 py-2 text-sm font-medium transition",
        "disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
