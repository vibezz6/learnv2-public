# Learn v2 — GPT planning handoff (copy everything below the line)

Paste this entire section into ChatGPT 5.5 (or Cursor). Ask for a **2–3 hour execution plan** only — no code unless listed as “sketch.”

---

## Role

You are the **product + tech lead** for Learn v2. The human executes in Cursor on a real repo. Your job: given current state, output a **prioritized plan** for the next **2–3 hours** of work split into **small shippable batches** (each: goal, files/areas, acceptance criteria, test command).

## Product

**Learn v2** — local-first study PWA (React 19, Vite, TypeScript, Zustand, Tailwind v4). Daily driver: `~/liqui/projects/learnv2`, `npm run dev` → http://127.0.0.1:8080. No accounts; `localStorage` + settings backup. **Not** Learn v1. **Not** a trading product.

**User:** Alex, 18, job + August SAT + college applications. Sessions ~15–20 min on phone/laptop.

## Current release

- **Version:** v2.0.36 (`package.json`; UI should match `src/lib/version.ts`)
- **Repo:** https://github.com/dishwashersol/learnv2 · branch `main`

## What is DONE (do not re-build)

### College admissions arc (daily-driver level)

Checklist, essays, nudges, transcript, settings backup, placement, campus deadlines, tomorrow tasks (up to 3).

### SAT diagnostic loop (batches 44–53)

| Batch | Shipped |
|-------|---------|
| 44 | Cursor analysis handoff — export prompt + `docs/sat-pretest-cursor-template.json` |
| 45 | Unified Cursor import — Draft 2 questions + `lessonPlan` → `learnv2_sat_lesson_plan_v1` |
| 46 | Pretest → mistake log bridge |
| 47 | Gap lesson manifest + `docs/sat-gap-lesson-authoring.md` |
| 48 | Five gap nodes st76–st80 in `sat-prep.json` + August track |
| 49 | Sleep/readiness — `learnv2_sat_readiness_v1`, campus card |
| 50 | OpenRouter **post-completion** rationale review on pretest misses (`llmReview.ts`) |
| 51 | Draft 3 retest tab |
| 52 | Tomorrow tasks ↔ pretest + readiness |
| 53 | Dashboard **SAT week** hub card |

**Validated by user:** Draft 1 test (3/10); export + OpenRouter “review my thinking” worked. User will **download exports** after future drafts. **No more diagnostic tests for now** — real study is track + mistake log + college.

### Existing AI (keep narrow)

- **Office hours:** optional OpenRouter TA on lesson notes (`llmReview.ts`, `notePrompts.ts`)
- **Pretest:** optional OpenRouter on **completed** misses only — not live tutoring
- OpenRouter key: Settings → `learnv2_openrouter_key`; smoke test: `npm run openrouter:check`

## Explicitly OUT OF SCOPE (do not plan these)

- Personal journal / Notion clone
- Full calendar / day planner beyond tomorrow tasks
- Sleep graphs / wellness dashboard
- AI tutor chat on every screen
- OpenRouter auto-generating Draft 2 in-app without human/Cursor review
- Bulk `sat-prep.json` edits without gap evidence (max 3–5 nodes per batch)
- Learn v1 / tradingv1 features inside Learn v2
- Backend, accounts, sync (local-only unless human explicitly asks later)

## Known gaps / tech debt

1. `src/lib/version.ts` was drifting from `package.json` — sync on every release (`npm run version:bump` or manual).
2. Pretest attempts are **browser-local** — user may use different profiles; **restore from export JSON** not built yet.
3. User was on **v2.0.25** in exports while `main` was newer — pull + restart dev fixes UI badge.
4. Example Draft 2 import for test Draft 1: `docs/sat-draft2-response-alex-draft1-2026-05-25.json` (optional merge).

## Architecture map (for planning)

| Layer | Key paths |
|-------|-----------|
| Routes | `src/app/App.tsx`, `src/app/lazyPages.ts` |
| Dashboard | `src/features/dashboard/` — `SatTodayCard`, `TomorrowTasks`, `CampusHome` |
| SAT | `src/features/sat/`, `src/lib/satPretest.ts`, `src/data/satPretestDraft*.ts` |
| Curriculum | `src/curriculum/data/sat-prep.json`, `src/data/tracks.ts` |
| Progress | `src/stores/progress.ts`, `src/stores/preferences.ts` |
| LLM | `src/services/llmReview.ts` |
| Settings | `src/features/settings/` |

**Ship gate every batch:** `npm run test` → `npm run build` → commit (user controls push).

## What the human wants from YOU (GPT)

Produce **only**:

### 1. Executive summary (5 bullets)

Where we are, what to focus next **given no more pretest tests**, August SAT + college.

### 2. Next 2–3 hours — 2 or 3 batches

Each batch must include:

- **ID + title** (e.g. Batch 54)
- **Theme** (frontend / lib / docs / polish — no fake “backend” unless real need)
- **Estimated time** (45–90 min each)
- **User value** (one sentence Alex cares about)
- **Tasks** (checklist, 3–8 items)
- **Files likely touched** (paths)
- **Acceptance criteria** (testable)
- **Out of scope for this batch** (prevent creep)

### 3. Backlog (ranked, top 8)

Items for **later** sessions — college polish, restore export, copy audit, mobile loop, etc.

### 4. What NOT to do this week

3–5 bullets.

## Planning rules

- Prefer **study path** (lessons, mistake log, deadlines) over new diagnostic features.
- Each batch must be **mergeable alone**; no 500-line refactors.
- If suggesting GPT/OpenRouter: **optional, post-action, local key** — never required path.
- Do not plan editing Cursor plan markdown files in `.cursor/plans/`.
- README cutover row + version bump when shipping.

## Optional context to attach

- Latest `README.md` cutover table (SAT rows 24–32)
- User Draft 1 summary: 3/10, weak linear/quadratics/synthesis, rationales often “idk”
- Screenshot of dashboard or `/sat/pretest` if available

---

**End of handoff. GPT: output the 4 sections above.**
