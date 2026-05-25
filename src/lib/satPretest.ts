import type { SatLessonPlanEntry } from "@/lib/satLessonPlan";

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

export interface SatPretestQuestionTarget {
  questionId: string;
  reason: string;
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
  compareDraftId?: string;
  questionTargets?: SatPretestQuestionTarget[];
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
    (attempt.scoreSummary === undefined || isValidScoreSummary(attempt.scoreSummary)) &&
    (attempt.compareDraftId === undefined || typeof attempt.compareDraftId === "string") &&
    (attempt.questionTargets === undefined ||
      (Array.isArray(attempt.questionTargets) &&
        attempt.questionTargets.every(
          (target) =>
            !!target &&
            typeof target === "object" &&
            typeof target.questionId === "string" &&
            typeof target.reason === "string",
        )))
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

export interface StartSatPretestOptions {
  compareDraftId?: string;
  questionTargets?: SatPretestQuestionTarget[];
}

export function startSatPretestAttempt(
  draftId: string,
  questions: SatPretestQuestion[],
  storage: Storage = localStorage,
  options: StartSatPretestOptions = {},
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
    compareDraftId: options.compareDraftId,
    questionTargets: options.questionTargets,
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

export function clearAllSatPretestData(storage: Storage = localStorage): void {
  storage.removeItem(SAT_PRETEST_STORAGE_KEY);
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

  if (payload.scoring.recommendedNodeIds.length > 0) {
    lines.push("", "## Related lesson nodes (from misses)", "");
    for (const nodeId of payload.scoring.recommendedNodeIds) {
      lines.push(`- ${nodeId}`);
    }
    lines.push("");
  }

  lines.push(
    "## Requested Cursor task",
    "",
    "Analyze this Draft 1 export. Return JSON matching Learn v2 Cursor import schema:",
    "- `questions`: Draft 2 items (`draftId: \"draft-2\"`) targeting weak skills",
    "- `lessonPlan`: optional `{ nodeId, reason, priority? }[]` for existing or proposed st* lessons",
    "",
    "See docs/sat-pretest-cursor-template.json in the learnv2 repo for the response shape.",
    "",
  );

  return lines.join("\n");
}

export const SAT_PRETEST_CURSOR_IMPORT_SCHEMA_VERSION = 1;

/** Example JSON Cursor should return after reviewing a Draft 1 export. */
export function getSatPretestCursorResponseTemplate(): Record<string, unknown> {
  return {
    schemaVersion: SAT_PRETEST_CURSOR_IMPORT_SCHEMA_VERSION,
    questions: [
      {
        id: "draft2-cursor-math-1",
        draftId: "draft-2",
        section: "math",
        domain: "Algebra",
        skill: "Linear equations",
        difficulty: "medium",
        prompt: "New stem targeting the same skill as the Draft 1 miss.",
        choices: [
          { id: "a", text: "Option A" },
          { id: "b", text: "Option B" },
          { id: "c", text: "Option C" },
          { id: "d", text: "Option D" },
        ],
        correctChoiceId: "b",
        explanation: "Why the answer is correct.",
        relatedNodeIds: ["st4"],
      },
    ],
    lessonPlan: [
      {
        nodeId: "st4",
        reason: "Retarget existing linear equations lesson after Draft 1 gap.",
        priority: 1,
      },
    ],
    notes: "Optional analysis notes for the student.",
  };
}

/** Clipboard-ready instructions plus export markdown for a Cursor analysis session. */
export function buildCursorAnalysisPrompt(
  attempt: SatPretestAttempt,
  questions: SatPretestQuestion[],
  appVersion: string,
): string | null {
  const exportMd = formatSatPretestMarkdown(attempt, questions, appVersion);
  if (!exportMd) return null;

  const templateJson = JSON.stringify(getSatPretestCursorResponseTemplate(), null, 2);

  return [
    "# Cursor task — Learn v2 SAT Draft 1 analysis",
    "",
    "You are reviewing a **local Learn v2 diagnostic** (not an official SAT score).",
    "",
    "## Your deliverable",
    "",
    "Return **one JSON object** the student can paste into Learn v2 → SAT diagnostic → Draft 2 → Validate Cursor import.",
    "",
    "### Required shape",
    "",
    "```json",
    templateJson,
    "```",
    "",
    "Rules:",
    "- Every `questions[]` item must use `draftId: \"draft-2\"` and pass the same validation as Draft 2 import.",
    "- `lessonPlan[]` may reference existing `st*` node ids or propose new ids (authoring batch adds nodes later).",
    "- Target weak skills from the export below; do not copy copyrighted official SAT items.",
    "",
    "---",
    "",
    exportMd,
  ].join("\n");
}

export async function copyCursorAnalysisPromptToClipboard(
  attempt: SatPretestAttempt,
  questions: SatPretestQuestion[],
  appVersion: string,
  writeText: (text: string) => Promise<void> = (text) => navigator.clipboard.writeText(text),
): Promise<boolean> {
  const prompt = buildCursorAnalysisPrompt(attempt, questions, appVersion);
  if (!prompt) return false;
  try {
    await writeText(prompt);
    return true;
  } catch {
    return false;
  }
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

export interface Draft2BuildResult {
  questions: SatPretestQuestion[];
  questionTargets: SatPretestQuestionTarget[];
}

export function buildDraft2FromGaps(
  draft1Attempt: SatPretestAttempt,
  pool: SatPretestQuestion[],
  limit = 6,
): Draft2BuildResult | null {
  if (draft1Attempt.status !== "completed" || !draft1Attempt.scoreSummary) return null;

  const weakLabels = new Set(
    draft1Attempt.scoreSummary.weakSkills.map((skill) => skill.label.toLowerCase()),
  );
  const selected: SatPretestQuestion[] = [];
  const targets: SatPretestQuestionTarget[] = [];
  const used = new Set<string>();

  for (const question of pool) {
    if (selected.length >= limit) break;
    if (!weakLabels.has(question.skill.toLowerCase())) continue;
    if (used.has(question.id)) continue;
    selected.push(question);
    used.add(question.id);
    const weak = draft1Attempt.scoreSummary.weakSkills.find(
      (skill) => skill.label.toLowerCase() === question.skill.toLowerCase(),
    );
    targets.push({
      questionId: question.id,
      reason: weak
        ? `Draft 1 gap: ${weak.label} (${weak.correct}/${weak.total} correct).`
        : `Draft 1 gap in ${question.skill}.`,
    });
  }

  if (selected.length < Math.min(4, limit)) {
    const sectionOrder = [...draft1Attempt.scoreSummary.sectionBreakdown].sort(
      (a, b) => a.pct - b.pct,
    );
    for (const section of sectionOrder) {
      for (const question of pool) {
        if (selected.length >= limit) break;
        if (question.section !== section.key || used.has(question.id)) continue;
        selected.push(question);
        used.add(question.id);
        targets.push({
          questionId: question.id,
          reason: `Draft 1 ${section.label} was ${section.pct}% — extra practice here.`,
        });
      }
    }
  }

  if (selected.length === 0) return null;
  return { questions: selected, questionTargets: targets };
}

export type Draft2ImportResult =
  | { ok: true; questions: SatPretestQuestion[] }
  | { ok: false; error: string };

function isValidDraft2Question(value: unknown): value is SatPretestQuestion {
  if (!value || typeof value !== "object") return false;
  const question = value as Partial<SatPretestQuestion>;
  return (
    typeof question.id === "string" &&
    typeof question.draftId === "string" &&
    (question.section === "math" || question.section === "rw") &&
    typeof question.domain === "string" &&
    typeof question.skill === "string" &&
    (question.difficulty === "easy" ||
      question.difficulty === "medium" ||
      question.difficulty === "hard") &&
    typeof question.prompt === "string" &&
    Array.isArray(question.choices) &&
    question.choices.length >= 2 &&
    question.choices.every(
      (choice) =>
        !!choice &&
        typeof choice === "object" &&
        typeof choice.id === "string" &&
        typeof choice.text === "string",
    ) &&
    typeof question.correctChoiceId === "string" &&
    typeof question.explanation === "string"
  );
}

export function parseSatPretestDraft2Import(raw: unknown): Draft2ImportResult {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "Invalid JSON: expected an object." };
  }
  const payload = raw as Record<string, unknown>;
  const questions = payload.questions;
  if (!Array.isArray(questions) || questions.length === 0) {
    return { ok: false, error: "Missing or empty questions array." };
  }
  const parsed = questions.filter(isValidDraft2Question);
  if (parsed.length !== questions.length) {
    return { ok: false, error: "One or more questions failed validation." };
  }
  return { ok: true, questions: parsed };
}

export function parseSatPretestDraft2ImportJson(text: string): Draft2ImportResult {
  const cursor = parseSatPretestCursorImportJson(text);
  if (cursor.ok) return { ok: true, questions: cursor.questions };
  return cursor;
}

export interface SatPretestCursorImportPayload {
  schemaVersion?: number;
  questions: SatPretestQuestion[];
  lessonPlan?: SatLessonPlanEntry[];
  notes?: string;
}

export type SatPretestCursorImportResult =
  | {
      ok: true;
      questions: SatPretestQuestion[];
      lessonPlan: SatLessonPlanEntry[];
      notes?: string;
    }
  | { ok: false; error: string };

function parseLessonPlanEntries(raw: unknown): SatLessonPlanEntry[] {
  if (!Array.isArray(raw)) return [];
  const entries: SatLessonPlanEntry[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const entry = item as Record<string, unknown>;
    if (typeof entry.nodeId !== "string" || typeof entry.reason !== "string") continue;
    const nodeId = entry.nodeId.trim();
    const reason = entry.reason.trim();
    if (!nodeId || !reason) continue;
    entries.push({
      nodeId,
      reason,
      priority: typeof entry.priority === "number" ? entry.priority : undefined,
    });
  }
  return entries;
}

export function parseSatPretestCursorImport(raw: unknown): SatPretestCursorImportResult {
  const draft2 = parseSatPretestDraft2Import(raw);
  if (!draft2.ok) return draft2;

  const payload = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const lessonPlan = parseLessonPlanEntries(payload.lessonPlan);
  const notes = typeof payload.notes === "string" ? payload.notes.trim() : undefined;

  return {
    ok: true,
    questions: draft2.questions,
    lessonPlan,
    notes: notes || undefined,
  };
}

export function parseSatPretestCursorImportJson(text: string): SatPretestCursorImportResult {
  try {
    return parseSatPretestCursorImport(JSON.parse(text));
  } catch {
    return { ok: false, error: "Could not parse JSON." };
  }
}

export function compareDraftScores(
  baseline: SatPretestAttempt,
  followUp: SatPretestAttempt,
): { skill: string; draft1Pct: number; draft2Pct: number; delta: number }[] {
  if (!baseline.scoreSummary || !followUp.scoreSummary) return [];
  const draft1BySkill = new Map(
    baseline.scoreSummary.skillBreakdown.map((skill) => [skill.label, skill.pct]),
  );
  const rows: { skill: string; draft1Pct: number; draft2Pct: number; delta: number }[] = [];
  for (const skill of followUp.scoreSummary.skillBreakdown) {
    const draft1Pct = draft1BySkill.get(skill.label);
    if (draft1Pct === undefined) continue;
    rows.push({
      skill: skill.label,
      draft1Pct,
      draft2Pct: skill.pct,
      delta: skill.pct - draft1Pct,
    });
  }
  return rows.sort((a, b) => a.skill.localeCompare(b.skill));
}

export interface SatPretestTranscriptSummary {
  draft1InProgress: boolean;
  draft1Completed: boolean;
  draft1ScorePct: number | null;
  draft1WeakSkills: string[];
  draft2Completed: boolean;
  draft2ScorePct: number | null;
}

export function getSatPretestTranscriptSummary(
  draft1Id = "draft-1",
  draft2Id = "draft-2",
  storage: Storage = localStorage,
): SatPretestTranscriptSummary {
  const draft1Active = getActiveSatPretestAttempt(draft1Id, storage);
  const draft1Done = getLatestCompletedSatPretestAttempt(draft1Id, storage);
  const draft2Done = getLatestCompletedSatPretestAttempt(draft2Id, storage);

  return {
    draft1InProgress: !!draft1Active,
    draft1Completed: !!draft1Done,
    draft1ScorePct: draft1Done?.scoreSummary?.pct ?? null,
    draft1WeakSkills: draft1Done?.scoreSummary?.weakSkills.map((s) => s.label) ?? [],
    draft2Completed: !!draft2Done,
    draft2ScorePct: draft2Done?.scoreSummary?.pct ?? null,
  };
}

export function formatSatPretestTranscriptSection(
  summary: SatPretestTranscriptSummary,
): string[] {
  const lines: string[] = ["## SAT diagnostic", ""];

  if (summary.draft1InProgress) {
    lines.push("- Draft 1 diagnostic: in progress (resume at /sat/pretest).");
  } else if (summary.draft1Completed && summary.draft1ScorePct !== null) {
    lines.push(`- Draft 1 diagnostic: completed (${summary.draft1ScorePct}% on short draft).`);
    if (summary.draft1WeakSkills.length > 0) {
      lines.push(`- Top gaps: ${summary.draft1WeakSkills.join(", ")}.`);
    }
  } else {
    lines.push("- Draft 1 diagnostic: not started yet.");
  }

  if (summary.draft2Completed && summary.draft2ScorePct !== null) {
    lines.push(`- Draft 2 follow-up: completed (${summary.draft2ScorePct}%).`);
  } else if (summary.draft1Completed) {
    lines.push("- Draft 2 follow-up: available after Draft 1.");
  }

  lines.push("");
  return lines;
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
