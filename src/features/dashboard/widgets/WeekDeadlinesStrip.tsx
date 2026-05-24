import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Calendar, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui";
import { ADMISSIONS_UPDATED_EVENT } from "@/lib/admissionsSync";
import { getWeekDeadlineRows } from "@/lib/admissionsSummary";
import { cn } from "@/lib/cn";

function dueLabel(daysUntil: number, overdue: boolean): string {
  if (overdue) return `${-daysUntil} day${-daysUntil === 1 ? "" : "s"} overdue`;
  if (daysUntil === 0) return "Due today";
  return `Due in ${daysUntil} day${daysUntil === 1 ? "" : "s"}`;
}

export function WeekDeadlinesStrip() {
  const location = useLocation();
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const bump = () => setRevision((r) => r + 1);
    window.addEventListener(ADMISSIONS_UPDATED_EVENT, bump);
    return () => window.removeEventListener(ADMISSIONS_UPDATED_EVENT, bump);
  }, []);

  useEffect(() => {
    if (location.pathname === "/") setRevision((r) => r + 1);
  }, [location.pathname]);

  const rows = useMemo(() => {
    void revision;
    return getWeekDeadlineRows(7);
  }, [revision]);

  if (rows.length === 0) return null;

  return (
    <Card variant="quiet" className="min-w-0 p-5">
      <div className="flex items-start gap-3">
        <Calendar size={16} className="mt-0.5 shrink-0 text-[var(--warning)]" aria-hidden />
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--text-muted)]">
              Application deadlines
            </p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Essays and checklist steps due in the next 7 days.
            </p>
          </div>
          <ul className="divide-y divide-[var(--border)]">
            {rows.map((row) => (
              <li key={row.id}>
                <Link
                  to={row.href}
                  className="group flex min-h-11 items-center justify-between gap-2 py-2.5 touch-manipulation"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-[var(--text-heading)] group-hover:text-[var(--accent)]">
                      {row.title}
                    </span>
                    {row.detail && (
                      <span className="mt-0.5 block text-xs text-[var(--text-muted)]">{row.detail}</span>
                    )}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 text-xs font-medium tabular-nums",
                      row.overdue ? "text-[var(--warning)]" : "text-[var(--text-muted)]",
                    )}
                  >
                    {dueLabel(row.daysUntil, row.overdue)}
                  </span>
                  <ChevronRight
                    size={14}
                    className="shrink-0 text-[var(--text-muted)] group-hover:text-[var(--accent)]"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
