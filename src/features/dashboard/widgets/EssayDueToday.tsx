import { Link } from "react-router-dom";
import { FileText } from "lucide-react";
import { Card } from "@/components/ui";
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
    .slice(0, 2);

  if (soon.length === 0) return null;

  return (
    <Card variant="quiet" className="min-w-0">
      <div className="flex items-start gap-3">
        <FileText size={16} className="mt-0.5 shrink-0 text-[var(--accent-2)]" />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-medium text-[var(--text-heading)]">Essays due soon</p>
          <ul className="space-y-1 text-sm text-[var(--text-muted)]">
            {soon.map(({ essay, days }) => (
              <li key={essay.id}>
                <Link to="/campus/essay-tracker" className="text-[var(--text)] hover:text-[var(--accent)]">
                  {essay.title}
                </Link>
                {" — "}
                {days === 0 ? "due today" : `due in ${days} day${days === 1 ? "" : "s"}`}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
