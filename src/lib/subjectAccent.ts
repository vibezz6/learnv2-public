/**
 * Cohesive, cool-slate-friendly accent per subject. The curriculum JSON still
 * ships its original (often warm) colors; this override keeps every subject dot
 * and left-border in the same indigo/teal/violet family as the IDE shell so
 * nothing clashes with the accent. Falls back to the global accent token.
 */
const SUBJECT_ACCENTS: Record<string, string> = {
  "sat-prep": "#7a93f4", // indigo — the daily driver, matches the UI accent
  math: "#9b8cf5", // violet
  science: "#4cb89a", // teal-green (deepened so it reads on light too)
  cs: "#6aa6f2", // blue
  programming: "#3bb8b3", // teal (deepened)
  probability: "#b98cf0", // lilac
  ai: "#7e9bf0", // periwinkle
  finance: "#52b08a", // emerald
  engineering: "#8497ad", // slate (slightly deeper)
};

export function getSubjectAccent(subjectId: string | undefined | null): string {
  if (subjectId && SUBJECT_ACCENTS[subjectId]) return SUBJECT_ACCENTS[subjectId];
  return "var(--accent)";
}
