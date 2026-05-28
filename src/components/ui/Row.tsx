import { cn } from "@/lib/cn";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

interface BaseRowProps {
  icon?: ReactNode;
  title: ReactNode;
  detail?: ReactNode;
  meta?: ReactNode;
  trailing?: ReactNode;
  className?: string;
  /** Reduces vertical padding for stacked lists. */
  density?: "compact" | "normal";
  /** Visual weight of the container. */
  variant?: "panel" | "ghost";
}

interface LinkRowProps extends BaseRowProps {
  to: string;
  external?: boolean;
  onClick?: never;
  as?: never;
}

interface ActionRowProps extends BaseRowProps {
  to?: never;
  external?: never;
  onClick?: () => void;
  as?: "button" | "div";
}

type RowProps = LinkRowProps | ActionRowProps;

const densityClass = {
  compact: "px-3 py-2.5",
  normal: "px-4 py-3",
} as const;

const variantClass = {
  panel:
    "border-[var(--rule)] bg-[var(--bg-panel)] hover:border-[var(--rule-strong)] hover:bg-[var(--bg-hover)]",
  ghost:
    "border-transparent bg-transparent hover:border-[var(--rule)] hover:bg-[var(--bg-hover)]",
} as const;

/**
 * Row — icon + content + meta + (optional) trailing action / chevron.
 * Used for service cards, checklist items, draft list, command palette items.
 */
export function Row(props: RowProps) {
  const { icon, title, detail, meta, trailing, className, density = "normal", variant = "panel" } = props;

  const showChevron = "to" in props && props.to;
  const inner = (
    <>
      {icon ? (
        <div
          aria-hidden
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius)] border border-[var(--rule)] bg-[var(--bg-sunken)] text-[var(--text-muted)]"
        >
          {icon}
        </div>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex min-w-0 items-baseline justify-between gap-3">
          <div className="min-w-0 truncate text-sm font-medium text-[var(--text-heading)]">{title}</div>
          {meta ? (
            <div className="shrink-0 text-xs text-[var(--text-muted)] tabular-nums">{meta}</div>
          ) : null}
        </div>
        {detail ? (
          <div className="text-xs leading-relaxed text-[var(--text-muted)]">{detail}</div>
        ) : null}
      </div>
      {trailing ? <div className="shrink-0">{trailing}</div> : null}
      {showChevron && !trailing ? (
        <ChevronRight size={16} className="shrink-0 text-[var(--text-subtle)]" aria-hidden />
      ) : null}
    </>
  );

  const baseClass = cn(
    "flex w-full items-center gap-3 rounded-[var(--radius-md)] border text-left transition",
    densityClass[density],
    variantClass[variant],
    className,
  );

  if ("to" in props && props.to) {
    if (props.external) {
      return (
        <a
          href={props.to}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(baseClass, "min-h-12")}
        >
          {inner}
        </a>
      );
    }
    return (
      <Link to={props.to} className={cn(baseClass, "min-h-12")}>
        {inner}
      </Link>
    );
  }

  if (props.onClick) {
    return (
      <button type="button" onClick={props.onClick} className={cn(baseClass, "min-h-12")}>
        {inner}
      </button>
    );
  }

  return <div className={cn(baseClass, "min-h-12")}>{inner}</div>;
}
