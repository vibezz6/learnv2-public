export const SAT_PRETEST_STORAGE_KEY = "learnv2_sat_pretest_v1";
export const SAT_PRETEST_SCHEMA_VERSION = 1;

export type SatPretestSection = "math" | "rw";
export type SatPretestDifficulty = "easy" | "medium" | "hard";
export type SatPretestAttemptStatus = "in_progress" | "completed";

export interface SatPretestChoice {
  id: string;
  text: string;
}

export interface SatPretestQuestion {
  id: string;
  draftId: string;
  section: SatPretestSection;
  domain: string;
  skill: string;
  difficulty: SatPretestDifficulty;
  prompt: string;
  choices: SatPretestChoice[];
  correctChoiceId: string;
  explanation: string;
  source?: string;
  relatedNodeIds?: string[];
}

export interface SatPretestResponse {
  questionId: string;
  selectedChoiceId: string;
  rationale: string;
  answeredAt: string;
  timeSpentSeconds: number;
  confidence?: "low" | "medium" | "high";
  flagged?: boolean;
}

export interface SatPretestBreakdown {
  key: string;
  label: string;
  correct: number;
  total: number;
  pct: number;
}

export interface SatPretestScoreSummary {
  totalQuestions: number;
  correctAnswers: number;
  pct: number;
  sectionBreakdown: SatPretestBreakdown[];
  skillBreakdown: SatPretestBreakdown[];
  weakSkills: SatPretestBreakdown[];
  recommendedNodeIds: string[];
  timeSpentSeconds: number;
}

export interface SatPretestAttempt {
  id: string;
  draftId: string;
  status: SatPretestAttemptStatus;
  startedAt: string;
  completedAt?: string;
  questionOrder: string[];
  currentIndex: number;
  responses: Record<string, SatPretestResponse>;
  scoreSummary?: SatPretestScoreSummary;
}

export interface SatPretestState {
  schemaVersion: 1;
  attempts: SatPretestAttempt[];
}

export interface RecordSatPretestResponseInput {
  attemptId: string;
  questionId: string;
  selectedChoiceId: string;
  rationale: string;
  timeSpentSeconds: number;
  confidence?: SatPretestResponse["confidence"];
  flagged?: boolean;
}

function emptyState(): SatPretestState {
  return { schemaVersion: SAT_PRETEST_SCHEMA_VERSION, attempts: [] };
}

function nowIso(): string {
  return new Date().toISOString();
}

function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function isValidResponse(value: unknown): value is SatPretestResponse {
  if (!value || typeof value !== "object") return false;
  const response = value as Partial<SatPretestResponse>;
  return (
    typeof response.questionId === "string" &&
    typeof response.selectedChoiceId === "string" &&
    typeof response.rationale === "string" &&
    typeof response.answeredAt === "string" &&
    typeof response.timeSpentSeconds === "number" &&
    response.timeSpentSeconds >= 0 &&
    (response.confidence === undefined ||
      response.confidence === "low" ||
      response.confidence === "medium" ||
      response.confidence === "high") &&
    (response.flagged === undefined || typeof response.flagged === "boolean")
  );
}

function isValidBreakdown(value: unknown): value is SatPretestBreakdown {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<SatPretestBreakdown>;
  return (
    typeof item.key === "string" &&
    typeof item.label === "string" &&
    typeof item.correct === "number" &&
    typeof item.total === "number" &&
    typeof item.pct === "number"
  );
}

function isValidScoreSummary(value: unknown): value is SatPretestScoreSummary {
  if (!value || typeof value !== "object") return false;
  const summary = value as Partial<SatPretestScoreSummary>;
  return (
    typeof summary.totalQuestions === "number" &&
    typeof summary.correctAnswers === "number" &&
    typeof summary.pct === "number" &&
    Array.isArray(summary.sectionBreakdown) &&
    summary.sectionBreakdown.every(isValidBreakdown) &&
    Array.isArray(summary.skillBreakdown) &&
    summary.skillBreakdown.every(isValidBreakdown) &&
    Array.isArray(summary.weakSkills) &&
    summary.weakSkills.every(isValidBreakdown) &&
    Array.isArray(summary.recommendedNodeIds) &&
    summary.recommendedNodeIds.every((id) => typeof id === "string") &&
    typeof summary.timeSpentSeconds === "number"
  );
}

