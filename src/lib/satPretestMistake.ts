import type { AddMistakeInput } from "@/lib/satMistakeLog";
import type { SatPretestAttempt, SatPretestQuestion, SatPretestResponse } from "@/lib/satPretest";

export interface SatPretestMissedItem {
  question: SatPretestQuestion;
  response: SatPretestResponse;
}

export function listMissedPretestItems(
  attempt: SatPretestAttempt,
  questions: SatPretestQuestion[],
): SatPretestMissedItem[] {
  if (attempt.status !== "completed") return [];

  const byId = new Map(questions.map((question) => [question.id, question]));
  const missed: SatPretestMissedItem[] = [];

  for (const questionId of attempt.questionOrder) {
    const question = byId.get(questionId);
    const response = attempt.responses[questionId];
    if (!question || !response) continue;
    if (response.selectedChoiceId === question.correctChoiceId) continue;
    missed.push({ question, response });
  }

  return missed;
}

export function buildMistakeDraftFromResponse(
  question: SatPretestQuestion,
  response: SatPretestResponse,
): AddMistakeInput {
  const rationale = response.rationale.trim();
  const rationaleSnippet =
    rationale.length > 200 ? `${rationale.slice(0, 200)}…` : rationale;

  return {
    section: question.section,
    category: question.skill,
    nodeId: question.relatedNodeIds?.[0],
    note: `Diagnostic miss (${question.domain}): chose ${response.selectedChoiceId}, correct ${question.correctChoiceId}. My reasoning: ${rationaleSnippet}`,
  };
}
