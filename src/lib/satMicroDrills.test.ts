import { describe, expect, it } from "vitest";
import type { Subject } from "@/curriculum/types";
import { SAT_MISTAKE_LOG_KEY } from "@/lib/satMistakeLog";
import { recordSatQuestionsSeen } from "@/lib/satQuestionHistory";
import { buildSatMicroDrill, skillTargetSummary } from "@/lib/satMicroDrills";

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

function q(id: string) {
  return { id, question: `Q ${id}?`, options: ["a", "b"], correctIndex: 0, explanation: "" };
}
function node(id: string, name: string, questionCount = 2) {
  const quiz = Array.from({ length: questionCount }, (_, i) => q(`${id}-q${i + 1}`));
  return { id, name, description: "", keyConcepts: [], quiz };
}

// Real node ids so SAT_NODE_SKILLS applies: st17/st4 = linear-equations, st27 = sentence-boundaries, st1 = general.
const subjects = [
  {
    id: "sat-prep",
    name: "SAT",
    description: "",
    color: "#000",
    icon: "g",
    nodes: [node("st17", "Linear"), node("st4", "Algebra"), node("st27", "Punctuation"), node("st1", "Plan")],
  },
] as unknown as Subject[];

function seed(storage: Storage, entry: Record<string, unknown>) {
  storage.setItem(SAT_MISTAKE_LOG_KEY, JSON.stringify([entry]));
}

describe("buildSatMicroDrill (skill-based)", () => {
  it("targets the logged skill's questions first and flags thin coverage", () => {
    const storage = mapStorage();
    seed(storage, {
      id: "m1",
      date: "2026-05-29",
      section: "math",
      category: "Linear equations",
      skillId: "linear-equations",
      note: "x",
      createdAt: 1,
    });
    const drill = buildSatMicroDrill(subjects, storage, 5);
    const nodeIds = drill.questions.map((x) => x.nodeId);
    expect(nodeIds[0]).toBe("st17"); // same-skill node ranks first
    expect(nodeIds).not.toContain("st27"); // R&W node not in the top 5
    expect(drill.thin).toBe(true); // only 4 linear-equations questions exist (< 5)
  });

  it("resolves a legacy free-text category to a skill", () => {
    const storage = mapStorage();
    seed(storage, {
      id: "m1",
      date: "2026-05-29",
      section: "rw",
      category: "commas",
      note: "x",
      createdAt: 1,
    });
    const drill = buildSatMicroDrill(subjects, storage, 5);
    expect(drill.questions[0]?.nodeId).toBe("st27"); // commas -> sentence-boundaries -> st27
  });

  it("falls back to a warm-up when no mistakes are logged", () => {
    const storage = mapStorage();
    const drill = buildSatMicroDrill(subjects, storage, 5);
    expect(drill.questions.length).toBeGreaterThan(0);
    expect(drill.thin).toBe(false); // no targeted skill -> not flagged thin
  });

  it("skillTargetSummary builds a target that drills that skill's questions", () => {
    const storage = mapStorage();
    const target = skillTargetSummary("sentence-boundaries");
    expect(target?.skillId).toBe("sentence-boundaries");
    const drill = buildSatMicroDrill(subjects, storage, 5, target);
    expect(drill.questions[0]?.nodeId).toBe("st27");
  });

  it("skillTargetSummary returns null for non-content (mixed/general) skills", () => {
    expect(skillTargetSummary("test-strategy")).toBeNull();
    expect(skillTargetSummary("math-mixed")).toBeNull();
  });

  it("deprioritizes recently seen question ids when the bank is large enough", () => {
    const storage = mapStorage();
    const richSubjects = [
      {
        id: "sat-prep",
        name: "SAT",
        description: "",
        color: "#000",
        icon: "g",
        nodes: [node("st17", "Linear", 8), node("st4", "Algebra", 2)],
      },
    ] as unknown as Subject[];
    seed(storage, {
      id: "m1",
      date: "2026-05-29",
      section: "math",
      category: "Linear equations",
      skillId: "linear-equations",
      note: "x",
      createdAt: 1,
    });
    const first = buildSatMicroDrill(richSubjects, storage, 5);
    const firstIds = first.questions.map((x) => x.question.id);
    recordSatQuestionsSeen(firstIds, { skillId: "linear-equations", storage });
    const second = buildSatMicroDrill(richSubjects, storage, 5);
    const secondIds = second.questions.map((x) => x.question.id);
    expect(firstIds.length).toBe(5);
    expect(secondIds.some((id) => !firstIds.includes(id))).toBe(true);
  });

  it("dedupes and stays within the limit", () => {
    const storage = mapStorage();
    seed(storage, {
      id: "m1",
      date: "2026-05-29",
      section: "math",
      skillId: "linear-equations",
      category: "Linear equations",
      note: "x",
      createdAt: 1,
    });
    const drill = buildSatMicroDrill(subjects, storage, 5);
    expect(drill.questions.length).toBeLessThanOrEqual(5);
    const ids = drill.questions.map((x) => x.question.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
