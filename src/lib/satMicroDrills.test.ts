import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Subject } from "@/curriculum/types";
import { SAT_MISTAKE_LOG_KEY } from "@/lib/satMistakeLog";
import { buildSatMicroDrill } from "@/lib/satMicroDrills";

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

const subjects: Subject[] = [
  {
    id: "sat-prep",
    name: "SAT Prep",
    description: "",
    color: "#000",
    icon: "book",
    nodes: [
      {
        id: "st10",
        name: "Linear equations",
        description: "Solve linear equations.",
        xpValue: 10,
        parentIds: [],
        estimatedMinutes: 10,
        resources: [],
        keyConcepts: ["linear equations"],
        whyItMatters: "Useful.",
        practiceProblems: ["Solve x + 2 = 5."],
        difficulty: "beginner",
        quiz: [
          {
            id: "q1",
            question: "Solve a linear equation.",
            options: ["1", "2"],
            correctIndex: 0,
            explanation: "Use inverse operations.",
          },
        ],
      },
    ],
  },
];

describe("satMicroDrills", () => {
  let storage: Storage;

  beforeEach(() => {
    storage = mockStorage();
    vi.stubGlobal("localStorage", storage);
  });

  it("builds a drill from the top mistake category", () => {
    storage.setItem(
      SAT_MISTAKE_LOG_KEY,
      JSON.stringify([
        {
          id: "m1",
          date: "2026-05-28",
          section: "math",
          category: "Linear equations",
          nodeId: "st10",
          note: "sign error",
          createdAt: 1,
        },
      ]),
    );

    const drill = buildSatMicroDrill(subjects, storage);
    expect(drill.title).toContain("Linear equations");
    expect(drill.href).toBe("/subjects/sat-prep/st10");
    expect(drill.questions).toHaveLength(1);
  });
});
