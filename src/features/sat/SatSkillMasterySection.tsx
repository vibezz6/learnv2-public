import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronDown, ChevronUp, Target } from "lucide-react";
import { Button, Card, Tag } from "@/components/ui";
import type { Subject } from "@/curriculum/types";
import {
  getLatestDiagnosticAttempt,
  getSatSkillMastery,
  type SatSkillMasteryRow,
} from "@/lib/satSkillMastery";
import { ROUTES } from "@/app/navigation";

const SECTION_LABEL: Record<SatSkillMasteryRow["section"], string> = {
  math: "Math",
  rw: "R&W",
  general: "General",
};

function diagnosticTone(pct: number): "success" | "warning" | "danger" {
  if (pct >= 70) return "success";
  if (pct >= 40) return "warning";
  return "danger";
}

function SkillRow({ row }: { row: SatSkillMasteryRow }) {
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-[var(--radius)] border border-[var(--rule)] bg-[var(--bg-panel)] px-3 py-2">
      <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-subtle)]">
        {SECTION_LABEL[row.section]}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--text-heading)]">
        {row.label}
      </span>
      {row.mistakeCount > 0 ? (
        <Tag tone="warning" size="sm" mono>
          {row.mistakeCount} missed
        </Tag>
      ) : null}
      {row.diagnostic ? (
        <Tag
          tone={diagnosticTone(row.diagnostic.pct)}
          size="sm"
          mono
          title={`${row.diagnostic.correct}/${row.diagnostic.total} on diagnostic`}
        >
          diag {row.diagnostic.pct}%
        </Tag>
      ) : null}
      {row.drill?.due ? (
        <Tag tone="accent" size="sm" mono>
          due
        </Tag>
      ) : null}
      {row.questionCount > 0 && row.questionCount < 5 ? (
        <span
          className="font-mono text-[11px] text-[var(--text-subtle)]"
          title="Few practice questions for this skill"
        >
          {row.questionCount} Q{row.questionCount === 1 ? "" : "s"}
        </span>
      ) : null}
      {row.questionCount > 0 ? (
        <Link to={`${ROUTES.satDrill}?skill=${row.skillId}`}>
          <Button variant="secondary" size="sm">
            Drill
          </Button>
        </Link>
      ) : (
        <span className="font-mono text-[11px] text-[var(--text-subtle)]" title="No practice questions for this skill yet">
          needs questions
        </span>
      )}
    </li>
  );
}

/** Per-skill "where am I weak / what do I attack" view for the SAT hub. */
export function SatSkillMasterySection({
  subject,
  storage,
}: {
  subject: Subject;
  storage?: Storage;
}) {
  const [showAll, setShowAll] = useState(false);
  const rows = useMemo(() => getSatSkillMastery([subject], storage), [subject, storage]);
  const tracked = rows.filter((r) => r.hasSignal);
  const diagMeta = useMemo(() => getLatestDiagnosticAttempt(storage), [storage]);
  const diagSubtitle =
    diagMeta?.source === "retest"
      ? "Per-skill % from your latest Draft 3 retest."
      : diagMeta?.source === "baseline"
        ? "Per-skill % from your Draft 1 baseline."
        : null;

  return (
    <Card variant="default" density="normal" className="min-w-0 space-y-4">
      {tracked.length === 0 ? (
        <div className="space-y-3">
          <p className="text-sm text-[var(--text-muted)]">
            Log mistakes or take a diagnostic and your weak skills surface here, ranked by what to
            attack first.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link to={ROUTES.satMistakes}>
              <Button variant="secondary" size="sm">
                Log a mistake
              </Button>
            </Link>
            <Link to={ROUTES.satPretest}>
              <Button variant="secondary" size="sm">
                Take a diagnostic
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-[var(--text-muted)]">
              {diagSubtitle ??
                "Ranked weakest-first from your mistakes, diagnostic, and drills."}
            </p>
            <Link to={ROUTES.satDrill}>
              <Button variant="secondary" size="sm">
                <Target size={14} aria-hidden />
                Drill weakest
              </Button>
            </Link>
          </div>
          <ul className="space-y-2">
            {tracked.map((row) => (
              <SkillRow key={row.skillId} row={row} />
            ))}
          </ul>
        </>
      )}

      <div className="border-t border-[var(--rule)] pt-3">
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          aria-expanded={showAll}
          aria-controls="sat-skill-coverage"
          className="flex w-full items-center justify-between gap-2 text-left font-mono text-[11px] text-[var(--text-muted)] hover:text-[var(--accent)]"
        >
          <span>All skills &amp; practice coverage</span>
          {showAll ? (
            <ChevronUp size={14} aria-hidden />
          ) : (
            <ChevronDown size={14} aria-hidden />
          )}
        </button>
        {showAll ? (
          <div id="sat-skill-coverage" className="mt-3 grid gap-4 sm:grid-cols-2">
            {(["math", "rw"] as const).map((section) => (
              <div key={section}>
                <p className="eyebrow-mono">{SECTION_LABEL[section]}</p>
                <ul className="mt-1.5 space-y-1">
                  {rows
                    .filter((r) => r.section === section)
                    .map((r) => (
                      <li
                        key={r.skillId}
                        className="flex items-center justify-between gap-2 text-sm text-[var(--text)]"
                      >
                        <span className="min-w-0 truncate">{r.label}</span>
                        <span
                          className={`shrink-0 font-mono text-[11px] ${r.questionCount < 5 ? "text-[var(--warning-fg)]" : "text-[var(--text-subtle)]"}`}
                        >
                          {r.questionCount} Q{r.questionCount === 1 ? "" : "s"}
                        </span>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <Link
        to={ROUTES.satMistakes}
        className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent)] hover:underline"
      >
        Log a new mistake
        <ArrowRight size={13} aria-hidden />
      </Link>
    </Card>
  );
}
