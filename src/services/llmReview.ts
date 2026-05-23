// src/services/llmReview.ts
// LLM-powered note review and mentor services using OpenRouter free models

import type { NoteReview } from "@/curriculum/types";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_KEY = "learnv2_openrouter_key";
const LEGACY_OPENROUTER_KEY = "learnapp_openrouter_key";
const OPENROUTER_MODEL_KEY = "learnv2_openrouter_model";
const LEGACY_OPENROUTER_MODEL_KEY = "learnapp_openrouter_model";
const DEFAULT_MODEL = "deepseek/deepseek-chat-v3.1:free";

// Get API key from localStorage (set by user or from config)
function getApiKey(): string | null {
  try {
    return localStorage.getItem(OPENROUTER_KEY) || localStorage.getItem(LEGACY_OPENROUTER_KEY);
  } catch {
    return null;
  }
}

function getModel(): string {
  try {
    return (
      localStorage.getItem(OPENROUTER_MODEL_KEY)
      || localStorage.getItem(LEGACY_OPENROUTER_MODEL_KEY)
      || DEFAULT_MODEL
    );
  } catch {
    return DEFAULT_MODEL;
  }
}

interface LLMConfig {
  model: string;
  apiKey: string;
  maxTokens: number;
  temperature: number;
}

function getConfig(): LLMConfig | null {
  const apiKey = getApiKey();
  if (!apiKey) return null;
  return {
    model: getModel(),
    apiKey,
    maxTokens: 2048,
    temperature: 0.3,
  };
}

function buildLLMRequestBody(
  config: LLMConfig,
  systemPrompt: string,
  userPrompt: string,
  includeJsonFormat: boolean,
): string {
  return JSON.stringify({
    model: config.model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    max_tokens: config.maxTokens,
    temperature: config.temperature,
    ...(includeJsonFormat ? { response_format: { type: "json_object" } } : {}),
  });
}

