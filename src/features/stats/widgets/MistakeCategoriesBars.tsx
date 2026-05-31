import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/app/navigation";
import { Card, Tag } from "@/components/ui";
import { getTopMistakeCategories } from "@/lib/satMistakeTriage";

export function MistakeCategoriesBars() {
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
    <Card variant="default" density="normal" className="min-w-0">
      <p className="eyebrow-mono">Top mistake categories</p>
      <ul className="mt-4 space-y-3">
        {top.map((row) => (
          <li key={row.category}>
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
              role="img"
              aria-label={`${row.category}: ${row.count} mistakes`}
            >
              <div
                className="h-full rounded-full bg-[var(--accent)]"
                style={{ width: `${Math.round((row.count / max) * 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
