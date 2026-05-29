/**
 * Cohesive, cool-slate-friendly accent per subject. The curriculum JSON still
 * ships its original (often warm) colors; this override keeps every subject dot
 * and left-border in the same indigo/teal/violet family as the IDE shell so
 * nothing clashes with the accent. Falls back to the global accent token.
 */
const SUBJECT_ACCENTS: Record<string, string> = {
  "sat-prep": "#7a93f4", // indigo — the daily driver, matches the UI accent
  math: "#9b8cf5", // violet
  science: "#56c2a6", // teal-green
  cs: "#6aa6f2", // blue
  programming: "#46c5c0", // teal
  probability: "#b98cf0", // lilac
  ai: "#7e9bf0", // periwinkle
  finance: "#5bb892", // emerald
  trading: "#5fb3e6", // sky
  engineering: "#90a2bd", // slate
  "algo-lab": "#6cccb8", // aqua
};

export function getSubjectAccent(subjectId: string | undefined | null): string {
  if (subjectId && SUBJECT_ACCENTS[subjectId]) return SUBJECT_ACCENTS[subjectId];
  return "var(--accent)";
}