function isValidAttempt(value: unknown): value is SatPretestAttempt {
  if (!value || typeof value !== "object") return false;
  const attempt = value as Partial<SatPretestAttempt>;
  const responses = attempt.responses;
  return (
    typeof attempt.id === "string" &&
    typeof attempt.draftId === "string" &&
    (attempt.status === "in_progress" || attempt.status === "completed") &&
    typeof attempt.startedAt === "string" &&
    (attempt.completedAt === undefined || typeof attempt.completedAt === "string") &&
    Array.isArray(attempt.questionOrder) &&
    attempt.questionOrder.every((id) => typeof id === "string") &&
    typeof attempt.currentIndex === "number" &&
    attempt.currentIndex >= 0 &&
    attempt.currentIndex < Math.max(1, attempt.questionOrder.length) &&
    !!responses &&
    typeof responses === "object" &&
    Object.values(responses).every(isValidResponse) &&
    (attempt.scoreSummary === undefined || isValidScoreSummary(attempt.scoreSummary))
  );
}

function loadRaw(storage: Storage = localStorage): SatPretestState {
  try {
    const raw = storage.getItem(SAT_PRETEST_STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<SatPretestState>;
    if (parsed.schemaVersion !== SAT_PRETEST_SCHEMA_VERSION || !Array.isArray(parsed.attempts)) {
      return emptyState();
    }
    return {
      schemaVersion: SAT_PRETEST_SCHEMA_VERSION,
      attempts: parsed.attempts.filter(isValidAttempt),
    };
  } catch {
    return emptyState();
  }
}

function saveRaw(state: SatPretestState, storage: Storage = localStorage): void {
  try {
    storage.setItem(SAT_PRETEST_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable — fail silently.
  }
}

function pct(correct: number, total: number): number {
  return total > 0 ? Math.round((correct / total) * 100) : 0;
}

function toBreakdowns(
  groups: Map<string, { label: string; correct: number; total: number }>,
): SatPretestBreakdown[] {
  return [...groups.entries()]
    .map(([key, value]) => ({
      key,
      label: value.label,
      correct: value.correct,
      total: value.total,
      pct: pct(value.correct, value.total),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

export function loadSatPretestState(storage: Storage = localStorage): SatPretestState {
  return loadRaw(storage);
}

export function listSatPretestAttempts(storage: Storage = localStorage): SatPretestAttempt[] {
  return loadRaw(storage).attempts.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

export function getActiveSatPretestAttempt(
  draftId: string,
  storage: Storage = localStorage,
): SatPretestAttempt | null {
  return (
    listSatPretestAttempts(storage).find(
      (attempt) => attempt.draftId === draftId && attempt.status === "in_progress",
    ) ?? null
  );
}

export function getLatestCompletedSatPretestAttempt(
  draftId: string,
  storage: Storage = localStorage,
): SatPretestAttempt | null {
  return (
    listSatPretestAttempts(storage).find(
      (attempt) => attempt.draftId === draftId && attempt.status === "completed",
    ) ?? null
  );
}

export function startSatPretestAttempt(
  draftId: string,
  questions: SatPretestQuestion[],
  storage: Storage = localStorage,
): SatPretestAttempt | null {
  const questionOrder = questions.map((question) => question.id);
  if (!draftId.trim() || questionOrder.length === 0) return null;

  const state = loadRaw(storage);
  const attempt: SatPretestAttempt = {
    id: generateId(),
    draftId: draftId.trim(),
    status: "in_progress",
    startedAt: nowIso(),
    questionOrder,
    currentIndex: 0,
    responses: {},
  };

  state.attempts.unshift(attempt);
  saveRaw(state, storage);
  return attempt;
}

export function recordSatPretestResponse(
  input: RecordSatPretestResponseInput,
  questions: SatPretestQuestion[],
  storage: Storage = localStorage,
): SatPretestAttempt | null {
  const rationale = input.rationale.trim();
  if (!rationale || input.timeSpentSeconds < 0) return null;

  const question = questions.find((candidate) => candidate.id === input.questionId);
  if (!question || !question.choices.some((choice) => choice.id === input.selectedChoiceId)) {
    return null;
  }

  const state = loadRaw(storage);
  const attempt = state.attempts.find((candidate) => candidate.id === input.attemptId);
  if (!attempt || attempt.status !== "in_progress" || !attempt.questionOrder.includes(question.id)) {
    return null;
  }

  attempt.responses[question.id] = {
    questionId: question.id,
    selectedChoiceId: input.selectedChoiceId,
    rationale,
    answeredAt: nowIso(),
    timeSpentSeconds: Math.round(input.timeSpentSeconds),
    confidence: input.confidence,
    flagged: input.flagged,
  };

  saveRaw(state, storage);
  return attempt;
}

export function advanceSatPretestAttempt(
  attemptId: string,
  storage: Storage = localStorage,
): SatPretestAttempt | null {
  const state = loadRaw(storage);
  const attempt = state.attempts.find((candidate) => candidate.id === attemptId);
  if (!attempt || attempt.status !== "in_progress") return null;

  attempt.currentIndex = Math.min(attempt.currentIndex + 1, attempt.questionOrder.length - 1);
  saveRaw(state, storage);
  return attempt;
}

export function buildSatPretestScoreSummary(
  attempt: SatPretestAttempt,
  questions: SatPretestQuestion[],
): SatPretestScoreSummary {
  const byId = new Map(questions.map((question) => [question.id, question]));
  const sections = new Map<string, { label: string; correct: number; total: number }>();
  const skills = new Map<string, { label: string; correct: number; total: number }>();
  const recommendedNodeIds: string[] = [];
  let correctAnswers = 0;
  let timeSpentSeconds = 0;

  for (const questionId of attempt.questionOrder) {
    const question = byId.get(questionId);
    const response = attempt.responses[questionId];
    if (!question || !response) continue;

    const isCorrect = response.selectedChoiceId === question.correctChoiceId;
    if (isCorrect) correctAnswers += 1;
    timeSpentSeconds += response.timeSpentSeconds;

    const section = sections.get(question.section) ?? {
      label: question.section === "math" ? "Math" : "Reading & Writing",
      correct: 0,
      total: 0,
    };
    section.correct += isCorrect ? 1 : 0;
    section.total += 1;
    sections.set(question.section, section);

    const skill = skills.get(question.skill) ?? {
      label: question.skill,
      correct: 0,
      total: 0,
    };
    skill.correct += isCorrect ? 1 : 0;
    skill.total += 1;
    skills.set(question.skill, skill);

    if (!isCorrect) {
      recommendedNodeIds.push(...(question.relatedNodeIds ?? []));
    }
  }

  const totalQuestions = attempt.questionOrder.length;
  const skillBreakdown = toBreakdowns(skills);
  const weakSkills = skillBreakdown
    .filter((skill) => skill.correct < skill.total)
    .sort((a, b) => a.pct - b.pct || b.total - a.total || a.label.localeCompare(b.label))
    .slice(0, 3);

  return {
    totalQuestions,
    correctAnswers,
    pct: pct(correctAnswers, totalQuestions),
    sectionBreakdown: toBreakdowns(sections),
    skillBreakdown,
    weakSkills,
    recommendedNodeIds: uniqueStrings(recommendedNodeIds),
    timeSpentSeconds,
  };
}

export function completeSatPretestAttempt(
  attemptId: string,
  questions: SatPretestQuestion[],
  storage: Storage = localStorage,
): SatPretestAttempt | null {
  const state = loadRaw(storage);
  const attempt = state.attempts.find((candidate) => candidate.id === attemptId);
  if (!attempt || attempt.status !== "in_progress") return null;

  const answeredAll = attempt.questionOrder.every((questionId) => !!attempt.responses[questionId]);
  if (!answeredAll) return null;

  attempt.status = "completed";
  attempt.completedAt = nowIso();
  attempt.scoreSummary = buildSatPretestScoreSummary(attempt, questions);
  saveRaw(state, storage);
  return attempt;
}

export function resetSatPretestDraft(draftId: string, storage: Storage = localStorage): void {
  const state = loadRaw(storage);
  state.attempts = state.attempts.filter((attempt) => attempt.draftId !== draftId);
  saveRaw(state, storage);
}

export const SAT_PRETEST_EXPORT_SCHEMA_VERSION = 1;

export interface SatPretestExportQuestionReview {
  questionId: string;
  section: SatPretestSection;
  domain: string;
  skill: string;
  prompt: string;
  selectedChoiceId: string;
  selectedChoiceText: string;
  correctChoiceId: string;
  isCorrect: boolean;
  rationale: string;
  timeSpentSeconds: number;
  rationaleConcern?: string;
}

export interface SatPretestExportPayload {
  schemaVersion: number;
  appVersion: string;
  exportedAt: string;
  draftId: string;
  attempt: SatPretestAttempt;
  questions: SatPretestQuestion[];
  responses: SatPretestResponse[];
  scoring: SatPretestScoreSummary | null;
  topicBreakdown: {
    sections: SatPretestBreakdown[];
    skills: SatPretestBreakdown[];
    weakSkills: SatPretestBreakdown[];
  };
  rationaleReviewPrompts: string[];
  recommendedNextSteps: string[];
}

function choiceText(question: SatPretestQuestion, choiceId: string): string {
  return question.choices.find((choice) => choice.id === choiceId)?.text ?? choiceId;
}

function buildQuestionReviews(
  attempt: SatPretestAttempt,
  questions: SatPretestQuestion[],
): SatPretestExportQuestionReview[] {
  const byId = new Map(questions.map((question) => [question.id, question]));
  const reviews: SatPretestExportQuestionReview[] = [];

  for (const questionId of attempt.questionOrder) {
    const question = byId.get(questionId);
    const response = attempt.responses[questionId];
    if (!question || !response) continue;

    const isCorrect = response.selectedChoiceId === question.correctChoiceId;
    let rationaleConcern: string | undefined;
    if (!isCorrect && response.rationale.length < 40) {
      rationaleConcern = "Short rationale on a miss — reasoning may be under-explained.";
    } else if (!isCorrect) {
      rationaleConcern = "Missed item — check whether the rationale matches the actual trap.";
    }

    reviews.push({
      questionId: question.id,
      section: question.section,
      domain: question.domain,
      skill: question.skill,
      prompt: question.prompt,
      selectedChoiceId: response.selectedChoiceId,
      selectedChoiceText: choiceText(question, response.selectedChoiceId),
      correctChoiceId: question.correctChoiceId,
      isCorrect,
      rationale: response.rationale,
      timeSpentSeconds: response.timeSpentSeconds,
      rationaleConcern: !isCorrect ? rationaleConcern : undefined,
    });
  }

  return reviews;
}

function buildRecommendedNextSteps(
  summary: SatPretestScoreSummary | null | undefined,
  reviews: SatPretestExportQuestionReview[],
): string[] {
  const steps: string[] = [];
  if (summary) {
    for (const skill of summary.weakSkills) {
      steps.push(`Retarget ${skill.label} (${skill.correct}/${skill.total} on Draft 1).`);
    }
    for (const nodeId of summary.recommendedNodeIds.slice(0, 5)) {
      steps.push(`Review SAT lesson ${nodeId} in Learn v2.`);
    }
  }
  const missedSkills = [...new Set(reviews.filter((r) => !r.isCorrect).map((r) => r.skill))];
  if (missedSkills.length > 0 && steps.length < 3) {
    steps.push(`Log misses for: ${missedSkills.join(", ")} in the SAT mistake log after Bluebook/Khan.`);
  }
  if (steps.length === 0) {
    steps.push("Draft 1 looked strong — schedule Draft 2 with harder items in weak skills only.");
  }
  return steps.slice(0, 6);
}

function buildRationaleReviewPrompts(reviews: SatPretestExportQuestionReview[]): string[] {
  return reviews
    .filter((review) => !review.isCorrect || review.rationaleConcern)
    .map((review) => {
      const status = review.isCorrect ? "correct" : "missed";
      return `${review.skill} (${status}): "${review.rationale.slice(0, 200)}${review.rationale.length > 200 ? "…" : ""}"`;
    })
    .slice(0, 8);
}

export function buildSatPretestExportPayload(
  attempt: SatPretestAttempt,
  questions: SatPretestQuestion[],
  appVersion: string,
): SatPretestExportPayload | null {
  if (attempt.status !== "completed" || !attempt.scoreSummary) return null;

  const questionIds = new Set(attempt.questionOrder);
  const exportQuestions = questions.filter((question) => questionIds.has(question.id));
  const reviews = buildQuestionReviews(attempt, questions);
  const responses = attempt.questionOrder
    .map((id) => attempt.responses[id])
    .filter((response): response is SatPretestResponse => !!response);

  return {
    schemaVersion: SAT_PRETEST_EXPORT_SCHEMA_VERSION,
    appVersion,
    exportedAt: new Date().toISOString(),
    draftId: attempt.draftId,
    attempt,
    questions: exportQuestions,
    responses,
    scoring: attempt.scoreSummary,
    topicBreakdown: {
      sections: attempt.scoreSummary.sectionBreakdown,
      skills: attempt.scoreSummary.skillBreakdown,
      weakSkills: attempt.scoreSummary.weakSkills,
    },
    rationaleReviewPrompts: buildRationaleReviewPrompts(reviews),
    recommendedNextSteps: buildRecommendedNextSteps(attempt.scoreSummary, reviews),
  };
}

export function formatSatPretestMarkdown(
  attempt: SatPretestAttempt,
  questions: SatPretestQuestion[],
  appVersion: string,
): string | null {
  const payload = buildSatPretestExportPayload(attempt, questions, appVersion);
  if (!payload || !payload.scoring) return null;

  const reviews = buildQuestionReviews(attempt, questions);
  const lines: string[] = [
    "# Learn v2 — SAT Pretest Draft 1 Export",
    "",
    "## Student context",
    "",
    "- Local diagnostic only — not an official SAT score.",
    `- App: ${payload.appVersion}`,
    `- Exported: ${payload.exportedAt}`,
    `- Draft: ${payload.draftId}`,
    `- Attempt: ${attempt.id}`,
    "",
    "## Draft 1 summary",
    "",
    `- Score: ${payload.scoring.correctAnswers}/${payload.scoring.totalQuestions} (${payload.scoring.pct}%)`,
    `- Time: ${payload.scoring.timeSpentSeconds} seconds`,
    `- Completed: ${attempt.completedAt ?? "unknown"}`,
    "",
    "## Section breakdown",
    "",
  ];

  for (const section of payload.topicBreakdown.sections) {
    lines.push(`- ${section.label}: ${section.correct}/${section.total} (${section.pct}%)`);
  }

  lines.push("", "## Top gaps", "");
  if (payload.topicBreakdown.weakSkills.length === 0) {
    lines.push("- No weak skills flagged in this short draft.");
  } else {
    for (const skill of payload.topicBreakdown.weakSkills) {
      lines.push(`- ${skill.label}: ${skill.correct}/${skill.total} (${skill.pct}%)`);
    }
  }

  lines.push("", "## Question-by-question", "");
  for (const review of reviews) {
    lines.push(
      `### ${review.skill} (${review.section === "math" ? "Math" : "R&W"}) — ${review.isCorrect ? "correct" : "missed"}`,
    );
    lines.push("");
    lines.push(`**Prompt:** ${review.prompt}`);
    lines.push("");
    lines.push(`- Selected: ${review.selectedChoiceId} — ${review.selectedChoiceText}`);
    lines.push(`- Correct: ${review.correctChoiceId}`);
    lines.push(`- Rationale: ${review.rationale}`);
    lines.push(`- Time: ${review.timeSpentSeconds}s`);
    if (review.rationaleConcern) {
      lines.push(`- Note: ${review.rationaleConcern}`);
    }
    lines.push("");
  }

  if (payload.rationaleReviewPrompts.length > 0) {
    lines.push("## Rationale review prompts", "");
    for (const prompt of payload.rationaleReviewPrompts) {
      lines.push(`- ${prompt}`);
    }
    lines.push("");
  }

  lines.push("## Recommended next steps", "");
  for (const step of payload.recommendedNextSteps) {
    lines.push(`- ${step}`);
  }

  lines.push(
    "",
    "## Requested Cursor task",
    "",
    "Analyze this Draft 1 export. Propose a targeted Draft 2 question set, flag rationale gaps, and recommend SAT lesson/drill updates in Learn v2.",
    "",
  );

  return lines.join("\n");
}

export async function copySatPretestMarkdownToClipboard(
  attempt: SatPretestAttempt,
  questions: SatPretestQuestion[],
  appVersion: string,
  writeText: (text: string) => Promise<void> = (text) => navigator.clipboard.writeText(text),
): Promise<boolean> {
  const markdown = formatSatPretestMarkdown(attempt, questions, appVersion);
  if (!markdown) return false;
  try {
    await writeText(markdown);
    return true;
  } catch {
    return false;
  }
}

export function downloadSatPretestJson(
  attempt: SatPretestAttempt,
  questions: SatPretestQuestion[],
  appVersion: string,
): boolean {
  const payload = buildSatPretestExportPayload(attempt, questions, appVersion);
  if (!payload) return false;

  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const date = payload.exportedAt.slice(0, 10);
  anchor.href = url;
  anchor.download = `learnv2-sat-pretest-${payload.draftId}-${date}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
  return true;
}
