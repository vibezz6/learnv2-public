import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateLLMPretestRationaleReview } from "@/services/llmReview";

describe("generateLLMPretestRationaleReview", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", {
      getItem: (key: string) =>
        key === "learnv2_openrouter_key" ? "test-key" : null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("parses JSON feedback from OpenRouter", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  feedback: "You mixed up percent decrease with the final price.",
                  misconception: "Applied discount to wrong base",
                  studyTip: "Write the original price, then compute 25% of that value.",
                }),
              },
            },
          ],
        }),
      }),
    );

    const result = await generateLLMPretestRationaleReview({
      skill: "Percent change",
      section: "math",
      domain: "Problem Solving",
      prompt: "A $60 item is 25% off.",
      choices: [
        { id: "a", text: "$15" },
        { id: "b", text: "$45" },
      ],
      selectedChoiceId: "a",
      correctChoiceId: "b",
      studentRationale: "I subtracted wrong.",
      explanation: "25% of 60 is 15; sale price is 45.",
    });

    expect(result?.feedback).toContain("percent");
    expect(result?.studyTip).toContain("25%");
  });

  it("returns null when API key is missing", async () => {
    vi.stubGlobal("localStorage", {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0,
    });

    const result = await generateLLMPretestRationaleReview({
      skill: "Linear equations",
      section: "math",
      domain: "Algebra",
      prompt: "Solve for x",
      choices: [{ id: "a", text: "1" }],
      selectedChoiceId: "a",
      correctChoiceId: "b",
      studentRationale: "guess",
      explanation: "x = 5",
    });

    expect(result).toBeNull();
  });
});
