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
        "flex flex-col items-center justify-center rounded-[var(--radius-md)] border border-dashed border-[var(--rule-strong)] bg-[var(--bg-canvas)] px-8 py-14 text-center",
        className,
      )}
    >
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-[var(--radius)] border border-[var(--rule)] bg-[var(--bg-sunken)] text-xl text-[var(--text-muted)]">
        {icon ?? <span aria-hidden>◇</span>}
      </div>
      <h3 className="max-w-sm text-base font-semibold tracking-tight text-[var(--text-heading)]">
        {title}
      </h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-[var(--text-muted)]">
        {description}
      </p>
      {actionLabel && actionTo && (
        <Link to={actionTo} className="mt-6">
          <Button>{actionLabel}</Button>
        </Link>
      )}
      {actionLabel && onAction && !actionTo && (
        <Button className="mt-6" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
