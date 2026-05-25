import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  FileText,
  PenLine,
  Plus,
  Trash2,
} from "lucide-react";
import { Button, Card, PageContainer, PageHeader } from "@/components/ui";
import {
  addCustomEssay,
  addEssayFromTemplate,
  DEFAULT_ESSAY_PROMPTS,
  ESSAY_STATUS_LABELS,
  ESSAY_STATUS_ORDER,
  getEssayTrackerProgress,
  getEssaysDueSoon,
  loadEssayTracker,
  removeEssay,
  saveEssayTracker,
  updateEssayCollege,
  updateEssayDueDate,
  updateEssayStatus,
  wordLimitForEntry,
  type EssayDraftStatus,
  type EssayTrackerState,
} from "@/lib/essayTracker";

export function EssayTrackerPage() {
  const [state, setState] = useState<EssayTrackerState>(() => loadEssayTracker());
  const [templateId, setTemplateId] = useState(DEFAULT_ESSAY_PROMPTS[0]!.id);
  const [college, setCollege] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [showCustomForm, setShowCustomForm] = useState(false);

  const persist = useCallback((next: EssayTrackerState) => {
    setState(next);
    saveEssayTracker(next);
  }, []);

  const progress = useMemo(() => getEssayTrackerProgress(state), [state]);
  const dueSoon = useMemo(() => getEssaysDueSoon(state), [state]);

  const handleAddTemplate = () => {
    persist(
      addEssayFromTemplate(state, templateId, {
        college: college || undefined,
        dueDate: dueDate || undefined,
      }),
    );
    setCollege("");
    setDueDate("");
  };

  const handleAddCustom = () => {
    persist(
      addCustomEssay(state, customTitle, customPrompt, {
        college: college || undefined,
        dueDate: dueDate || undefined,
      }),
    );
    setCustomTitle("");
    setCustomPrompt("");
    setCollege("");
    setDueDate("");
    setShowCustomForm(false);
  };

  return (
    <PageContainer size="md" className="space-y-6">
      <PageHeader
        backTo={{ to: "/campus", label: "Campus" }}
        eyebrow="Applications"
        title="Essay tracker"
        subtitle="Common App and supplement prompts, draft status, and deadlines. Write in Google Docs or Word — Learn only tracks your pipeline, not the text."
      />

      <Card variant="quiet" className="space-y-3 p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-[var(--text-heading)]">Pipeline</span>
          <span className="font-mono text-sm tabular-nums text-[var(--accent)]">
            {progress.finalCount}/{progress.total} final · {progress.inProgress} in progress
          </span>
        </div>
        {progress.total > 0 && (
          <div className="h-2 overflow-hidden rounded-full bg-[var(--border)]">
            <div
              className="h-full rounded-full bg-[var(--accent-2)] transition-all"
              style={{ width: `${progress.pct}%` }}
            />
          </div>
        )}
        {dueSoon.length > 0 && (
          <p className="text-xs text-[var(--warning)]">
            {dueSoon.length} essay{dueSoon.length === 1 ? "" : "s"} due in the next two weeks.
          </p>
        )}
      </Card>

      {state.essays.length === 0 ? (
        <Card variant="default" className="flex gap-3 p-5">
          <FileText size={20} className="shrink-0 text-[var(--text-muted)]" />
          <p className="text-sm text-[var(--text-muted)]">
            Add a prompt below to start. Pair with the{" "}
            <Link
              to="/campus/college-checklist"
              className="font-medium text-[var(--accent)] hover:underline"
            >
              college checklist
            </Link>{" "}
            for FAFSA and score send steps.
          </p>
        </Card>
      ) : (
        <ul className="space-y-3">
          {state.essays.map((essay) => {
            const limit = wordLimitForEntry(essay);
            return (
              <li key={essay.id}>
                <Card variant="default" className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-sm font-medium text-[var(--text-heading)]">
                        {essay.title}
                      </p>
                      {essay.college && (
                        <p className="text-xs text-[var(--text-muted)]">{essay.college}</p>
                      )}
                      {limit != null && (
                        <p className="text-[11px] text-[var(--text-muted)]">~{limit} words</p>
                      )}
                    </div>
                    <button
                      type="button"
                      aria-label="Remove essay"
                      onClick={() => persist(removeEssay(state, essay.id))}
                      className="shrink-0 p-2 text-[var(--text-muted)] hover:text-[var(--danger)]"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <p className="text-xs leading-relaxed text-[var(--text-muted)] line-clamp-3">
                    {essay.prompt}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block space-y-1">
                      <span className="text-[11px] font-medium uppercase tracking-widest text-[var(--text-muted)]">
                        Status
                      </span>
                      <select
                        value={essay.status}
                        onChange={(e) =>
                          persist(
                            updateEssayStatus(
                              state,
                              essay.id,
                              e.target.value as EssayDraftStatus,
                            ),
                          )
                        }
                        className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2.5 text-sm text-[var(--text)]"
                      >
                        {ESSAY_STATUS_ORDER.map((s) => (
                          <option key={s} value={s}>
                            {ESSAY_STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block space-y-1">
                      <span className="text-[11px] font-medium uppercase tracking-widest text-[var(--text-muted)]">
                        Due date
                      </span>
                      <input
                        type="date"
                        value={essay.dueDate ?? ""}
                        onChange={(e) =>
                          persist(updateEssayDueDate(state, essay.id, e.target.value))
                        }
                        className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2.5 text-sm text-[var(--text)]"
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    value={essay.college ?? ""}
                    onChange={(e) =>
                      persist(updateEssayCollege(state, essay.id, e.target.value))
                    }
                    placeholder="College name (optional)"
                    className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text)]"
                  />
                  {essay.dueDate && essay.status !== "final" && (
                    <p className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                      <Calendar size={12} />
                      Due {essay.dueDate}
                    </p>
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <section className="space-y-3">
        <h2 className="text-[11px] font-medium uppercase tracking-widest text-[var(--text-muted)]">
          Add from prompt
        </h2>
        <Card variant="quiet" className="space-y-3 p-4">
          <label className="block space-y-1">
            <span className="text-xs text-[var(--text-muted)]">Template</span>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="w-full rounded-[var(--radius)] border border-[var(--border-strong)] bg-[var(--bg-secondary)] px-3 py-2.5 text-sm text-[var(--text)]"
            >
              {DEFAULT_ESSAY_PROMPTS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                  {p.wordLimit ? ` (${p.wordLimit}w)` : ""}
                </option>
              ))}
            </select>
          </label>
          <input
            type="text"
            value={college}
            onChange={(e) => setCollege(e.target.value)}
            placeholder="College (optional)"
            className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text)]"
          />
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text)]"
          />
          <Button
            className="min-h-11 w-full touch-manipulation"
            onClick={handleAddTemplate}
          >
            <Plus size={16} />
            Add essay
          </Button>
        </Card>

        {!showCustomForm ? (
          <Button
            variant="secondary"
            className="min-h-11 w-full touch-manipulation"
            onClick={() => setShowCustomForm(true)}
          >
            <PenLine size={16} />
            Custom prompt instead
          </Button>
        ) : (
          <Card variant="quiet" className="space-y-3 p-4">
            <p className="text-sm font-medium text-[var(--text-heading)]">Custom essay</p>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="Title, e.g. UC PIQ #1"
              className="w-full rounded-[var(--radius)] border border-[var(--border-strong)] bg-[var(--bg-secondary)] px-3 py-2.5 text-sm text-[var(--text)]"
            />
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Paste the prompt or your notes"
              rows={3}
              className="w-full resize-y rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text)]"
            />
            <Button
              variant="secondary"
              className="min-h-11 w-full touch-manipulation"
              onClick={handleAddCustom}
              disabled={!customTitle.trim()}
            >
              <Plus size={16} />
              Add custom
            </Button>
          </Card>
        )}
      </section>
    </PageContainer>
  );
}
