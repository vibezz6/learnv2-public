import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SatPretestQuestion } from "@/lib/satPretest";
import {
  SAT_PRETEST_DRAFT2_POOL_KEY,
  clearImportedDraft2Questions,
  loadImportedDraft2Questions,
  saveImportedDraft2Questions,
} from "@/lib/satPretestDraft2Pool";

function mockLocalStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k) => map.get(k) ?? null,
    key: (i) => [...map.keys()][i] ?? null,
    removeItem: (k) => map.delete(k),
    setItem: (k, v) => map.set(k, v),
  };
}

const sampleQuestion: SatPretestQuestion = {
  id: "import-1",
  draftId: "draft-2",
  section: "math",
  domain: "Algebra",
  skill: "Linear equations",
  difficulty: "easy",
  prompt: "Solve",
  choices: [
    { id: "a", text: "1" },
    { id: "b", text: "2" },
  ],
  correctChoiceId: "a",
  explanation: "x = 1.",
};

describe("satPretestDraft2Pool", () => {
  let storage: Storage;

  beforeEach(() => {
    storage = mockLocalStorage();
    vi.stubGlobal("localStorage", storage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("roundtrips imported Draft 2 questions", () => {
    saveImportedDraft2Questions([sampleQuestion], storage);
    expect(loadImportedDraft2Questions(storage)).toHaveLength(1);
    expect(loadImportedDraft2Questions(storage)[0]?.id).toBe("import-1");
  });

  it("clearImportedDraft2Questions removes the pool", () => {
    saveImportedDraft2Questions([sampleQuestion], storage);
    clearImportedDraft2Questions(storage);
    expect(storage.getItem(SAT_PRETEST_DRAFT2_POOL_KEY)).toBeNull();
    expect(loadImportedDraft2Questions(storage)).toEqual([]);
  });
});
