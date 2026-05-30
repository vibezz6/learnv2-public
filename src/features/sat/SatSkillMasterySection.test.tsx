import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import type { Subject } from "@/curriculum/types";
import { SatSkillMasterySection } from "@/features/sat/SatSkillMasterySection";

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
});
