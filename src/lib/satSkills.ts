/**
 * Canonical SAT skill taxonomy (B-phase content matching).
 *
 * One shared vocabulary for: the curriculum nodes (sat-prep.json), the mistake
 * log, the pretest, and the adaptive selectors (Daily 5, micro-drills). Aligns to
 * College Board Digital SAT domains. Skill labels reuse the pretest's strings so
 * pretest-derived categories line up for free.
 */

export type SatSection = "math" | "rw" | "general";

export interface SatSkillMeta {
  label: string;
  section: SatSection;
  domain: string;
}

export const SAT_SKILLS = {
  // ----- Math -----
  "linear-equations": { label: "Linear equations", section: "math", domain: "Algebra" },
  "systems-of-equations": { label: "Systems of equations", section: "math", domain: "Algebra" },
  "inequalities": { label: "Inequalities & absolute value", section: "math", domain: "Algebra" },
  "quadratics": { label: "Quadratics & factoring", section: "math", domain: "Advanced Math" },
  "functions-graphs": { label: "Functions & graphs", section: "math", domain: "Advanced Math" },
  "exponents-radicals": {
    label: "Exponents, radicals & polynomials",
    section: "math",
    domain: "Advanced Math",
  },
  "ratios-percentages": {
    label: "Ratios, percentages & proportions",
    section: "math",
    domain: "Problem Solving and Data Analysis",
  },
  "statistics-data": {
    label: "Statistics & data analysis",
    section: "math",
    domain: "Problem Solving and Data Analysis",
  },
  "word-problems": {
    label: "Multi-step word problems",
    section: "math",
    domain: "Problem Solving and Data Analysis",
  },
  "geometry-trig": {
    label: "Geometry & trigonometry",
    section: "math",
    domain: "Geometry and Trigonometry",
  },
  "coordinate-geometry": {
    label: "Coordinate geometry",
    section: "math",
    domain: "Geometry and Trigonometry",
  },
  "math-mixed": { label: "Math — mixed / strategy", section: "math", domain: "Mixed" },
  // ----- Reading & Writing -----
  "sentence-boundaries": {
    label: "Sentence boundaries & punctuation",
    section: "rw",
    domain: "Standard English Conventions",
  },
  "grammar-conventions": {
    label: "Grammar & conventions",
    section: "rw",
    domain: "Standard English Conventions",
  },
  "words-in-context": {
    label: "Words in context",
    section: "rw",
    domain: "Craft and Structure",
  },
  "text-structure": {
    label: "Text structure & purpose",
    section: "rw",
    domain: "Craft and Structure",
  },
  "cross-text-connections": {
    label: "Cross-text connections",
    section: "rw",
    domain: "Craft and Structure",
  },
  "central-ideas": {
    label: "Central ideas & details",
    section: "rw",
    domain: "Information and Ideas",
  },
  "command-of-evidence": {
    label: "Command of evidence",
    section: "rw",
    domain: "Information and Ideas",
  },
  "inference": { label: "Inference", section: "rw", domain: "Information and Ideas" },
  "transitions": { label: "Transitions", section: "rw", domain: "Expression of Ideas" },
  "rhetorical-synthesis": {
    label: "Rhetorical synthesis",
    section: "rw",
    domain: "Expression of Ideas",
  },
  "rw-mixed": { label: "Reading & Writing — mixed / strategy", section: "rw", domain: "Mixed" },
  // ----- General -----
  "test-strategy": { label: "Test strategy & pacing", section: "general", domain: "Test Strategy" },
} as const satisfies Record<string, SatSkillMeta>;

export type SatSkillId = keyof typeof SAT_SKILLS;

/** Maps each sat-prep node (st1..st80) to its primary skill. Questions inherit their node's skill. */
export const SAT_NODE_SKILLS: Record<string, SatSkillId> = {
  st1: "test-strategy",
  st2: "test-strategy",
  st3: "math-mixed",
  st4: "linear-equations",
  st5: "ratios-percentages",
  st6: "quadratics",
  st7: "math-mixed",
  st8: "math-mixed",
  st9: "rw-mixed",
  st10: "grammar-conventions",
  st11: "words-in-context",
  st12: "central-ideas",
  st13: "rw-mixed",
  st14: "rw-mixed",
  st15: "test-strategy",
  st16: "ratios-percentages",
  st17: "linear-equations",
  st18: "systems-of-equations",
  st19: "ratios-percentages",
  st20: "quadratics",
  st21: "functions-graphs",
  st22: "math-mixed",
  st23: "geometry-trig",
  st24: "math-mixed",
  st25: "math-mixed",
  st26: "grammar-conventions",
  st27: "sentence-boundaries",
  st28: "grammar-conventions",
  st29: "words-in-context",
  st30: "central-ideas",
  st31: "command-of-evidence",
  st32: "inference",
  st33: "rhetorical-synthesis",
  st34: "rw-mixed",
  st35: "rw-mixed",
  st36: "inequalities",
  st37: "exponents-radicals",
  st38: "functions-graphs",
  st39: "statistics-data",
  st40: "coordinate-geometry",
  st41: "grammar-conventions",
  st42: "grammar-conventions",
  st43: "cross-text-connections",
  st44: "text-structure",
  st45: "command-of-evidence",
  st46: "geometry-trig",
  st47: "functions-graphs",
  st48: "word-problems",
  st49: "math-mixed",
  st50: "math-mixed",
  st51: "rhetorical-synthesis",
  st52: "text-structure",
  st53: "grammar-conventions",
  st54: "rw-mixed",
  st55: "rw-mixed",
  st56: "linear-equations",
  st57: "functions-graphs",
  st58: "statistics-data",
  st59: "command-of-evidence",
  st60: "sentence-boundaries",
  st61: "quadratics",
  st62: "exponents-radicals",
  st63: "statistics-data",
  st64: "math-mixed",
  st65: "math-mixed",
  st66: "exponents-radicals",
  st67: "inference",
  st68: "coordinate-geometry",
  st69: "rw-mixed",
  st70: "rw-mixed",
  st71: "geometry-trig",
  st72: "cross-text-connections",
  st73: "geometry-trig",
  st74: "test-strategy",
  st75: "test-strategy",
  st76: "linear-equations",
  st77: "ratios-percentages",
  st78: "sentence-boundaries",
  st79: "transitions",
  st80: "quadratics",
};

