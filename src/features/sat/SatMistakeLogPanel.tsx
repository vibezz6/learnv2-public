import { useCallback, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, Trash2 } from "lucide-react";
import {
  Button,
  Card,
  Field,
  Input,
  Row,
  Select,
  Tag,
  Textarea,
} from "@/components/ui";
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
  rw: "R&W",
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
        <Card variant="primary" density="normal" className="min-w-0 space-y-3">
          <div className="flex items-center gap-2 border-b border-[var(--rule)] pb-3">
            <p className="eyebrow-mono">Retarget these first</p>
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            Study your most-logged miss categories before new material.
          </p>
          <ul className="space-y-2">
            {topCategories.map((row) => (
              <li key={row.category}>
                {row.nodeId ? (
                  <Row
                    to={`/subjects/sat-prep/${row.nodeId}`}
                    title={row.category}
                    detail={`${row.count} ${row.count === 1 ? "entry" : "entries"} · latest ${formatEntryDate(row.latestDate)}`}
                    meta={
                      <Tag tone="warning" size="sm" mono>
                        {SECTION_LABELS[row.latestSection]}
                      </Tag>
                    }
                  />
                ) : (
                  <div className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--rule)] bg-[var(--bg-panel)] px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--text-heading)]">
                        {row.category}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                        {row.count} {row.count === 1 ? "entry" : "entries"} · latest{" "}
                        {formatEntryDate(row.latestDate)}
                      </p>
                    </div>
                    <Tag tone="warning" size="sm" mono>
                      {SECTION_LABELS[row.latestSection]}
                    </Tag>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card variant="default" density="normal" className="min-w-0 space-y-4">
        <div className="flex items-start gap-3 border-b border-[var(--rule)] pb-3">
          <ClipboardList className="mt-0.5 shrink-0 text-[var(--text-muted)]" size={16} aria-hidden />
          <div className="space-y-1">
            <p className="eyebrow-mono">Log a miss</p>
            <p className="text-sm leading-relaxed text-[var(--text-muted)]">
              After a Bluebook module or Khan practice set, log each miss by topic—not just
              &ldquo;wrong.&rdquo; Categorize within 24 hours, then use your top categories for
              retarget drills before the next checkpoint.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Section">
              {(id) => (
                <Select
                  id={id}
                  value={section}
                  onChange={(event) => setSection(event.target.value as SatMistakeSection)}
                >
                  <option value="math">Math</option>
                  <option value="rw">Reading &amp; Writing</option>
                </Select>
              )}
            </Field>
            <Field label="Date">
              {(id) => (
                <Input
                  id={id}
                  type="date"
                  value={new Date().toISOString().slice(0, 10)}
                  readOnly
                />
              )}
            </Field>
          </div>
          <Field label="Topic category" required>
            {(id) => (
              <Input
                id={id}
                type="text"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                placeholder="comma splices, scatterplots, inference"
              />
            )}
          </Field>
          <Field label="What went wrong" required error={error || undefined}>
            {(id) => (
              <Textarea
                id={id}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={3}
                placeholder="What trap did you fall for, and how will you fix it on the next similar item?"
              />
            )}
          </Field>
          <Field label="Lesson link" hint="Optional — e.g. st69">
            {(id) => (
              <Input
                id={id}
                type="text"
                value={nodeId}
                onChange={(event) => setNodeId(event.target.value)}
                placeholder="st69"
              />
            )}
          </Field>
          <Button type="submit" size="md" className="w-full sm:w-auto">
            Log miss
          </Button>
        </form>
      </Card>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="eyebrow-mono">Recent entries</p>
          {entries.length > 0 ? (
            <Tag tone="mono" size="sm">
              {entries.length} total
            </Tag>
          ) : null}
        </div>

        {recentEntries.length === 0 ? (
          <Card variant="quiet" density="normal" className="text-sm text-[var(--text-muted)]">
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
      <Card variant="default" density="compact" className="min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <Tag tone="mono" size="sm">
                {SECTION_LABELS[entry.section]}
              </Tag>
              <Tag tone="muted" size="sm" mono>
                {formatEntryDate(entry.date)}
              </Tag>
              {entry.nodeId ? (
                <Link
                  to={`/subjects/sat-prep/${entry.nodeId}`}
                  className="text-xs font-medium text-[var(--accent)] hover:underline"
                >
                  {entry.nodeId}
                </Link>
              ) : null}
            </div>
            <p className="text-sm font-medium text-[var(--text-heading)]">{entry.category}</p>
            <p className="text-sm leading-relaxed text-[var(--text-muted)]">{entry.note}</p>
          </div>
          <button
            type="button"
            onClick={() => onDelete(entry.id)}
            aria-label={`Delete ${entry.category} entry`}
            className="flex min-h-9 min-w-9 shrink-0 touch-manipulation items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-subtle)] transition hover:bg-[var(--danger-bg)] hover:text-[var(--danger-fg)]"
          >
            <Trash2 size={14} aria-hidden />
          </button>
        </div>
      </Card>
    </li>
  );
}
