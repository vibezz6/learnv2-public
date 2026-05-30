import { useMemo, useState } from "react";
import { Copy, FileText, Plus, Trash2 } from "lucide-react";
import {
  Button,
  Card,
  Field,
  Input,
  Stat,
  Tag,
  Textarea,
  Toolbar,
} from "@/components/ui";
import {
  addLessonDraft,
  deleteLessonDraft,
  loadLessonDrafts,
  parseLessonDraftJson,
  updateLessonDraftReview,
  type LessonDraft,
} from "@/lib/lessonDrafts";
import { cn } from "@/lib/cn";

interface Props {
  onMessage: (message: string) => void;
}

export function LessonDraftWorkspace({ onMessage }: Props) {
  const [subjectId, setSubjectId] = useState("sat-prep");
  const [sourceModel, setSourceModel] = useState("");
  const [rawJson, setRawJson] = useState("");
  const [drafts, setDrafts] = useState<LessonDraft[]>(() => loadLessonDrafts().drafts);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reviewDraft, setReviewDraft] = useState("");
  const [showJson, setShowJson] = useState(false);

  const refresh = () => setDrafts(loadLessonDrafts().drafts);
  const selected = useMemo(
    () => drafts.find((d) => d.id === selectedId) ?? drafts[0] ?? null,
    [drafts, selectedId],
  );

  const handleAdd = () => {
    const parsed = parseLessonDraftJson(rawJson);
    if ("error" in parsed) {
      onMessage(parsed.error);
      return;
    }
    addLessonDraft({ subjectId, sourceModel, node: parsed.node });
    setRawJson("");
    refresh();
    onMessage("Lesson draft saved locally for review.");
  };

  const copyDraft = async (draft: LessonDraft) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(draft.node, null, 2));
      onMessage("Draft node JSON copied.");
    } catch {
      onMessage("Could not copy draft JSON.");
    }
  };

  const handleSelect = (draft: LessonDraft) => {
    setSelectedId(draft.id);
    setReviewDraft(draft.reviewNotes ?? "");
    setShowJson(false);
  };

  const handleSaveReview = () => {
    if (!selected) return;
    updateLessonDraftReview(selected.id, reviewDraft);
    refresh();
    onMessage("Review notes saved.");
  };

  const handleDelete = (draft: LessonDraft) => {
    deleteLessonDraft(draft.id);
    refresh();
    if (selectedId === draft.id) {
      setSelectedId(null);
      setReviewDraft("");
    }
    onMessage("Draft removed.");
  };

  return (
    <Card variant="default" density="normal" className="min-w-0 space-y-4">
      <p className="text-sm text-[var(--text-muted)]">
        Paste an AI-generated SkillNode JSON, validate the shape, and keep it local until reviewed.
        This does not write curriculum files.
      </p>

      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Subject ID">
          {(id) => (
            <Input id={id} value={subjectId} onChange={(e) => setSubjectId(e.target.value)} />
          )}
        </Field>
        <Field label="Source model" hint="Optional — model that generated this draft.">
          {(id) => (
            <Input
              id={id}
              value={sourceModel}
              onChange={(e) => setSourceModel(e.target.value)}
              placeholder="claude-opus / gpt / etc."
            />
          )}
        </Field>
      </div>
      <Field label="SkillNode JSON" hint='Paste a single node, e.g. {"id":"st81","name":"…",…}'>
        {(id) => (
          <Textarea
            id={id}
            value={rawJson}
            onChange={(e) => setRawJson(e.target.value)}
            placeholder='{"id":"st81","name":"…","description":"…",…}'
            className="min-h-32 font-mono text-xs"
          />
        )}
      </Field>
      <Button onClick={handleAdd} disabled={!rawJson.trim()}>
        <Plus size={14} aria-hidden />
        Save draft locally
      </Button>

      <div className="grid gap-4 border-t border-[var(--rule)] pt-4 md:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
        <div className="min-w-0">
          <p className="eyebrow-mono mb-2">Drafts ({drafts.length})</p>
          {drafts.length === 0 ? (
            <p className="rounded-[var(--radius)] border border-dashed border-[var(--rule)] bg-[var(--bg-canvas)] px-3 py-4 text-xs text-[var(--text-muted)]">
              No lesson drafts saved yet.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {drafts.map((draft) => {
                const isSelected = selected?.id === draft.id;
                return (
                  <li key={draft.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(draft)}
                      className={cn(
                        "flex w-full flex-col gap-1 rounded-[var(--radius)] border px-3 py-2 text-left transition",
                        isSelected
                          ? "border-[var(--accent-border)] bg-[var(--accent-bg)]"
                          : "border-[var(--rule)] bg-[var(--bg-panel)] hover:border-[var(--rule-strong)]",
                      )}
                    >
                      <span className="truncate text-sm font-medium text-[var(--text-heading)]">
                        {draft.node.name}
                      </span>
                      <span className="flex flex-wrap items-center gap-1.5">
                        <Tag tone="mono" size="sm">
                          {draft.subjectId}
                        </Tag>
                        <Tag tone={draft.status === "reviewed" ? "success" : "muted"} size="sm" mono>
                          {draft.status}
                        </Tag>
                        {draft.sourceModel ? (
                          <Tag tone="muted" size="sm">
                            {draft.sourceModel}
                          </Tag>
                        ) : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="min-w-0">
          {selected ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--rule)] pb-3">
                <div className="min-w-0 flex-1">
                  <p className="eyebrow-mono">Selected draft</p>
                  <p className="mt-1 truncate text-sm font-medium text-[var(--text-heading)]">
                    {selected.node.name}
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] text-[var(--text-muted)]">
                    {selected.subjectId} · {selected.node.id}
                  </p>
                </div>
                <Toolbar density="tight">
                  <Button variant="secondary" size="sm" onClick={() => copyDraft(selected)}>
                    <Copy size={13} aria-hidden />
                    Copy JSON
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    tone="danger"
                    onClick={() => handleDelete(selected)}
                  >
                    <Trash2 size={13} aria-hidden />
                    Delete
                  </Button>
                </Toolbar>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Stat
                  label="Difficulty"
                  value={selected.node.difficulty ?? "—"}
                  size="sm"
                />
                <Stat
                  label="XP"
                  value={selected.node.xpValue}
                  sub={`${selected.node.estimatedMinutes ?? 0}m`}
                  size="sm"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowJson((v) => !v)}
                className="inline-flex items-center gap-1 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                <FileText size={11} aria-hidden />
                {showJson ? "Hide" : "View"} raw JSON
              </button>
              {showJson ? (
                <pre className="max-h-72 overflow-auto rounded-[var(--radius)] border border-[var(--rule)] bg-[var(--bg-sunken)] p-3 font-mono text-[11px] leading-relaxed text-[var(--text)]">
                  {JSON.stringify(selected.node, null, 2)}
                </pre>
              ) : null}

              <Field label="Review notes" hint="Add feedback from a stronger model or human review.">
                {(id) => (
                  <Textarea
                    id={id}
                    value={reviewDraft}
                    onChange={(e) => setReviewDraft(e.target.value)}
                    placeholder="Notes — what to keep, what to revise, source model verdict…"
                    rows={4}
                  />
                )}
              </Field>
              <Button size="sm" onClick={handleSaveReview}>
                Save review
              </Button>
            </div>
          ) : (
            <div className="rounded-[var(--radius)] border border-dashed border-[var(--rule)] bg-[var(--bg-canvas)] px-4 py-6 text-center text-sm text-[var(--text-muted)]">
              Select a draft from the list to review.
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
