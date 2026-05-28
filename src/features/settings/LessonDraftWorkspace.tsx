import { useState } from "react";
import { Button, Card } from "@/components/ui";
import {
  addLessonDraft,
  deleteLessonDraft,
  loadLessonDrafts,
  parseLessonDraftJson,
  updateLessonDraftReview,
  type LessonDraft,
} from "@/lib/lessonDrafts";

interface Props {
  onMessage: (message: string) => void;
}

export function LessonDraftWorkspace({ onMessage }: Props) {
  const [subjectId, setSubjectId] = useState("sat-prep");
  const [sourceModel, setSourceModel] = useState("");
  const [rawJson, setRawJson] = useState("");
  const [drafts, setDrafts] = useState<LessonDraft[]>(() => loadLessonDrafts().drafts);

  const refresh = () => setDrafts(loadLessonDrafts().drafts);

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

  return (
    <Card className="min-w-0 space-y-3">
      <h2 className="break-words font-semibold text-[var(--text-heading)]">Lesson draft workspace</h2>
      <p className="break-words text-sm text-[var(--text-muted)]">
        Paste one AI-generated SkillNode JSON, validate the shape, and keep it local until reviewed.
        This does not write curriculum files.
      </p>
      <div className="grid gap-2 min-[640px]:grid-cols-2">
        <label className="text-xs text-[var(--text-muted)]">
          Subject ID
          <input
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="mt-1 min-h-10 w-full rounded-[var(--radius)] border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          />
        </label>
        <label className="text-xs text-[var(--text-muted)]">
          Source model
          <input
            value={sourceModel}
            onChange={(e) => setSourceModel(e.target.value)}
            placeholder="optional"
            className="mt-1 min-h-10 w-full rounded-[var(--radius)] border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          />
        </label>
      </div>
      <textarea
        value={rawJson}
        onChange={(e) => setRawJson(e.target.value)}
        placeholder='Paste one SkillNode JSON object here, e.g. {"id":"st81",...}'
        className="min-h-36 w-full rounded-[var(--radius)] border border-[var(--border)] bg-transparent px-3 py-2 font-mono text-xs outline-none focus:border-[var(--accent)]"
      />
      <Button className="min-h-11 w-full min-[481px]:w-auto" onClick={handleAdd}>
        Save draft locally
      </Button>
      <div className="space-y-2">
        {drafts.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)]">No lesson drafts saved yet.</p>
        ) : (
          drafts.map((draft) => (
            <div key={draft.id} className="rounded-[var(--radius)] border border-[var(--border)] p-3">
              <div className="flex flex-col gap-2 min-[640px]:flex-row min-[640px]:items-start min-[640px]:justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--text-heading)]">{draft.node.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {draft.subjectId} · {draft.status}
                    {draft.sourceModel ? ` · ${draft.sourceModel}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" className="min-h-9 text-xs" onClick={() => copyDraft(draft)}>
                    Copy node JSON
                  </Button>
                  <Button
                    variant="ghost"
                    className="min-h-9 text-xs"
                    onClick={() => {
                      deleteLessonDraft(draft.id);
                      refresh();
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
              <textarea
                defaultValue={draft.reviewNotes ?? ""}
                placeholder="Review notes from a stronger model or human..."
                onBlur={(e) => {
                  updateLessonDraftReview(draft.id, e.target.value);
                  refresh();
                }}
                className="mt-2 min-h-16 w-full rounded-[var(--radius)] border border-[var(--border)] bg-transparent px-3 py-2 text-xs outline-none focus:border-[var(--accent)]"
              />
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
