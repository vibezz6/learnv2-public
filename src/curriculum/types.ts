export interface Resource {
  title: string;
  url: string;
  type: "video" | "article" | "course" | "practice" | "book";
  whyHelpful?: string;
}

export interface QuizQuestion {
  question: string;
  id: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty?: "easy" | "medium" | "hard";
  image?: string;
  /** Only multiple-choice is implemented; the field is kept for forward-compat. */
  type?: "multiple-choice";
}

export interface SkillNode {
  id: string;
  name: string;
  description: string;
  xpValue: number;
  parentIds: string[];
  estimatedMinutes: number;
  resources: Resource[];
  keyConcepts: string[];
  whyItMatters: string;
  practiceProblems: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  quiz?: QuizQuestion[];
  workedExamples?: { problem: string; solution: string; explanation: string }[];
  commonMistakes?: string[];
}

export interface Subject {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  nodes: SkillNode[];
}

export interface NoteReview {
  score: number;
  strengths: string[];
  gaps: string[];
  suggestions: string[];
  deeperQuestions: string[];
  generatedAt: number;
  completedAt: number | null;
}

export interface MentorMessage {
  question: string;
  answer: string;
  feedback: string;
  quality: "too-short" | "good-start" | "solid" | "excellent";
}

export interface MentorSession {
  questions: string[];
  messages: MentorMessage[];
  startedAt: number;
  completedAt: number | null;
}

export interface NoteSession {
  nodeId: string;
  subjectId: string;
  responses: Record<string, string>;
  review: NoteReview | null;
  mentorSession: MentorSession | null;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}
