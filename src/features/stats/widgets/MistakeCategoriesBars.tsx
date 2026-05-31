import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ROUTES } from "@/app/navigation";
import { Card, Tag } from "@/components/ui";
import { getEntrySkillId, listMistakes } from "@/lib/satMistakeLog";
import { getTopMistakeCategories } from "@/lib/satMistakeTriage";
import type { SatSkillId } from "@/lib/satSkills";

function drillHrefForCategory(category: string, skillId?: SatSkillId): string | null {
  if (skillId) return `${ROUTES.satDrill}?skill=${encodeURIComponent(skillId)}`;
  const matches = listMistakes().filter(
    (entry) => entry.category.trim() === category.trim() && getEntrySkillId(entry),
  );
  matches.sort((a, b) => b.createdAt - a.createdAt);
  const resolved = matches[0] ? getEntrySkillId(matches[0]) : null;
  return resolved ? `${ROUTES.satDrill}?skill=${encodeURIComponent(resolved)}` : null;
}

export function MistakeCategoriesBars() {
  const navigate = useNavigate();
  const top = useMemo(() => getTopMistakeCategories(5), []);
  const max = Math.max(...top.map((r) => r.count), 1);

  if (top.length === 0) {
    return (
      <Card variant="default" density="normal" className="min-w-0">
        <p className="eyebrow-mono">SAT mistakes</p>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Log misses on the SAT hub to see your top categories here.
        </p>
        <Link
          to={ROUTES.satMistakes}
          className="mt-3 inline-flex text-sm font-medium text-[var(--accent)] hover:underline"
        >
          Open mistake log
        </Link>
      </Card>
    );
  }

  return (
    <Card variant="default" density="normal" className="min-w-0" aria-labelledby="mistake-categories-heading">
      <p id="mistake-categories-heading" className="eyebrow-mono">
        Top mistake categories
      </p>
      <p className="mt-1 text-xs text-[var(--text-muted)]">Click a bar to drill that skill.</p>
      <ul className="mt-4 space-y-3" aria-label="Mistake counts by category">
        {top.map((row) => {
          const drillHref = drillHrefForCategory(row.category, row.skillId);
          const handleClick = () => {
            if (drillHref) navigate(drillHref);
          };
          return (
            <li key={row.category}>
              <button
                type="button"
                className="w-full rounded-[var(--radius)] text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:cursor-default"
                disabled={!drillHref}
                onClick={handleClick}
                aria-label={
                  drillHref
                    ? `Drill ${row.category}, ${row.count} mistakes`
                    : `${row.category}, ${row.count} mistakes`
                }
              >
                <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate font-medium text-[var(--text-heading)]">
                    {row.category}
                  </span>
                  <Tag tone="mono" size="sm">
                    {row.count}
                  </Tag>
                </div>
                <div
                  className="h-2 rounded-full bg-[var(--bg-sunken)]"
                  role="presentation"
                >
                  <div
                    className={`h-full rounded-full ${drillHref ? "bg-[var(--accent)]" : "bg-[var(--text-subtle)]"}`}
                    style={{ width: `${Math.round((row.count / max) * 100)}%` }}
                  />
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
