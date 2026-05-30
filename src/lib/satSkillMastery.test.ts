import { describe, expect, it } from "vitest";
import type { Subject } from "@/curriculum/types";
import { SAT_MISTAKE_LOG_KEY } from "@/lib/satMistakeLog";
import { countSatQuestionsBySkill, getSatSkillMastery } from "@/lib/satSkillMastery";

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

function q(id: string, mc = true) {
  return mc
    ? { id, question: `Q ${id}`, options: ["a", "b"], correctIndex: 0, explanation: "" }
    : { id, question: `Q ${id}`, options: ["a"], correctIndex: 0, explanation: "" };
}
function node(id: string, quiz: ReturnType<typeof q>[]) {
  return { id, name: id, description: "", keyConcepts: [], quiz };
}

const subjects = [
  {
    id: "sat-prep",
    name: "SAT",
    description: "",
    color: "#000",
    icon: "g",
    nodes: [
      node("st17", [q("st17-1"), q("st17-2"), q("st17-3")]), // linear-equations: 3 MC
      node("st27", [q("st27-1"), q("st27-2", false)]), // sentence-boundaries: 1 MC (+1 non-MC)
      node("st3", [q("st3-1")]), // math-mixed (excluded from rows)
      node("st1", [q("st1-1")]), // test-strategy / general (excluded)
    ],
  },
] as unknown as Subject[];

describe("satSkillMastery", () => {
  it("counts MC questions per skill (excluding non-MC)", () => {
    const counts = countSatQuestionsBySkill(subjects);
    expect(counts.get("linear-equations")).toBe(3);
    expect(counts.get("sentence-boundaries")).toBe(1);
  });

  it("merges signals, ranks weakest-first, and excludes mixed/general", () => {
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
          createdAt: 2,
        },
        {
          id: "m2",
          date: "2026-05-29",
          section: "math",
          skillId: "linear-equations",
          category: "Linear equations",
          note: "y",
          createdAt: 1,
        },
      ]),
    );

    const rows = getSatSkillMastery(subjects, storage);
    expect(rows[0]?.skillId).toBe("linear-equations");

    const lin = rows.find((r) => r.skillId === "linear-equations");
    expect(lin?.mistakeCount).toBe(2);
    expect(lin?.questionCount).toBe(3);
    expect(lin?.hasSignal).toBe(true);

    const sb = rows.find((r) => r.skillId === "sentence-boundaries");
    expect(sb?.questionCount).toBe(1);
    expect(sb?.hasSignal).toBe(false);

    expect(rows.some((r) => r.skillId === "math-mixed")).toBe(false);
    expect(rows.some((r) => r.skillId === "test-strategy")).toBe(false);
  });
});
