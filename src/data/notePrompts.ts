// Notes 2.0 — Subject-specific guided prompts
// Each prompt set has 6-8 questions tailored to the subject domain

export interface PromptSet {
  subjectId: string;
  prompts: { key: string; label: string; placeholder: string }[];
}

export const SUBJECT_PROMPTS: PromptSet[] = [
  {
    subjectId: "sat-prep",
    prompts: [
      { key: "plan", label: "This Week's Plan", placeholder: "What will you study Mon–Sun? Math vs R&W slots…" },
      { key: "miss", label: "Mistake Log", placeholder: "Topic | what went wrong | how you'll fix it…" },
      { key: "timed", label: "Timed Practice", placeholder: "What timed section did you take? Score/time notes…" },
      { key: "weak", label: "Weakest Topic", placeholder: "What still confuses you? Be specific…" },
      { key: "win", label: "Small Win", placeholder: "What improved since last week, even a little?" },
      { key: "why", label: "Why This Matters", placeholder: "Why does this topic matter for your score and college goal?" },
    ],
  },
  {
    subjectId: "math",
    prompts: [
      { key: "core-idea", label: "Core Idea", placeholder: "What is the main concept or theorem in this lesson? Explain it in your own words..." },
      { key: "formula-intuition", label: "Formula Intuition", placeholder: "What formula did you learn? What does each part mean? Why does it work?" },
      { key: "worked-example", label: "Worked Example", placeholder: "Walk through a problem step by step. What's the strategy?" },
      { key: "connections", label: "Connections", placeholder: "How does this connect to something you already learned?" },
      { key: "common-mistakes", label: "Common Mistakes", placeholder: "What mistakes could someone make with this? How do you avoid them?" },
      { key: "teach-it", label: "Teach It", placeholder: "Explain this concept to a friend who's never seen it before..." },
    ],
  },
  {
    subjectId: "science",
    prompts: [
      { key: "phenomenon", label: "The Phenomenon", placeholder: "What natural phenomenon does this lesson explain?" },
      { key: "evidence", label: "Evidence", placeholder: "What evidence supports the theory or model presented?" },
      { key: "real-world", label: "Real World", placeholder: "Where do you see this in everyday life or technology?" },
      { key: "cross-discipline", label: "Cross-Discipline", placeholder: "How does this connect to math, engineering, or other sciences?" },
      { key: "unclear", label: "Still Unclear", placeholder: "What part of this lesson is still confusing to you?" },
      { key: "implications", label: "Implications", placeholder: "What are the broader implications of this discovery or concept?" },
    ],
  },
  {
    subjectId: "cs",
    prompts: [
      { key: "concept", label: "The Concept", placeholder: "What CS concept did you learn? Define it in your own words..." },
      { key: "code-walkthrough", label: "Code Walkthrough", placeholder: "Walk through the key code or algorithm step by step..." },
      { key: "why-this-approach", label: "Why This Approach?", placeholder: "Why is this the right approach? What alternatives exist?" },
      { key: "connections", label: "Connections", placeholder: "How does this relate to other data structures or algorithms?" },
      { key: "debug", label: "Debug Scenario", placeholder: "What's a common bug or mistake with this? How would you debug it?" },
      { key: "explain-beginner", label: "Explain to a Beginner", placeholder: "How would you explain this to someone just starting CS?" },
    ],
  },
  {
    subjectId: "ai",
    prompts: [
      { key: "concept", label: "The Concept", placeholder: "What AI/ML concept did you learn? Explain it simply..." },
      { key: "intuition", label: "Intuition", placeholder: "What's the intuition behind how this works? Use an analogy..." },
      { key: "limitations", label: "Limitations", placeholder: "What are the limitations or failure modes of this approach?" },
      { key: "broader-context", label: "Broader Context", placeholder: "Where does this fit in the larger AI landscape?" },
      { key: "hands-on", label: "Hands-On", placeholder: "If you were to implement this, what would you do first?" },
      { key: "ethical", label: "Ethical Considerations", placeholder: "What ethical questions does this raise?" },
    ],
  },
  {
    subjectId: "finance",
    prompts: [
      { key: "concept", label: "The Concept", placeholder: "What financial concept did you learn? Define it clearly..." },
      { key: "run-numbers", label: "Run the Numbers", placeholder: "Work through a numerical example. What's the formula?" },
      { key: "risk", label: "Risk", placeholder: "What are the risks involved? How do you manage them?" },
      { key: "market-context", label: "Market Context", placeholder: "How does this play out in real markets?" },
      { key: "personal", label: "Personal Relevance", placeholder: "How does this apply to your own financial thinking?" },
      { key: "unclear", label: "Still Unclear", placeholder: "What's still confusing about this topic?" },
    ],
  },
  {
    subjectId: "programming",
    prompts: [
      { key: "concept", label: "The Concept", placeholder: "What programming concept did you learn? Explain it..." },
      { key: "code-from-memory", label: "Code from Memory", placeholder: "Write the key code snippet from memory. What does each part do?" },
      { key: "debug", label: "Debug It", placeholder: "What's a common bug with this? How would you find and fix it?" },
      { key: "connections", label: "Connections", placeholder: "How does this relate to other programming concepts you know?" },
      { key: "fuzzy", label: "Still Fuzzy", placeholder: "What part of this is still unclear to you?" },
      { key: "project-idea", label: "Project Idea", placeholder: "How could you use this in a real project?" },
    ],
  },
  {
    subjectId: "probability",
    prompts: [
      { key: "concept", label: "The Concept", placeholder: "What probability concept did you learn? Define it..." },
      { key: "intuition", label: "Intuition", placeholder: "What's the intuition behind this? Use a real-world example..." },
      { key: "calculation", label: "Calculation Walkthrough", placeholder: "Work through a calculation step by step..." },
      { key: "misconception", label: "Common Misconception", placeholder: "What's a common mistake people make with this?" },
      { key: "where-else", label: "Where Else?", placeholder: "Where else does this concept appear — in science, finance, or daily life?" },
      { key: "explain", label: "Explain It", placeholder: "Explain this concept to someone who's never studied probability..." },
    ],
  },
];

export function getPromptsForSubject(subjectId: string): PromptSet["prompts"] {
  const set = SUBJECT_PROMPTS.find(p => p.subjectId === subjectId);
  return set?.prompts || SUBJECT_PROMPTS[0].prompts; // fallback to math
}

export function hasNotesForSubject(subjectId: string): boolean {
  return SUBJECT_PROMPTS.some((set) => set.subjectId === subjectId);
}
