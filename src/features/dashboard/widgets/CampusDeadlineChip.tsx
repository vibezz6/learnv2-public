import { Link } from "react-router-dom";
import { ArrowRight, CalendarClock } from "lucide-react";
import { getUrgentCollegeDeadlines } from "@/lib/admissionsSummary";

export function CampusDeadlineChip() {
  const deadlines = getUrgentCollegeDeadlines();

  if (deadlines.length === 0) return null;

  return (
    <div
      className="mt-5 rounded-[var(--radius)] border border-[var(--accent-2)]/30 bg-[var(--accent-bg)] p-4"
      role="region"
      aria-label="College deadlines"
    >
      <div className="flex items-start gap-3">
        <CalendarClock
          size={16}
          className="mt-0.5 shrink-0 text-[var(--accent-2)]"
          aria-hidden
        />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-medium text-[var(--text-heading)]">College deadlines</p>
          <ul className="space-y-2">
            {deadlines.map((row) => (
              <li key={row.id}>
                <Link
                  to={row.href}
                  className="group flex items-start justify-between gap-2 rounded-[var(--radius)] text-sm transition hover:text-[var(--accent)] touch-manipulation"
                >
                  <span className="min-w-0">
                    <span className="font-medium text-[var(--text-heading)] group-hover:text-[var(--accent)]">
                      {row.title}
                    </span>
                    {row.detail ? (
                      <span className="mt-0.5 block text-xs text-[var(--text-muted)]">
                        {row.detail}
                      </span>
                    ) : null}
                  </span>
                  <span className="shrink-0 text-xs font-medium text-[var(--accent-2)]">
                    {row.overdue ? "Overdue" : row.daysUntil === 0 ? "Today" : "Tomorrow"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Link
            to="/campus/college-checklist"
            className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent-2)] hover:underline"
          >
            Open checklist
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
}
