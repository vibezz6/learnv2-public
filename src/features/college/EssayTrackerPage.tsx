import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, FileText, PenLine, Plus, Trash2 } from "lucide-react";
import {
  Button,
  Card,
  Field,
  Input,
  Meter,
  PageContainer,
  PageHeader,
  Section,
  Select,
  StatusDot,
  Tag,
  Textarea,
  Toolbar,
} from "@/components/ui";
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

const STATUS_DOT_TONE: Record<
  EssayDraftStatus,
  "muted" | "info" | "warning" | "accent" | "success"
> = {
  not_started: "muted",
  outline: "info",
  draft: "warning",
  revision: "accent",
  final: "success",
};

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
    <PageContainer size="md" className="space-y-7">
      <PageHeader
        backTo={{ to: "/campus", label: "Campus" }}
        eyebrow="Applications"
        title="Essay tracker"
        subtitle="Common App and supplement prompts, draft status, and deadlines. Write in Google Docs or Word — Learn only tracks your pipeline, not the text."
      />

      <Card variant="default" density="normal" className="min-w-0 space-y-3">
        <Meter
          value={progress.pct}
          label="Pipeline"
          hint={`${progress.finalCount}/${progress.total} final · ${progress.inProgress} in progress`}
          size="md"
        />
        {dueSoon.length > 0 ? (
          <Tag tone="warning" size="sm" mono>
            {dueSoon.length} due in next two weeks
          </Tag>
        ) : null}
      </Card>

      <Section
        eyebrow="Essays"
        title={state.essays.length === 0 ? "None yet" : `${state.essays.length} tracked`}
      >
        {state.essays.length === 0 ? (
          <Card variant="quiet" density="normal" className="flex gap-3">
            <FileText size={18} className="shrink-0 text-[var(--text-muted)]" aria-hidden />
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
                  <Card variant="default" density="normal" className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <Tag tone="default" size="sm" className="gap-1">
                            <StatusDot tone={STATUS_DOT_TONE[essay.status]} />
                            {ESSAY_STATUS_LABELS[essay.status]}
                          </Tag>
                          {essay.college ? (
                            <Tag tone="mono" size="sm">
                              {essay.college}
                            </Tag>
                          ) : null}
                          {limit != null ? (
                            <Tag tone="muted" size="sm" mono>
                              ~{limit} words
                            </Tag>
                          ) : null}
                          {essay.dueDate && essay.status !== "final" ? (
                            <Tag tone="warning" size="sm" mono className="gap-1">
                              <Calendar size={10} aria-hidden />
                              {essay.dueDate}
                            </Tag>
                          ) : null}
                        </div>
                        <p className="text-sm font-medium text-[var(--text-heading)]">
                          {essay.title}
                        </p>
                        <p className="text-xs leading-relaxed text-[var(--text-muted)] line-clamp-2">
                          {essay.prompt}
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-label="Remove essay"
                        onClick={() => persist(removeEssay(state, essay.id))}
                        className="shrink-0 rounded-[var(--radius-sm)] p-2 text-[var(--text-subtle)] hover:bg-[var(--danger-bg)] hover:text-[var(--danger-fg)]"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="grid gap-3 border-t border-[var(--rule)] pt-3 sm:grid-cols-2">
                      <Field label="Status">
                        {(id) => (
                          <Select
                            id={id}
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
                          >
                            {ESSAY_STATUS_ORDER.map((s) => (
                              <option key={s} value={s}>
                                {ESSAY_STATUS_LABELS[s]}
                              </option>
                            ))}
                          </Select>
                        )}
                      </Field>
                      <Field label="Due date">
                        {(id) => (
                          <Input
                            id={id}
                            type="date"
                            value={essay.dueDate ?? ""}
                            onChange={(e) =>
                              persist(updateEssayDueDate(state, essay.id, e.target.value))
                            }
                          />
                        )}
                      </Field>
                    </div>
                    <Field label="College" hint="Used for surfacing per-school deadlines.">
                      {(id) => (
                        <Input
                          id={id}
                          type="text"
                          value={essay.college ?? ""}
                          onChange={(e) =>
                            persist(updateEssayCollege(state, essay.id, e.target.value))
                          }
                          placeholder="College name (optional)"
                        />
                      )}
                    </Field>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <Section eyebrow="Add from prompt" title="New essay row" divider>
        <div className="space-y-3">
          <Field label="Template">
            {(id) => (
              <Select id={id} value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
                {DEFAULT_ESSAY_PROMPTS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                    {p.wordLimit ? ` (${p.wordLimit}w)` : ""}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="College" hint="Optional">
              {(id) => (
                <Input
                  id={id}
                  type="text"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  placeholder="State U"
                />
              )}
            </Field>
            <Field label="Due date" hint="Optional">
              {(id) => (
                <Input
                  id={id}
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              )}
            </Field>
          </div>
          <Toolbar density="tight">
            <Button onClick={handleAddTemplate}>
              <Plus size={14} aria-hidden />
              Add essay
            </Button>
            <Button variant="ghost" onClick={() => setShowCustomForm((v) => !v)}>
              <PenLine size={14} aria-hidden />
              {showCustomForm ? "Hide custom form" : "Custom prompt instead"}
            </Button>
          </Toolbar>

          {showCustomForm ? (
            <Card variant="quiet" density="normal" className="space-y-3">
              <p className="eyebrow-mono">Custom essay</p>
              <Field label="Title">
                {(id) => (
                  <Input
                    id={id}
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="UC PIQ #1"
                  />
                )}
              </Field>
              <Field label="Prompt or notes">
                {(id) => (
                  <Textarea
                    id={id}
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Paste the prompt or your notes"
                    rows={3}
                  />
                )}
              </Field>
              <Button
                variant="secondary"
                onClick={handleAddCustom}
                disabled={!customTitle.trim()}
                className="w-full sm:w-auto"
              >
                <Plus size={14} aria-hidden />
                Add custom
              </Button>
            </Card>
          ) : null}
        </div>
      </Section>
    </PageContainer>
  );
}
