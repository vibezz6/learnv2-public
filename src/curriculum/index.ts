import type { Subject } from "@/curriculum/types";

/** Batch 1 placeholder — Batch 2 splits full math from Learn-v1 curriculums.ts */
export const mathSubject: Subject = {
  id: "math",
  name: "Mathematics",
  description: "Foundations through linear algebra — the language of IQ maxxing.",
  color: "#7c6cff",
  icon: "sigma",
  nodes: [
    {
      id: "m1",
      name: "Number Sense & Arithmetic",
      description: "Build fluency with numbers, fractions, and proportional reasoning.",
      xpValue: 50,
      parentIds: [],
      estimatedMinutes: 45,
      resources: [
        {
          title: "Khan Academy — Arithmetic",
          url: "https://www.khanacademy.org/math/arithmetic",
          type: "course",
          whyHelpful: "Structured drills with instant feedback on fundamentals.",
        },
      ],
      keyConcepts: ["Place value", "Fractions", "Percentages"],
      whyItMatters: "Every advanced topic rests on comfortable arithmetic.",
      practiceProblems: ["Convert 3/8 to a decimal", "Find 15% of 240"],
      difficulty: "beginner",
      quiz: [
        {
          id: "m1_q1",
          question: "What is 3/4 as a decimal?",
          options: ["0.25", "0.5", "0.75", "1.25"],
          correctIndex: 2,
          explanation: "3 divided by 4 equals 0.75.",
        },
      ],
      workedExamples: [
        {
          problem: "Find 20% of 150",
          solution: "30",
          explanation: "20% = 0.20, and 0.20 × 150 = 30.",
        },
      ],
    },
  ],
};

export const subjects: Subject[] = [mathSubject];

export function getSubject(id: string): Subject | undefined {
  return subjects.find((s) => s.id === id);
}
