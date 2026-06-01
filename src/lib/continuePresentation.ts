import { findLatestInProgressQuizNodeId } from "@/features/quiz/quizProgress";
import { canAccessReview, getSession } from "@/stores/noteSessions";

export type ContinueKind = "lesson" | "notes" | "quiz";

export const CONTINUE_KIND_LABELS: Record<ContinueKind, string> = {
  lesson: "Lesson",
  notes: "Office hours",
  quiz: "Quiz in progress",
};

export function resolveContinueKind(nodeId: string): ContinueKind {
  if (findLatestInProgressQuizNodeId() === nodeId) return "quiz";
  const session = getSession(nodeId);
  if (session && canAccessReview(session) && !session.review?.completedAt) {
    return "notes";
  }
  return "lesson";
}

export function continueHref(
  subjectId: string,
  nodeId: string,
  kind: ContinueKind,
): string {
  if (kind === "quiz") return `/subjects/${subjectId}/${nodeId}/quiz`;
  if (kind === "notes") return `/subjects/${subjectId}/${nodeId}/notes`;
  return `/subjects/${subjectId}/${nodeId}`;
}
