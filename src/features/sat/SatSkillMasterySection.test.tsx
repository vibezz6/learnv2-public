import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import type { Subject } from "@/curriculum/types";
import { SAT_MISTAKE_LOG_KEY } from "@/lib/satMistakeLog";
import { SatSkillMasterySection } from "@/features/sat/SatSkillMasterySection";

function mapStorage(): Storage {
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
  } as Storage;
}

const subject = {
  id: "sat-prep",
  name: "SAT",
  description: "",
  color: "#000",
  icon: "g",
  nodes: [
    {
      id: "st17",
      name: "Linear",
      description: "",
      keyConcepts: [],
      quiz: [{ id: "st17-1", question: "Q", options: ["a", "b"], correctIndex: 0, explanation: "" }],
    },
  ],
} as unknown as Subject;

describe("SatSkillMasterySection", () => {
  it("renders the empty state when there are no logged signals", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <SatSkillMasterySection subject={subject} />
      </MemoryRouter>,
    );
    expect(html).toContain("Log a mistake");
    expect(html).toContain("All skills");
  });

  it("renders a per-skill drill link for a tracked weak skill", () => {
    const storage = mapStorage();
    storage.setItem(
      SAT_MISTAKE_LOG_KEY,
      JSON.stringify([
        {
          id: "m1",
          date: "2026-05-29",
          section: "math",
          skillId: "linear-equations",
          category: "Linear equations",
          note: "x",
          createdAt: 1,
        },
      ]),
    );
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <SatSkillMasterySection subject={subject} storage={storage} />
      </MemoryRouter>,
    );
    expect(html).toContain("/sat/drill?skill=linear-equations");
  });
});
