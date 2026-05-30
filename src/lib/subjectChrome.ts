import type { Subject } from "@/curriculum/types";
import { getSubjectAccent as accentForId } from "@/lib/subjectAccent";

/**
 * Subject accent for lesson/quiz/review chrome. Routes through the cohesive
 * cool-slate palette (keyed by subject id) so it matches the rest of the shell
 * rather than the curriculum JSON's original warm colors.
 */
export function getSubjectAccent(subject: Subject | null | undefined): string {
  return accentForId(subject?.id);
}
