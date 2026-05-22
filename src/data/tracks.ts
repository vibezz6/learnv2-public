export interface TrackLesson {
  subjectId: string;
  nodeId: string;
}

export interface LearningTrack {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  lessons: TrackLesson[];
}

function lesson(subjectId: string, nodeId: string): TrackLesson {
  return { subjectId, nodeId };
}

export const tracks: LearningTrack[] = [
  {
    id: "trader",
    name: "The Trader Track",
    description:
      "Mathematical and statistical foundation for serious trading — algebra through probability to risk management.",
    color: "#f59e0b",
    icon: "trending-up",
    lessons: [
      lesson("math", "m1"),
      lesson("math", "m2"),
      lesson("math", "m3"),
      lesson("probability", "pr1"),
      lesson("probability", "pr2"),
      lesson("probability", "pr4"),
      lesson("trading", "t1"),
      lesson("trading", "t2"),
      lesson("trading", "t3"),
      lesson("trading", "t4"),
      lesson("trading", "t5"),
      lesson("probability", "pr10"),
      lesson("trading", "t11"),
      lesson("trading", "t12"),
    ],
  },
  {
    id: "developer",
    name: "The Developer Track",
    description: "From zero to building real software — Python, data structures, web dev, system design.",
    color: "#3b82f6",
    icon: "code",
    lessons: [
      lesson("cs", "c1"),
      lesson("cs", "c2"),
      lesson("cs", "c3"),
      lesson("cs", "c4"),
      lesson("cs", "c5"),
      lesson("cs", "c6"),
      lesson("cs", "c7"),
      lesson("cs", "c8"),
      lesson("cs", "c10"),
      lesson("cs", "c11"),
      lesson("cs", "c12"),
      lesson("cs", "c13"),
      lesson("cs", "c14"),
    ],
  },
  {
    id: "wealth",
    name: "The Wealth Track",
    description: "Master your money — budgeting, credit, investing, taxes, financial independence.",
    color: "#14b8a6",
    icon: "wallet",
    lessons: [
      lesson("finance", "f1"),
      lesson("finance", "f2"),
      lesson("finance", "f6"),
      lesson("finance", "f3"),
      lesson("finance", "f4"),
      lesson("finance", "f5"),
      lesson("finance", "f7"),
      lesson("finance", "f8"),
    ],
  },
  {
    id: "foundation",
    name: "Complete Foundation",
    description: "Core curriculum — math, CS, and probability, the pillars of quantitative thinking.",
    color: "#8b5cf6",
    icon: "function",
    lessons: [
      lesson("math", "m1"),
      lesson("math", "m2"),
      lesson("math", "m3"),
      lesson("math", "m4"),
      lesson("math", "m5"),
      lesson("cs", "c1"),
      lesson("cs", "c2"),
      lesson("cs", "c3"),
      lesson("probability", "pr1"),
      lesson("probability", "pr2"),
      lesson("probability", "pr3"),
      lesson("probability", "pr4"),
      lesson("math", "m6"),
      lesson("math", "m7"),
      lesson("cs", "c5"),
      lesson("cs", "c6"),
    ],
  },
];
