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
    id: "sat-august",
    name: "August SAT Track",
    description:
      "Roadmap to the Digital SAT — daily rhythm, Math and Reading & Writing skill trees, timed Bluebook practice, and test week.",
    color: "#d97757",
    icon: "graduation-cap",
    lessons: [
      lesson("sat-prep", "st1"),
      lesson("sat-prep", "st2"),
      lesson("sat-prep", "st3"),
      lesson("sat-prep", "st4"),
      lesson("sat-prep", "st5"),
      lesson("sat-prep", "st6"),
      lesson("sat-prep", "st7"),
      lesson("sat-prep", "st8"),
      lesson("sat-prep", "st9"),
      lesson("sat-prep", "st10"),
      lesson("sat-prep", "st11"),
      lesson("sat-prep", "st12"),
      lesson("sat-prep", "st13"),
      lesson("sat-prep", "st14"),
      lesson("sat-prep", "st15"),
      lesson("sat-prep", "st16"),
      lesson("sat-prep", "st17"),
      lesson("sat-prep", "st18"),
      lesson("sat-prep", "st19"),
      lesson("sat-prep", "st20"),
      lesson("sat-prep", "st21"),
      lesson("sat-prep", "st22"),
      lesson("sat-prep", "st23"),
      lesson("sat-prep", "st24"),
      lesson("sat-prep", "st25"),
      lesson("sat-prep", "st26"),
      lesson("sat-prep", "st27"),
      lesson("sat-prep", "st28"),
      lesson("sat-prep", "st29"),
      lesson("sat-prep", "st30"),
      lesson("sat-prep", "st31"),
      lesson("sat-prep", "st32"),
      lesson("sat-prep", "st33"),
      lesson("sat-prep", "st34"),
      lesson("sat-prep", "st35"),
      lesson("sat-prep", "st36"),
      lesson("sat-prep", "st37"),
      lesson("sat-prep", "st38"),
      lesson("sat-prep", "st39"),
      lesson("sat-prep", "st40"),
      lesson("sat-prep", "st41"),
      lesson("sat-prep", "st42"),
      lesson("sat-prep", "st43"),
      lesson("sat-prep", "st44"),
      lesson("sat-prep", "st45"),
    ],
  },
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
