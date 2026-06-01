import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Check, ExternalLink, Plus, Trash2 } from "lucide-react";
import {
  Button,
  Card,
  Field,
  Input,
  Meter,
  PageContainer,
  PageHeader,
  Section,
  Tag,
} from "@/components/ui";
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
    <PageContainer size="md" className="space-y-7">
      <PageHeader
        backTo={{ to: "/campus", label: "College" }}
        eyebrow="Applications"
        title="College checklist"
        subtitle="Real college steps outside Learn — FAFSA, counselor, SAT scores, essays. Check items off as you go; add your own deadlines."
      />

      <Card variant="default" density="normal" className="min-w-0 space-y-3">
        <Meter
          value={progress.pct}
          label="Overall progress"
          hint={`${progress.done}/${progress.total} · ${progress.pct}%`}
          size="md"
        />
        <p className="text-xs text-[var(--text-muted)]">
          Learn teaches and tracks study; this list tracks admissions paperwork. Not legal or
          financial advice.
        </p>
      </Card>

      {[...grouped.entries()].map(([category, items]) => (
        <Section key={category} eyebrow={category}>
          <ul className="space-y-2">
            {items.map((item) => {
              const done = !!state.completed[item.id];
              return (
                <li key={item.id}>
                  <div
                    className={cn(
                      "flex min-h-12 gap-3 rounded-[var(--radius-md)] border border-[var(--rule)] bg-[var(--bg-panel)] px-4 py-3 transition",
                      done && "opacity-70",
                    )}
                  >
                    <button
                      type="button"
                      aria-label={done ? "Mark incomplete" : "Mark complete"}
                      onClick={() => persist(toggleBuiltInItem(state, item.id, !done))}
                      className={cn(
                        "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border transition touch-manipulation",
                        done
                          ? "border-[var(--accent-border)] bg-[var(--accent-bg)] text-[var(--accent)]"
                          : "border-[var(--rule-strong)] text-transparent hover:border-[var(--accent-border)]",
                      )}
                    >
                      <Check size={13} />
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
                      {item.hint ? (
                        <p className="text-xs leading-relaxed text-[var(--text-muted)]">
                          {item.hint}
                        </p>
                      ) : null}
                      {item.link ? (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent)] hover:underline"
                        >
                          {item.linkLabel ?? "Open link"}
                          <ExternalLink size={11} aria-hidden />
                        </a>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Section>
      ))}

      <Section eyebrow="Your deadlines" title="Custom checklist items">
        {state.customItems.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No custom items yet.</p>
        ) : (
          <ul className="space-y-2">
            {state.customItems.map((item) => (
              <li key={item.id}>
                <div className="flex min-h-12 items-start gap-3 rounded-[var(--radius-md)] border border-[var(--rule)] bg-[var(--bg-panel)] px-4 py-3">
                  <button
                    type="button"
                    aria-label={item.completed ? "Mark incomplete" : "Mark complete"}
                    onClick={() => persist(toggleCustomItem(state, item.id, !item.completed))}
                    className={cn(
                      "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border transition touch-manipulation",
                      item.completed
                        ? "border-[var(--accent-border)] bg-[var(--accent-bg)] text-[var(--accent)]"
                        : "border-[var(--rule-strong)] text-transparent hover:border-[var(--accent-border)]",
                    )}
                  >
                    <Check size={13} />
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
                    {item.dueDate ? (
                      <Tag tone="mono" size="sm" className="mt-1.5 gap-1">
                        <Calendar size={11} aria-hidden />
                        Due {item.dueDate}
                      </Tag>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    aria-label="Remove"
                    onClick={() => persist(removeCustomItem(state, item.id))}
                    className="shrink-0 rounded-[var(--radius-sm)] p-2 text-[var(--text-subtle)] hover:bg-[var(--danger-bg)] hover:text-[var(--danger-fg)]"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <Card variant="quiet" density="normal" className="mt-3 space-y-3">
          <p className="eyebrow-mono">Add a step</p>
          <Field label="Title">
            {(id) => (
              <Input
                id={id}
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g. Submit Common App to State U"
              />
            )}
          </Field>
          <Field label="Due date" hint="Optional — used to surface in week plan and Today.">
            {(id) => (
              <Input
                id={id}
                type="date"
                value={customDue}
                onChange={(e) => setCustomDue(e.target.value)}
              />
            )}
          </Field>
          <Button
            onClick={handleAddCustom}
            disabled={!customTitle.trim()}
            className="w-full sm:w-auto"
          >
            <Plus size={14} aria-hidden />
            Add to checklist
          </Button>
        </Card>
      </Section>

      <p className="border-t border-[var(--rule)] pt-4 text-xs text-[var(--text-muted)]">
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
    </PageContainer>
  );
}
