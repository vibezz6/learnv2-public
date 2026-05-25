import type { Subject } from "@/curriculum/types";

/** Subject accent for lesson/quiz/review chrome; falls back to app accent. */
export function getSubjectAccent(subject: Subject | null | undefined): string {
  const color = subject?.color?.trim();
  return color && color.length > 0 ? color : "var(--accent)";
}
