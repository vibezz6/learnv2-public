import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SkillNode } from "@/curriculum/types";
import {
  addLessonDraft,
  deleteLessonDraft,
  loadLessonDrafts,
  parseLessonDraftJson,
  updateLessonDraftReview,
} from "@/lib/lessonDrafts";

function mockStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => map.set(k, v),
    removeItem: (k) => map.delete(k),
    key: (i) => [...map.keys()][i] ?? null,
  };
}

const node: SkillNode = {
  id: "st-draft",
  name: "Draft Lesson",
  description: "Learn a focused draft topic.",
  xpValue: 80,
  parentIds: ["st1"],
  estimatedMinutes: 25,
  resources: [],
  keyConcepts: ["one", "two"],
  whyItMatters: "It helps keep generated lessons useful.",
  practiceProblems: ["Explain the idea in your own words."],
  difficulty: "beginner",
};

describe("lessonDrafts", () => {
  let storage: Storage;

  beforeEach(() => {
    storage = mockStorage();
    vi.stubGlobal("localStorage", storage);
  });

  it("parses and stores a draft lesson", () => {
    const parsed = parseLessonDraftJson(JSON.stringify(node));
    expect("node" in parsed ? parsed.node.id : null).toBe("st-draft");
    if (!("node" in parsed)) throw new Error("expected parsed node");

    const draft = addLessonDraft({ subjectId: "sat-prep", node: parsed.node, sourceModel: "cheap-model" }, storage);
    expect(draft.status).toBe("draft");
    expect(loadLessonDrafts(storage).drafts[0]?.sourceModel).toBe("cheap-model");
  });

  it("marks review notes and deletes drafts", () => {
    const draft = addLessonDraft({ subjectId: "math", node }, storage);
    const reviewed = updateLessonDraftReview(draft.id, "Checked by stronger model.", storage);
    expect(reviewed?.status).toBe("reviewed");
    expect(deleteLessonDraft(draft.id, storage)).toBe(true);
    expect(loadLessonDrafts(storage).drafts).toHaveLength(0);
  });
});