async function sendLLMRequest(
  config: LLMConfig,
  systemPrompt: string,
  userPrompt: string,
  includeJsonFormat: boolean,
): Promise<Response> {
  return fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${config.apiKey}`,
      "HTTP-Referer": "https://learnv2.app",
      "X-Title": "Learn v2 Notes",
    },
    body: buildLLMRequestBody(config, systemPrompt, userPrompt, includeJsonFormat),
  });
}

async function callLLM(systemPrompt: string, userPrompt: string): Promise<string | null> {
  const config = getConfig();
  if (!config) return null;

  try {
    let res = await sendLLMRequest(config, systemPrompt, userPrompt, true);

    if (res.status === 400) {
      res = await sendLLMRequest(config, systemPrompt, userPrompt, false);
    }

    if (!res.ok) {
      console.warn(`LLM API error: ${res.status}`);
      return null;
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (err) {
    console.warn("LLM API call failed:", err);
    return null;
  }
}

// Parse JSON from LLM response, handling potential markdown code blocks
function parseJSON<T>(text: string): T | null {
  try {
    // Try direct parse first
    return JSON.parse(text) as T;
  } catch {
    // Try extracting from markdown code block
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      try {
        return JSON.parse(match[1].trim()) as T;
      } catch { /* fall through */ }
    }
    // Try finding the first { ... } block
    const braceMatch = text.match(/\{[\s\S]*\}/);
    if (braceMatch) {
      try {
        return JSON.parse(braceMatch[0]) as T;
      } catch { /* fall through */ }
    }
    return null;
  }
}

// --- Note Review ---

const REVIEW_SYSTEM_PROMPT = `You are an expert educational tutor reviewing a student's guided notes for a lesson. Analyze their responses and provide constructive, encouraging feedback.

Return a JSON object with this exact structure:
{
  "score": <number 0-100>,
  "strengths": ["<string>", ...],
  "gaps": ["<string>", ...],
  "suggestions": ["<string>", ...],
  "deeperQuestions": ["<string>", ...]
}

Guidelines:
- score: 0-100 based on coverage, depth, and understanding shown
- strengths: 2-4 specific things the student did well (be specific, reference their actual content)
- gaps: 1-3 key concepts from the lesson that weren't addressed or were unclear
- suggestions: 1-3 actionable suggestions for improvement
- deeperQuestions: 2-3 thought-provoking questions to deepen understanding
- Be encouraging but honest
- Reference specific content from their notes when possible
- Keep each item concise (1-2 sentences)`;

export async function generateLLMReview(
  responses: Record<string, string>,
  keyConcepts: string[],
  lessonName: string,
): Promise<NoteReview | null> {
  const userPrompt = `Lesson: ${lessonName}
Key concepts: ${keyConcepts.join(", ")}

Student's guided notes:
${Object.entries(responses)
  .filter(([, v]) => v.trim())
  .map(([k, v]) => `**${k}:**\n${v}`)
  .join("\n\n")}

Please review these notes and provide feedback in the specified JSON format.`;

  const response = await callLLM(REVIEW_SYSTEM_PROMPT, userPrompt);
  if (!response) return null;

  interface LLReviewOutput {
    score: number;
    strengths: string[];
    gaps: string[];
    suggestions: string[];
    deeperQuestions: string[];
  }

  const parsed = parseJSON<LLReviewOutput>(response);
  if (!parsed) return null;

  return {
    score: Math.min(100, Math.max(0, parsed.score || 0)),
    strengths: parsed.strengths || [],
    gaps: parsed.gaps || [],
    suggestions: parsed.suggestions || [],
    deeperQuestions: parsed.deeperQuestions || [],
    generatedAt: Date.now(),
    completedAt: null,
  };
}

// --- Mentor Questions ---

const MENTOR_SYSTEM_PROMPT = `You are an expert educational mentor creating quiz questions for a student. Based on the lesson's key concepts, generate 5 thoughtful questions that test understanding (not just recall).

Return a JSON object with this exact structure:
{
  "questions": [
    "<question 1>",
    "<question 2>",
    "<question 3>",
    "<question 4>",
    "<question 5>"
  ]
}

Guidelines:
- Questions should test conceptual understanding, not just memorization
- Mix of question types: explanation, application, connection-making, critical thinking
- Questions should be answerable in 2-4 sentences
- Progress from foundational to more advanced
- Be specific to the concepts provided
- Avoid yes/no questions`;

export async function generateLLMMentorQuestions(
  keyConcepts: string[],
  lessonName: string,
): Promise<string[] | null> {
  const userPrompt = `Lesson: ${lessonName}
Key concepts: ${keyConcepts.join(", ")}

Generate 5 mentor quiz questions that test deep understanding of these concepts.`;

  const response = await callLLM(MENTOR_SYSTEM_PROMPT, userPrompt);
  if (!response) return null;

  interface LLMentorOutput {
    questions: string[];
  }

  const parsed = parseJSON<LLMentorOutput>(response);
  if (!parsed || !Array.isArray(parsed.questions)) return null;

  return parsed.questions.slice(0, 5);
}

// --- Answer Evaluation ---

const EVAL_SYSTEM_PROMPT = `You are an expert educational mentor evaluating a student's answer to a quiz question. Provide brief, encouraging feedback and rate the quality.

Return a JSON object with this exact structure:
{
  "feedback": "<1-2 sentence feedback>",
  "quality": "<one of: too-short | good-start | solid | excellent>"
}

Guidelines:
- too-short: Answer is < 10 words or shows minimal effort
- good-start: Answer shows some understanding but needs more depth
- solid: Answer demonstrates good understanding with relevant details
- excellent: Answer shows deep understanding, uses examples, makes connections
- Be encouraging — even for weak answers, find something positive
- Keep feedback to 1-2 sentences max`;

export async function evaluateLLMAnswer(
  question: string,
  answer: string,
): Promise<{ feedback: string; quality: "too-short" | "good-start" | "solid" | "excellent" } | null> {
  const userPrompt = `Question: ${question}

Student's answer: ${answer}

Evaluate this answer and provide feedback in the specified JSON format.`;

  const response = await callLLM(EVAL_SYSTEM_PROMPT, userPrompt);
  if (!response) return null;

  interface LLMEvalOutput {
    feedback: string;
    quality: "too-short" | "good-start" | "solid" | "excellent";
  }

  const parsed = parseJSON<LLMEvalOutput>(response);
  if (!parsed) return null;

  const quality = ["too-short", "good-start", "solid", "excellent"].includes(parsed.quality)
    ? parsed.quality
    : "good-start";

  return { feedback: parsed.feedback, quality };
}
