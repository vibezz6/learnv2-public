import { Card } from "@/components/ui";
import { buildNotesReviewDiffRows } from "@/lib/notesReviewDiff";

export function NotesReviewDiffPanel({
  responses,
  prompts,
}: {
  responses: Record<string, string>;
  prompts: Array<{ key: string; label: string }>;
}) {
  const rows = buildNotesReviewDiffRows(responses, prompts);
  if (rows.length === 0) return null;

  return (
    <Card variant="quiet" className="min-w-0">
      <details open>
        <summary className="cursor-pointer text-sm font-semibold text-[var(--text-heading)]">
          Your notes (submitted for this review)
        </summary>
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          Compare what you wrote with strengths and gaps below — edit session notes to regenerate
          feedback.
        </p>
        <ul className="mt-4 divide-y divide-[var(--border)]/60">
          {rows.map((row) => (
            <li key={row.key} className="min-w-0 py-3 first:pt-0">
              <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-heading)]">
                  {row.label}
                </span>
                <span className="font-mono text-[10px] tabular-nums text-[var(--text-muted)]">
                  {row.wordCount} {row.wordCount === 1 ? "word" : "words"}
                </span>
              </div>
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-[var(--text-muted)]">
                {row.text}
              </p>
            </li>
          ))}
        </ul>
      </details>
    </Card>
  );
}
