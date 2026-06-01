import { Link } from "react-router-dom";
import { FileText } from "lucide-react";
import { Card, Tag } from "@/components/ui";
import { loadEssayTracker } from "@/lib/essayTracker";

function daysUntil(due: string): number {
  const today = new Date();
  const dueDate = new Date(`${due}T12:00:00`);
  const start = new Date(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}T12:00:00`);
  return Math.round((dueDate.getTime() - start.getTime()) / 86_400_000);
}

export function EssayDueToday() {
  const essays = loadEssayTracker().essays.filter((e) => e.dueDate && e.status !== "final");
  const soon = essays
    .map((e) => ({ essay: e, days: daysUntil(e.dueDate!) }))
    .filter((x) => x.days >= 0 && x.days <= 7)
    .sort((a, b) => a.days - b.days)
    .slice(0, 3);

  if (soon.length === 0) return null;

  return (
    <Card variant="default" density="normal" className="min-w-0">
      <div className="mb-3 flex items-center gap-2">
        <FileText size={14} aria-hidden className="text-[var(--text-muted)]" />
        <p className="eyebrow-mono">Essays due soon</p>
      </div>
      <ul className="divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
        {soon.map(({ essay, days }) => {
          const tone = days === 0 ? "danger" : days <= 2 ? "warning" : "muted";
          const label = days === 0 ? "Due today" : days === 1 ? "1 day" : `${days} days`;
          return (
            <li key={essay.id}>
              <Link
                to="/campus/essay-tracker"
                className="group flex min-h-11 items-center justify-between gap-3 py-2.5"
              >
                <span className="min-w-0 truncate text-sm font-medium text-[var(--text-heading)] group-hover:text-[var(--accent)]">
                  {essay.title}
                </span>
                <Tag tone={tone} size="sm" mono>
                  {label}
                </Tag>
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

export function hasEssaysDueSoon(): boolean {
  const essays = loadEssayTracker().essays.filter((e) => e.dueDate && e.status !== "final");
  return essays
    .map((e) => ({ essay: e, days: daysUntil(e.dueDate!) }))
    .some((x) => x.days >= 0 && x.days <= 7);
}
