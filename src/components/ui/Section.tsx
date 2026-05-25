import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

interface SectionProps {
  eyebrow?: string;
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Section({ eyebrow, title, actions, children, className }: SectionProps) {
  return (
    <section className={cn("space-y-4", className)}>
      {(eyebrow || title || actions) && (
        <div
          className={cn(
            "flex flex-col gap-2",
            actions && "min-[481px]:flex-row min-[481px]:items-center min-[481px]:justify-between",
          )}
        >
          <div className="min-w-0 space-y-1">
            {eyebrow ? (
              <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--text-muted)]">
                {eyebrow}
              </p>
            ) : null}
            {title ? (
              <h2 className="text-sm font-semibold text-[var(--text-heading)]">{title}</h2>
            ) : null}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      )}
      {children}
    </section>
  );
}