export function getNodeSkillId(nodeId: string | undefined | null): SatSkillId | null {
  if (!nodeId) return null;
  return SAT_NODE_SKILLS[nodeId] ?? null;
}

export function getSkillMeta(skillId: SatSkillId): SatSkillMeta {
  return SAT_SKILLS[skillId];
}

export function isSatSkillId(value: string): value is SatSkillId {
  return Object.prototype.hasOwnProperty.call(SAT_SKILLS, value);
}

/** Content skills a learner would log as a weakness for a section (excludes mixed/strategy buckets). */
export function getPicklistSkills(
  section: Exclude<SatSection, "general">,
): Array<{ id: SatSkillId; label: string; domain: string }> {
  return (Object.keys(SAT_SKILLS) as SatSkillId[])
    .filter((id) => {
      const meta = SAT_SKILLS[id];
      return meta.section === section && meta.domain !== "Mixed";
    })
    .map((id) => ({ id, label: SAT_SKILLS[id].label, domain: SAT_SKILLS[id].domain }));
}

/**
 * Resolve a free-text mistake category (legacy logs, pretest skill strings, or
 * whatever the user typed) to a canonical skill id. Best-effort substring match.
 */
// Patterns use stems (so plurals like "commas"/"triangles" match) while keeping
// word boundaries on short ambiguous words ("mean", "data") to avoid false hits
// (e.g. "command of evidence" must NOT match the "comma" rule).
const SKILL_ALIASES: Array<[RegExp, SatSkillId]> = [
  [/\b(systems?|simultaneous)\b/i, "systems-of-equations"],
  [/(inequalit|absolute value)/i, "inequalities"],
  [/\b(linear|slope|rate of change)\b/i, "linear-equations"],
  [/(quadratic|factor|parabola|vertex)/i, "quadratics"],
  [/(exponent|radical|polynomial|exponential|rational expression)/i, "exponents-radicals"],
  [/(function|composition)/i, "functions-graphs"],
  [/(percent|proportion|ratio|fraction)/i, "ratios-percentages"],
  [/\b(statistics?|scatterplots?|mean|median|mode|two-way|data)\b/i, "statistics-data"],
  [/(word problem|multi-?step)/i, "word-problems"],
  [/(triangle|geometry|trig|volume|surface area|circle|angle)/i, "geometry-trig"],
  [/(coordinate|distance formula|midpoint)/i, "coordinate-geometry"],
  [
    /\b(commas?|comma splice|run-?ons?|boundary|boundaries|semicolons?|punctuation|colons?)\b/i,
    "sentence-boundaries",
  ],
  [
    /(subject-?verb|pronoun|modifier|verb tense|parallel|apostrophe|possessive|grammar|convention|agreement)/i,
    "grammar-conventions",
  ],
  [/(words in context|vocab|word meaning|word choice)/i, "words-in-context"],
  [/(text structure|tone|style|organization|purpose)/i, "text-structure"],
  [/(cross-?text|paired passage)/i, "cross-text-connections"],
  [/(central idea|main idea|central claim|summary)/i, "central-ideas"],
  [/(command of evidence|evidence|quantitative)/i, "command-of-evidence"],
  [/(inference|infer|conclusion|implication)/i, "inference"],
  [/(transitions?|connector)/i, "transitions"],
  [/(rhetorical|synthesis|conciseness|redundancy)/i, "rhetorical-synthesis"],
];

export function resolveSkillId(text: string | undefined | null): SatSkillId | null {
  if (!text) return null;
  const trimmed = text.trim();
  if (!trimmed) return null;
  if (isSatSkillId(trimmed)) return trimmed;
  for (const [pattern, id] of SKILL_ALIASES) {
    if (pattern.test(trimmed)) return id;
  }
  return null;
}
