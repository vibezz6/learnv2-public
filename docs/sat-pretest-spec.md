# SAT Pretest Architecture Spec

## Goal

Build a local-only SAT diagnostic loop for Draft 1 before adding Draft 2 personalization,
bulk lessons, or planner/wellness features. The diagnostic captures both a selected answer
and Alex's own reasoning before any correctness feedback.

## Existing Patterns To Reuse

- Lesson quiz UX: one question at a time, persisted progress, completion summary.
- SAT mistake log: typed `src/lib` module, `learnv2_` storage key, validation, tests with
  injectable `Storage`.
- Campus Home and SAT subject page: primary entry points for SAT next actions.
- Settings backup: any `learnv2_*` key is already included in full local backup exports.
- Transcript: later extension point for completed Draft 1 and gap summaries.

## Storage

Core key: `learnv2_sat_pretest_v1`

The value stores a schema version and attempts. Attempts include draft id, status, local
timestamps, ordered question ids, current question index, responses, timing, and an optional
score summary after completion. In-progress attempts resume from localStorage after refresh.

## Draft 1 Question Shape

Draft 1 uses a SAT-specific question type, not `QuizQuestion`, because diagnostics need
section/domain/skill tags, required rationale capture, timing, and related lesson ids.

Each question includes:

- `id`, `draftId`, `section`, `domain`, `skill`, `difficulty`
- `prompt`, `choices`, `correctChoiceId`, `explanation`
- Optional `source`, `relatedNodeIds`

## UX Flow

1. Start Draft 1 from Campus Home or the SAT Prep subject page.
2. Read a local-only disclaimer: this is a Learn diagnostic, not an official score predictor.
3. For each question, choose an answer and write a required rationale.
4. Submit the question to lock the answer and then see correctness feedback.
5. Continue through the fixed Draft 1 order, with local resume after refresh.
6. On completion, show score, section breakdown, weakest skills, recommended lesson links, and
   time spent.

## Route

Use `/sat/pretest` for the first implementation. It is a standalone SAT route, lazy-loaded from
the main app router, and linked from existing SAT surfaces.

## Phase Boundaries

Phase 1: Draft 1 start/resume/complete.

Phase 2: Export JSON and copyable Markdown on the completion screen (`buildSatPretestExportPayload`,
`formatSatPretestMarkdown`, copy/download actions). Draft 2 import, transcript integration, AI
review, command palette shortcuts, and new SAT lesson batches remain later phases.

## Cursor analysis handoff (Draft 1 → Draft 2 + lesson plan)

After Draft 1 completes, export JSON/Markdown from `/sat/pretest` or use **Copy Cursor prompt** on the
results screen. Paste into a Cursor session with the export attached.

### Expected Cursor response shape

Import via **Validate Cursor import** on the Draft 2 tab (`parseSatPretestCursorImportJson`):

| Field | Required | Description |
|-------|----------|-------------|
| `schemaVersion` | optional | `1` |
| `questions` | yes | Array of `SatPretestQuestion` with `draftId: "draft-2"` |
| `lessonPlan` | optional | `{ nodeId, reason, priority? }[]` — existing `st*` ids or proposed new ids |
| `notes` | optional | Free text for the student or a later authoring batch |

Example template: [`docs/sat-pretest-cursor-template.json`](sat-pretest-cursor-template.json).

Lesson plan entries persist under `learnv2_sat_lesson_plan_v1` (included in `learnv2_*` backup).
Recommended lessons prefer the imported plan over raw `recommendedNodeIds` when present.

## Test Plan

- Unit-test `satPretest` storage, validation, resume, completion, scoring, and corrupt-data
  handling.
- Run the full test suite and production build before shipping.
