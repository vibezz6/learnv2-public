import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Check, ChevronLeft, ExternalLink, Plus, Trash2 } from "lucide-react";
import { Badge, Button, Card } from "@/components/ui";
import {
  addCustomItem,
  getChecklistProgress,
  groupBuiltInByCategory,
  loadCollegeChecklist,
  removeCustomItem,
  saveCollegeChecklist,
  toggleBuiltInItem,
  toggleCustomItem,
  type CollegeChecklistState,
} from "@/lib/collegeChecklist";
import { cn } from "@/lib/cn";

export function CollegeChecklistPage() {
  const [state, setState] = useState<CollegeChecklistState>(() => loadCollegeChecklist());
  const [customTitle, setCustomTitle] = useState("");
  const [customDue, setCustomDue] = useState("");

  const persist = useCallback((next: CollegeChecklistState) => {
    setState(next);
    saveCollegeChecklist(next);
  }, []);

  const progress = useMemo(() => getChecklistProgress(state), [state]);
  const grouped = useMemo(() => groupBuiltInByCategory(), []);

  const handleAddCustom = () => {
    persist(addCustomItem(state, customTitle, customDue));
    setCustomTitle("");
    setCustomDue("");
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-2xl space-y-6 overflow-x-hidden px-3 py-4 pb-24 md:p-8 md:pb-8">
      <Link
        to="/campus"
        className="inline-flex min-h-11 items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
      >
        <ChevronLeft size={16} />
        Campus services
      </Link>

      <section className="space-y-2">
        <Badge>Applications</Badge>
        <h1 className="text-[clamp(1.5rem,5vw,2rem)] font-semibold tracking-tight text-[var(--text-heading)]">
          College checklist
        </h1>
        <p className="text-sm leading-relaxed text-[var(--text-muted)]">
          Real college steps outside Learn — FAFSA, counselor, SAT scores, essays. Check items off as
          you go; add your own deadlines.
        </p>
      </section>

      <Card variant="quiet" className="space-y-3 p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-[var(--text-heading)]">Progress</span>
          <span className="font-mono text-sm tabular-nums text-[var(--accent)]">
            {progress.done}/{progress.total} · {progress.pct}%
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[var(--border)]">
          <div
            className="h-full rounded-full bg-[var(--accent-2)] transition-all"
            style={{ width: `${progress.pct}%` }}
          />
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          Learn teaches and tracks study; this list tracks admissions paperwork. Not legal or
          financial advice.
        </p>
      </Card>

      {[...grouped.entries()].map(([category, items]) => (
        <section key={category} className="space-y-2">
          <h2 className="text-[11px] font-medium uppercase tracking-widest text-[var(--text-muted)]">
            {category}
          </h2>
          <ul className="space-y-2">
            {items.map((item) => {
              const done = !!state.completed[item.id];
              return (
                <li key={item.id}>
                  <Card
                    variant="default"
                    className={cn(
                      "flex gap-3 p-4 transition",
                      done && "opacity-75",
                    )}
                  >
                    <button
                      type="button"
                      aria-label={done ? "Mark incomplete" : "Mark complete"}
                      onClick={() =>
                        persist(toggleBuiltInItem(state, item.id, !done))
                      }
                      className={cn(
                        "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition touch-manipulation",
                        done
                          ? "border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--accent)]"
                          : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-strong)]",
                      )}
                    >
                      {done && <Check size={16} />}
                    </button>
                    <div className="min-w-0 flex-1 space-y-1">
                      <p
                        className={cn(
                          "text-sm font-medium text-[var(--text-heading)]",
                          done && "line-through",
                        )}
                      >
                        {item.title}
                      </p>
                      {item.hint && (
                        <p className="text-xs leading-relaxed text-[var(--text-muted)]">
                          {item.hint}
                        </p>
                      )}
                      {item.link && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent)] hover:underline"
                        >
                          {item.linkLabel ?? "Open link"}
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <section className="space-y-3">
        <h2 className="text-[11px] font-medium uppercase tracking-widest text-[var(--text-muted)]">
          Your deadlines
        </h2>
        {state.customItems.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No custom items yet.</p>
        ) : (
          <ul className="space-y-2">
            {state.customItems.map((item) => (
              <li key={item.id}>
                <Card variant="default" className="flex gap-3 p-4">
                  <button
                    type="button"
                    aria-label={item.completed ? "Mark incomplete" : "Mark complete"}
                    onClick={() =>
                      persist(toggleCustomItem(state, item.id, !item.completed))
                    }
                    className={cn(
                      "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition touch-manipulation",
                      item.completed
                        ? "border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--accent)]"
                        : "border-[var(--border)] text-[var(--text-muted)]",
                    )}
                  >
                    {item.completed && <Check size={16} />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-sm font-medium text-[var(--text-heading)]",
                        item.completed && "line-through",
                      )}
                    >
                      {item.title}
                    </p>
                    {item.dueDate && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-[var(--text-muted)]">
                        <Calendar size={12} />
                        Due {item.dueDate}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    aria-label="Remove"
                    onClick={() => persist(removeCustomItem(state, item.id))}
                    className="shrink-0 p-2 text-[var(--text-muted)] hover:text-[var(--danger)]"
                  >
                    <Trash2 size={16} />
                  </button>
                </Card>
              </li>
            ))}
          </ul>
        )}

        <Card variant="quiet" className="space-y-3 p-4">
          <p className="text-sm font-medium text-[var(--text-heading)]">Add a step</p>
          <input
            type="text"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder="e.g. Submit Common App to State U"
            className="w-full rounded-[var(--radius)] border border-[var(--border-strong)] bg-[var(--bg-secondary)] px-3 py-2.5 text-sm text-[var(--text)]"
          />
          <input
            type="date"
            value={customDue}
            onChange={(e) => setCustomDue(e.target.value)}
            className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text)]"
          />
          <Button
            variant="secondary"
            className="min-h-11 w-full touch-manipulation"
            onClick={handleAddCustom}
            disabled={!customTitle.trim()}
          >
            <Plus size={16} />
            Add to checklist
          </Button>
        </Card>
      </section>

      <p className="text-xs text-[var(--text-muted)]">
        Pair with{" "}
        <Link to="/campus/essay-tracker" className="font-medium text-[var(--accent)] hover:underline">
          essay tracker
        </Link>
        ,{" "}
        <Link to="/stats" className="font-medium text-[var(--accent)] hover:underline">
          study transcript
        </Link>
        , and{" "}
        <Link to="/subjects/sat-prep" className="font-medium text-[var(--accent)] hover:underline">
          SAT Prep
        </Link>
        .
      </p>
    </div>
  );
}
