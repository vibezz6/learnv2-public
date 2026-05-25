import { describe, expect, it } from "vitest";
import { buildNotesReviewDiffRows } from "@/lib/notesReviewDiff";

describe("notesReviewDiff", () => {
  it("returns only filled prompts with word counts", () => {
    const rows = buildNotesReviewDiffRows(
      { a: "one two three", b: "  ", c: "solo" },
      [
        { key: "a", label: "A" },
        { key: "b", label: "B" },
        { key: "c", label: "C" },
      ],
    );
    expect(rows).toHaveLength(2);
    expect(rows[0]?.wordCount).toBe(3);
    expect(rows[1]?.key).toBe("c");
  });
});
