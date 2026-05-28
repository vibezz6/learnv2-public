import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Tone = "default" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  tone?: Tone;
  size?: Size;
  loading?: boolean;
}

const sizeClass: Record<Size, string> = {
  sm: "min-h-8 px-3 py-1.5 text-[13px]",
  md: "min-h-10 px-4 py-2 text-sm",
  lg: "min-h-11 px-5 py-2.5 text-[15px]",
};

const variantBase: Record<Variant, string> = {
  primary:
    "border border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-fg)] hover:brightness-110",
  secondary:
    "border border-[var(--rule-strong)] bg-[var(--bg-panel)] text-[var(--text)] hover:border-[var(--accent-border)] hover:bg-[var(--bg-hover)]",
  ghost:
    "border border-transparent text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)]",
};

const dangerOverrides: Record<Variant, string> = {
  primary:
    "border-[var(--danger)] bg-[var(--danger)] text-[#1a0e0c] hover:brightness-110",
  secondary:
    "border-[var(--danger-border)] bg-transparent text-[var(--danger-fg)] hover:bg-[var(--danger-bg)] hover:border-[var(--danger)]",
  ghost: "text-[var(--danger-fg)] hover:bg-[var(--danger-bg)] hover:text-[var(--danger)]",
};

export function Button({
  className,
  variant = "primary",
  tone = "default",
  size = "md",
  type = "button",
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[var(--radius)] font-medium transition",
        "focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none",
        sizeClass[size],
        tone === "danger" ? dangerOverrides[variant] : variantBase[variant],
        className,
      )}
      {...props}
    >
      {loading ? (
        <span
          aria-hidden
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent opacity-70"
        />
      ) : null}
      {children}
    </button>
  );
}
