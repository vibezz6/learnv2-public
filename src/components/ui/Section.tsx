import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

interface SectionProps {
  eyebrow?: string;
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Render a hairline rule beneath the header. */
  divider?: boolean;
  /** Use mono uppercase for the eyebrow (IDE feel). Default true. */
  monoEyebrow?: boolean;
  /** Visual rhythm of children block. */
  density?: "tight" | "normal" | "roomy";
  /** id for hash anchors. */
  id?: string;
}

const densityClass = {
  tight: "space-y-3",
  normal: "space-y-4",
  roomy: "space-y-6",
} as const;

export function Section({
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
  divider = false,
  monoEyebrow = true,
  density = "normal",
  id,
}: SectionProps) {
  const hasHeader = Boolean(eyebrow || title || description || actions);
  return (
    <section id={id} className={cn(densityClass[density], className)}>
      {hasHeader ? (
        <header
          className={cn(
            "flex flex-col gap-2",
            divider && "border-b border-[var(--rule)] pb-3",
            actions && "min-[481px]:flex-row min-[481px]:items-end min-[481px]:justify-between",
          )}
        >
          <div className="min-w-0 space-y-1">
            {eyebrow ? (
              monoEyebrow ? (
                <p className="eyebrow-mono">{eyebrow}</p>
              ) : (
                <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--text-muted)]">
                  {eyebrow}
                </p>
              )
            ) : null}
            {title ? (
              <h2 className="text-base font-semibold tracking-tight text-[var(--text-heading)]">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="text-sm leading-relaxed text-[var(--text-muted)]">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}
