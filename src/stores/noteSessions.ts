// Notes 2.0 — Session store for guided note-taking, AI review, and mentor Q&A
// localStorage key: learnapp_note_sessions_v2

import type { NoteSession, NoteReview, MentorSession } from "@/curriculum/types";

const STORAGE_KEY = "learnapp_note_sessions_v2";

function loadAll(): Record<string, NoteSession> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore corrupt data */ }
  return {};
}

function saveAll(data: Record<string, NoteSession>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* quota exceeded — silent fail */ }
}

export function getSession(nodeId: string): NoteSession | null {
  return loadAll()[nodeId] || null;
}

export function upsertSession(session: NoteSession) {
  const all = loadAll();
  all[session.nodeId] = session;
  saveAll(all);
}

export function updateResponses(nodeId: string, responses: Record<string, string>) {
  const all = loadAll();
  if (!all[nodeId]) return;
  all[nodeId].responses = { ...all[nodeId].responses, ...responses };
  all[nodeId].updatedAt = Date.now();
  saveAll(all);
}

export const MIN_TAKEAWAYS = 1;
export const MAX_TAKEAWAYS = 5;

export function parseTakeaways(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function formatTakeaways(bullets: string[]): string {
  return bullets.join("\n");
}

export function getTakeaways(nodeId: string): string {
  return getSession(nodeId)?.responses.takeaways ?? "";
}

export type SaveTakeawaysResult = { ok: true } | { ok: false; error: string };

export function saveTakeaways(
  nodeId: string,
  subjectId: string,
  text: string,
): SaveTakeawaysResult {
  const bullets = parseTakeaways(text);
  if (bullets.length < MIN_TAKEAWAYS) {
    return { ok: false, error: "Add at least one takeaway." };
  }
  if (bullets.length > MAX_TAKEAWAYS) {
    return { ok: false, error: "Maximum 5 takeaways." };
  }

  const normalized = formatTakeaways(bullets);
  const existing = getSession(nodeId);
  if (existing) {
    updateResponses(nodeId, { takeaways: normalized });
  } else {
    upsertSession({
      nodeId,
      subjectId,
      responses: { takeaways: normalized },
      review: null,
      mentorSession: null,
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }
  return { ok: true };
}

export function saveReview(nodeId: string, review: NoteReview) {
  const all = loadAll();
  if (!all[nodeId]) return;
  all[nodeId].review = review;
  all[nodeId].updatedAt = Date.now();
  saveAll(all);
}

export function saveMentorSession(nodeId: string, mentor: MentorSession) {
  const all = loadAll();
  if (!all[nodeId]) return;
  all[nodeId].mentorSession = mentor;
  all[nodeId].updatedAt = Date.now();
  saveAll(all);
}

export function deleteSession(nodeId: string) {
  const all = loadAll();
  delete all[nodeId];
  saveAll(all);
}

export function getAllSessions(): NoteSession[] {
  return Object.values(loadAll()).sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getSessionsNeedingReview(): NoteSession[] {
  return getAllSessions().filter(s => s.review && !s.review.completedAt);
}

export function getTotalSessionCount(): number {
  return Object.keys(loadAll()).length;
}

// Generate AI review — tries LLM first, falls back to heuristic
export async function generateReviewAsync(
  nodeId: string,
  responses: Record<string, string>,
  keyConcepts: string[],
  lessonName: string,
): Promise<NoteReview> {
  // Try LLM first
  try {
    const { generateLLMReview } = await import("@/services/llmReview");
    const llmReview = await generateLLMReview(responses, keyConcepts, lessonName);
    if (llmReview) {
      // Save to session
      const all = loadAll();
      if (all[nodeId]) {
        all[nodeId].review = llmReview;
        all[nodeId].updatedAt = Date.now();
        saveAll(all);
      }
      return llmReview;
    }
  } catch { /* fall through to heuristic */ }

  // Fallback to heuristic
  return generateReview(nodeId, responses, keyConcepts);
}

// Generate mentor questions — tries LLM first, falls back to template
export async function generateMentorQuestionsAsync(
  keyConcepts: string[],
  lessonName: string,
): Promise<string[]> {
  try {
    const { generateLLMMentorQuestions } = await import("@/services/llmReview");
    const llmQuestions = await generateLLMMentorQuestions(keyConcepts, lessonName);
    if (llmQuestions && llmQuestions.length > 0) return llmQuestions;
  } catch { /* fall through */ }

  return generateMentorQuestions(keyConcepts);
}

// Evaluate mentor answer — tries LLM first, falls back to heuristic
export async function evaluateMentorAnswerAsync(
  question: string,
  answer: string,
): Promise<{ feedback: string; quality: "too-short" | "good-start" | "solid" | "excellent" }> {
  try {
    const { evaluateLLMAnswer } = await import("@/services/llmReview");
    const llmEval = await evaluateLLMAnswer(question, answer);
    if (llmEval) return llmEval;
  } catch { /* fall through */ }

  return evaluateMentorAnswer(answer);
}

// --- Synchronous fallbacks (original implementations) ---

// Generate AI review from content analysis (heuristic fallback)
export function generateReview(
  nodeId: string,
  responses: Record<string, string>,
  keyConcepts: string[]
): NoteReview {
  const all = loadAll();
  const session = all[nodeId];

  const responseCount = Object.values(responses).filter(v => v.trim().length > 0).length;
  const totalWords = Object.values(responses).reduce((sum, v) => sum + v.trim().split(/\s+/).filter(Boolean).length, 0);

  // Detect covered concepts
  const allText = Object.values(responses).join(" ").toLowerCase();
  const covered: string[] = [];
  const missing: string[] = [];
  for (const concept of keyConcepts) {
    const lower = concept.toLowerCase();
    if (allText.includes(lower) || allText.includes(lower.replace(/[^a-z0-9]/g, " "))) {
      covered.push(concept);
    } else {
      missing.push(concept);
    }
  }

  // Score: 0-100 based on coverage depth
  let score = 0;
  score += Math.min(40, responseCount * 10); // up to 40pts for filling prompts
  score += Math.min(30, Math.floor(totalWords / 10)); // up to 30pts for depth
  score += Math.min(30, covered.length * 10); // up to 30pts for concept coverage
  score = Math.min(100, score);

  const strengths: string[] = [];
  const gaps: string[] = [];
  const suggestions: string[] = [];
  const deeperQuestions: string[] = [];

  if (responseCount >= 5) strengths.push("Thorough engagement with guided prompts");
  else if (responseCount >= 3) strengths.push("Good engagement with most prompts");
  else gaps.push("Several prompts are still unanswered — try filling them in");

  if (totalWords > 200) strengths.push("Detailed written responses show deep thinking");
  else if (totalWords > 80) strengths.push("Solid written responses");
  else gaps.push("Responses are brief — try elaborating more");

  if (covered.length > 0) strengths.push(`Demonstrates understanding of: ${covered.slice(0, 3).join(", ")}`);
  if (missing.length > 0) {
    gaps.push(`Key concepts not yet addressed: ${missing.slice(0, 3).join(", ")}`);
    suggestions.push(`Revisit: ${missing[0]}`);
  }

  if (score >= 80) {
    suggestions.push("Great work! Try the Mentor Quiz to test retention");
    deeperQuestions.push("How would you explain this to someone who's never seen it before?");
  } else if (score >= 50) {
    suggestions.push("Review the lesson and fill in any gaps in your notes");
    deeperQuestions.push("What's the most confusing part of this lesson?");
  } else {
    suggestions.push("Re-read the lesson and try the guided prompts again");
    deeperQuestions.push("What's the main idea of this lesson in your own words?");
  }

  // Build concept-specific questions
  for (const concept of keyConcepts.slice(0, 3)) {
    deeperQuestions.push(`How does "${concept}" connect to what you already know?`);
  }

  const review: NoteReview = {
    score,
    strengths,
    gaps,
    suggestions,
    deeperQuestions: deeperQuestions.slice(0, 5),
    generatedAt: Date.now(),
    completedAt: null,
  };

  // Save to session
  if (session) {
    session.review = review;
    session.updatedAt = Date.now();
    saveAll(all);
  }

  return review;
}

// Generate mentor questions from key concepts
export function generateMentorQuestions(keyConcepts: string[]): string[] {
  const questions: string[] = [];

  if (keyConcepts.length > 0) {
    questions.push(`In your own words, explain "${keyConcepts[0]}".`);
  }
  if (keyConcepts.length > 1) {
    questions.push(`How does "${keyConcepts[1]}" relate to "${keyConcepts[0]}"?`);
  }
  if (keyConcepts.length > 2) {
    questions.push(`What's a real-world example of "${keyConcepts[2]}"?`);
  }

  // Generic fallbacks
  questions.push("What was the most important takeaway from this lesson?");
  questions.push("If you had to teach this to a friend, where would you start?");

  return questions.slice(0, 5);
}

// Tag management
export function addTag(nodeId: string, tag: string): void {
  const all = loadAll();
  const session = all[nodeId];
  if (!session) return;
  if (!session.tags) session.tags = [];
  const normalized = tag.trim().toLowerCase();
  if (!normalized || session.tags.includes(normalized)) return;
  session.tags.push(normalized);
  session.updatedAt = Date.now();
  saveAll(all);
}

export function removeTag(nodeId: string, tag: string): void {
  const all = loadAll();
  const session = all[nodeId];
  if (!session || !session.tags) return;
  session.tags = session.tags.filter(t => t !== tag);
  session.updatedAt = Date.now();
  saveAll(all);
}

export function getAllTags(): string[] {
  const all = loadAll();
  const tagSet = new Set<string>();
  for (const session of Object.values(all)) {
    if (session.tags) {
      for (const tag of session.tags) {
        tagSet.add(tag);
      }
    }
  }
  return Array.from(tagSet).sort();
}

// Evaluate mentor answer quality
export function evaluateMentorAnswer(answer: string): { feedback: string; quality: "too-short" | "good-start" | "solid" | "excellent" } {
  const words = answer.trim().split(/\s+/).filter(Boolean).length;
  if (words <= 5) return { feedback: "Try expanding your answer a bit more...", quality: "too-short" };
  if (words < 20) return { feedback: "Good start! Can you add more detail?", quality: "good-start" };
  if (words < 50) return { feedback: "Solid answer! You're demonstrating understanding.", quality: "solid" };
  return { feedback: "Excellent! Thorough and well-explained.", quality: "excellent" };
}
