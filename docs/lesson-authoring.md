# Lesson Authoring Guide

Use this when a cheaper AI model drafts Learn v2 curriculum. The model is allowed to draft, but not to decide curriculum structure or ship unreviewed content.

## Workflow

1. Read `src/curriculum/types.ts`.
2. Read 2-3 nearby lessons in the same subject.
3. Draft one `SkillNode` at a time.
4. Validate with `npm run curriculum:lint`.
5. Have a stronger model or human review correctness, tone, and examples before merging.

## SkillNode Template

```json
{
  "id": "subject_number_or_short_slug",
  "name": "Clear lesson title",
  "description": "One sentence explaining what the learner will understand or practice.",
  "xpValue": 80,
  "parentIds": ["previous_node_id"],
  "estimatedMinutes": 30,
  "difficulty": "beginner",
  "keyConcepts": [
    "Specific concept, not a vague theme",
    "Second concept with the exact skill named",
    "Third concept that appears in examples or quiz"
  ],
  "whyItMatters": "Explain why this matters for the learner's SAT, college, coding, or real work goal.",
  "workedExamples": [
    {
      "problem": "Concrete problem with enough detail to solve.",
      "solution": "Step-by-step solution in plain language.",
      "explanation": "Name the principle and the trap this avoids."
    }
  ],
  "commonMistakes": [
    "Specific mistake a learner might make",
    "Another mistake tied to the worked example"
  ],
  "practiceProblems": [
    "Short practice task the learner can do now.",
    "Second task that checks transfer, not memorization."
  ],
  "resources": [
    {
      "title": "Real resource title",
      "url": "https://example.com/real-resource",
      "type": "article",
      "whyHelpful": "Why this source helps verify or extend the lesson."
    }
  ],
  "quiz": [
    {
      "id": "q_nodeid_1",
      "question": "Focused question with one best answer.",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 1,
      "explanation": "Explain why the right answer is right and the tempting wrong answer is wrong."
    }
  ]
}
```

## Good vs Bad

Good lessons:

- Teach directly before linking out.
- Use simple numbers in worked examples.
- Include practice a tired learner can actually start.
- Include common mistakes when the topic has traps.
- Use real external resources or internal `/subjects/...` links.

Bad lessons:

- Fake a College Board/Khan/source URL.
- Write motivation without teaching the skill.
- Create huge paragraphs that do not fit a 15-30 minute session.
- Add fields not in `SkillNode`.
- Make quiz answers ambiguous or set `correctIndex` outside the options array.

## Cheap Model Prompt

```text
You are drafting ONE Learn v2 SkillNode. Before writing, inspect the provided nearby lesson examples and preserve their JSON style. Follow src/curriculum/types.ts exactly. Teach the topic directly with key concepts, at least one worked example when appropriate, common mistakes, practice problems, and 2-4 quiz questions. Do not invent fake resource URLs. If you are unsure about a source, omit it or use an internal Learn route. Keep the lesson study-first and concise for a 15-30 minute session. Return valid JSON for one node only.
```

## Review Checklist

- The lesson teaches a concrete skill.
- Every quiz has 2+ options and a valid `correctIndex`.
- Resource URLs are real-looking `https://` links or internal `/` routes.
- Parent IDs point to existing lessons.
- SAT lessons match Digital SAT style and do not overfocus on diagnostics.
- `npm run curriculum:lint`, `npm test`, and `npm run build` pass after changes.
