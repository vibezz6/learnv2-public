import { useCallback, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, Trash2 } from "lucide-react";
import { Button, Card } from "@/components/ui";
import {
  addMistake,
  deleteMistake,
  listMistakes,
  type SatMistakeEntry,
  type SatMistakeSection,
} from "@/lib/satMistakeLog";
import { getTopMistakeCategories } from "@/lib/satMistakeTriage";

interface SatMistakeLogPanelProps {
  defaultNodeId?: string;
  defaultSection?: SatMistakeSection;
  recentLimit?: number;
}

const SECTION_LABELS: Record<SatMistakeSection, string> = {
  math: "Math",
  rw: "Reading & Writing",
};

function formatEntryDate(date: string): string {
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function SatMistakeLogPanel({
  defaultNodeId = "",
  defaultSection = "math",
  recentLimit = 12,
}: SatMistakeLogPanelProps) {
  const [entries, setEntries] = useState(() => listMistakes());
  const [section, setSection] = useState<SatMistakeSection>(defaultSection);
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [nodeId, setNodeId] = useState(defaultNodeId);
  const [error, setError] = useState("");

  const refresh = useCallback(() => {
    setEntries(listMistakes());
  }, []);

  const topCategories = useMemo(() => getTopMistakeCategories(3), [entries]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const created = addMistake({
      section,
      category,
      note,
      nodeId: nodeId.trim() || undefined,
    });

    if (!created) {
      setError("Add a topic category and a short note about what went wrong.");
      return;
    }

    setError("");
    setCategory("");
    setNote("");
    if (!defaultNodeId) setNodeId("");
    refresh();
  };

  const handleDelete = (id: string) => {
    deleteMistake(id);
    refresh();
  };

  const recentEntries = entries.slice(0, recentLimit);

  return (
    <div className="space-y-4">
      {topCategories.length > 0 ? (
        <Card variant="quiet" className="space-y-3 p-5">
          <h3 className="text-sm font-semibold text-[var(--text-heading)]">Retarget these first</h3>
          <p className="text-sm text-[var(--text-muted)]">
            Study your most-logged miss categories before new material.
          </p>
          <ul className="space-y-2">
            {topCategories.map((row) => (
              <li
                key={row.category}
                className="flex flex-col gap-2 rounded-[var(--radius)] border border-[var(--border)] px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 text-sm">
                  <span className="font-medium text-[var(--text-heading)]">{row.category}</span>
                  <span className="mt-0.5 block text-xs text-[var(--text-muted)]">
                    {row.count} {row.count === 1 ? "entry" : "entries"} · latest {formatEntryDate(row.latestDate)} ·{" "}
                    {SECTION_LABELS[row.latestSection]}
                    {row.nodeId ? ` · ${row.nodeId}` : ""}
                  </span>
                </div>
                {row.nodeId ? (
                  <Link
                    to={`/subjects/sat-prep/${row.nodeId}`}
                    className="inline-flex min-h-11 shrink-0 items-center text-xs font-medium text-[var(--accent-2)] hover:underline"
                  >
                    Open lesson
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card variant="primary" className="space-y-4 p-5">
        <div className="flex items-start gap-3">
          <ClipboardList className="mt-0.5 shrink-0 text-[var(--accent)]" size={20} />
          <div className="space-y-1">
            <h3 className="font-semibold text-[var(--text-heading)]">SAT mistake log</h3>
            <p className="text-sm text-[var(--text-muted)]">
              After a Bluebook module or Khan practice set, log each miss by topic—not just
              &ldquo;wrong.&rdquo; Categorize within 24 hours, then use your top categories for
              retarget drills before the next checkpoint.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-[var(--text-heading)]">Section</span>
              <select
                value={section}
                onChange={(event) => setSection(event.target.value as SatMistakeSection)}
                className="min-h-11 w-full touch-manipulation rounded-[var(--radius)] border border-[var(--border-strong)] bg-[var(--bg-secondary)] px-3 py-2 text-[var(--text)]"
              >
                <option value="math">Math</option>
                <option value="rw">Reading &amp; Writing</option>
              </select>
            </label>

            <label className="block space-y-1 text-sm">
              <span className="font-medium text-[var(--text-heading)]">Date</span>
              <input
                type="date"
                value={new Date().toISOString().slice(0, 10)}
                readOnly
                className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-secondary)]/60 px-3 py-2 text-[var(--text-muted)]"
              />
            </label>
          </div>

          <label className="block space-y-1 text-sm">
            <span className="font-medium text-[var(--text-heading)]">Topic category</span>
            <input
              type="text"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              placeholder="e.g. comma splices, scatterplots, inference"
              className="min-h-11 w-full rounded-[var(--radius)] border border-[var(--border-strong)] bg-[var(--bg-secondary)] px-3 py-2 text-[var(--text)] placeholder:text-[var(--text-muted)]"
            />
          </label>

          <label className="block space-y-1 text-sm">
            <span className="font-medium text-[var(--text-heading)]">What went wrong</span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              placeholder="What trap did you fall for, and how will you fix it on the next similar item?"
              className="w-full resize-y rounded-[var(--radius)] border border-[var(--border-strong)] bg-[var(--bg-secondary)] px-3 py-2 text-[var(--text)] placeholder:text-[var(--text-muted)]"
            />
          </label>

          <label className="block space-y-1 text-sm">
            <span className="font-medium text-[var(--text-heading)]">
              Lesson link <span className="font-normal text-[var(--text-muted)]">(optional)</span>
            </span>
            <input
              type="text"
              value={nodeId}
              onChange={(event) => setNodeId(event.target.value)}
              placeholder="e.g. st69"
              className="w-full rounded-[var(--radius)] border border-[var(--border-strong)] bg-[var(--bg-secondary)] px-3 py-2 text-[var(--text)] placeholder:text-[var(--text-muted)]"
            />
          </label>

          {error ? <p className="text-sm text-[var(--warning)]">{error}</p> : null}

          <Button type="submit" className="min-h-11 w-full touch-manipulation sm:w-auto">
            Log miss
          </Button>
        </form>
      </Card>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-semibold text-[var(--text-heading)]">Recent entries</h4>
          {entries.length > 0 ? (
            <span className="text-xs text-[var(--text-muted)]">{entries.length} total</span>
          ) : null}
        </div>

        {recentEntries.length === 0 ? (
          <Card variant="quiet" className="p-4 text-sm text-[var(--text-muted)]">
            No misses logged yet. After your next Bluebook or Khan session, add your top three miss
            categories here (e.g. linear equations, inference, comma splices) so retarget drills stay
            focused.
          </Card>
        ) : (
          <ul className="space-y-2">
            {recentEntries.map((entry) => (
              <MistakeEntryRow key={entry.id} entry={entry} onDelete={handleDelete} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function MistakeEntryRow({
  entry,
  onDelete,
}: {
  entry: SatMistakeEntry;
  onDelete: (id: string) => void;
}) {
  return (
    <li>
      <Card variant="quiet" className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
              <span>{formatEntryDate(entry.date)}</span>
              <span>·</span>
              <span>{SECTION_LABELS[entry.section]}</span>
              {entry.nodeId ? (
                <>
                  <span>·</span>
                  <span>{entry.nodeId}</span>
                </>
              ) : null}
            </div>
            <p className="font-medium text-[var(--text-heading)]">{entry.category}</p>
            <p className="text-sm text-[var(--text-muted)]">{entry.note}</p>
          </div>
          <button
            type="button"
            onClick={() => onDelete(entry.id)}
            aria-label={`Delete ${entry.category} entry`}
            className="flex min-h-11 min-w-11 shrink-0 touch-manipulation items-center justify-center rounded-[var(--radius)] text-[var(--text-muted)] transition hover:bg-white/5 hover:text-[var(--warning)]"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </Card>
    </li>
  );
}
