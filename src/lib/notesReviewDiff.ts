export interface NotesPromptRow {
  key: string;
  label: string;
  text: string;
  wordCount: number;
}

export function buildNotesReviewDiffRows(
  responses: Record<string, string>,
  prompts: Array<{ key: string; label: string }>,
): NotesPromptRow[] {
  return prompts
    .map((prompt) => {
      const text = (responses[prompt.key] ?? "").trim();
      const wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0;
      return { key: prompt.key, label: prompt.label, text, wordCount };
    })
    .filter((row) => row.text.length > 0);
}
