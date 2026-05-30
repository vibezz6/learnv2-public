import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow?: string;
  /** Omit when a page uses a custom title block below (e.g. track detail header). */
  title?: string;
  subtitle?: string;
  backTo?: { to: string; label: string };
  actions?: ReactNode;
  divider?: boolean;
  className?: string;
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  backTo,
  actions,
  divider = true,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "space-y-3",
        divider && "border-b border-[var(--rule)] pb-5",
        className,
      )}
    >
      {backTo ? (
        <Link
          to={backTo.to}
          className="inline-flex min-h-9 items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
        >
          <ChevronLeft size={16} aria-hidden />
          {backTo.label}
        </Link>
      ) : null}

      <div
        className={cn(
          "space-y-2",
          actions && "flex flex-col gap-4 min-[481px]:flex-row min-[481px]:items-end min-[481px]:justify-between",
        )}
      >
        <div className="min-w-0 space-y-2">
          {eyebrow ? <p className="eyebrow-mono">{eyebrow}</p> : null}
          {title ? (
            <h1 className="text-[clamp(1.625rem,4.5vw,2.375rem)] font-semibold tracking-tight text-[var(--text-heading)]">
              {title}
            </h1>
          ) : null}
          {subtitle ? (
            <p className="max-w-2xl text-sm leading-relaxed text-[var(--text-muted)]">{subtitle}</p>
          ) : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    </header>
  );
}
