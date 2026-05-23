import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "./Button";
import { cn } from "@/lib/cn";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionTo,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-8 py-16 text-center",
        className,
      )}
    >
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-[var(--radius-lg)] border border-[var(--border-strong)] bg-[var(--bg-secondary)] text-2xl">
        {icon ?? <span aria-hidden>◇</span>}
      </div>
      <h3 className="max-w-sm text-xl font-medium tracking-tight text-[var(--text-heading)]">
        {title}
      </h3>
      <p className="mt-2 max-w-xs text-[15px] leading-relaxed text-[var(--text-muted)]">
        {description}
      </p>
      {actionLabel && actionTo && (
        <Link to={actionTo} className="mt-8">
          <Button>{actionLabel}</Button>
        </Link>
      )}
      {actionLabel && onAction && !actionTo && (
        <Button className="mt-8" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
