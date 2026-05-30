# Learn v2 — GPT planning handoff (copy everything below the line)

Paste this entire section into ChatGPT 5.5 (or Cursor). Ask for a **2–3 hour execution plan** only — no code unless listed as “sketch.”

---

## Role

You are the **product + tech lead** for Learn v2. The human executes in Cursor on a real repo. Your job: given current state, output a **prioritized plan** for the next **2–3 hours** of work split into **small shippable batches** (each: goal, files/areas, acceptance criteria, test command).

## Product

**Learn v2** — local-first study PWA (React 19, Vite, TypeScript, Zustand, Tailwind v4). Daily driver: `~/liqui/projects/learnv2`, `npm run dev` → http://127.0.0.1:8080. No accounts; `localStorage` + settings backup. **Not** Learn v1. **Not** a trading product.

**User:** Alex, 18, job + August SAT + college applications. Sessions ~15–20 min on phone/laptop.

## Current release

- **Version:** v2.0.44 (`package.json`; UI matches `src/lib/version.ts`)
- **Repo:** https://github.com/dishwashersol/learnv2 · branch `main`
- **Curriculum:** 326 lessons (11 subjects)

## What is DONE (do not re-build)

### College admissions arc (daily-driver level)

Checklist, essays, nudges, transcript (incl. Draft 3 retest line), settings backup, placement, campus deadlines, tomorrow tasks (up to 3), blocking application item on campus hub.

### SAT study loop (batches 37–61, v2.0.37–v2.0.44)

| Area | Shipped |
|------|---------|
| Study command | Dashboard **SAT today** card; `satDailyStudy` drives primary CTA (lessons, mistakes, official practice; diagnostics optional after Draft 1) |
| Tomorrow | Tasks re-ranked toward mistake review / gap lessons before optional Draft 2 |
| SAT Prep hub | Study hero, mistake log, official practice log; diagnostics demoted in copy |
| Mistake triage | Top categories surfaced on SAT today |
| Diagnostics infra | Draft 1–3, Cursor import/export, **restore from export JSON** (Settings), Draft 2 pool persists across refresh |
| Gap curriculum | st76–st80 + August track; manifest for proposed nodes |
| Readiness | Test-week check-in on campus home |
| Copy audit | Study-first wording dashboard → palette → pretest/settings (v2.0.41–44); spec in `docs/sat-copy-audit.md` |

**Validated by user:** Draft 1 test (3/10); export + OpenRouter review worked. **No more diagnostic tests for now** — real study is track + mistake log + college.

### Existing AI (keep narrow)

- **Office hours:** optional OpenRouter TA on lesson notes (`llmReview.ts`)
- **Pretest:** optional OpenRouter on **completed** misses only
- OpenRouter key: Settings → `learnv2_openrouter_key`; `npm run openrouter:check`

## Explicitly OUT OF SCOPE (do not plan these)

- Personal journal / Notion clone
- Full calendar / day planner beyond tomorrow tasks
- Sleep graphs / wellness dashboard
- AI tutor chat on every screen
- OpenRouter auto-generating Draft 2 in-app without human/Cursor review
- Bulk `sat-prep.json` edits without gap evidence (max 3–5 nodes per batch)
- Learn v1 / tradingv1 features inside Learn v2
- Backend, accounts, sync (local-only unless human explicitly asks later)
- More diagnostic drafts as the **primary** daily loop

## Known gaps / tech debt (planning hints)

1. **Mobile touch targets** on SAT mistake log + official practice forms (15–20 min phone sessions).
2. **Gap lessons** only when mistake log / imported plan shows repeat evidence—not bulk SAT JSON.
3. Optional: `docs/sat-draft2-response-alex-draft1-2026-05-25.json` as fixture for testing Cursor import.
4. DAG copy runs: use `~/.hermes/autonomous/.env` for `CURSOR_API_KEY`; see `docs/dag-runner-log-instructions.md`.

## Architecture map (for planning)

| Layer | Key paths |
|-------|-----------|
| Routes | `src/app/App.tsx`, `src/app/lazyPages.ts` |
| Dashboard | `src/features/dashboard/` — `RightNowHero`, `TodayMinimumStrip`, `CampusHome` |
| SAT | `src/features/sat/`, `src/lib/satPretest.ts`, `src/lib/satDailyStudy.ts`, `src/lib/satPracticeLog.ts` |
| Curriculum | `src/curriculum/data/sat-prep.json`, `src/data/tracks.ts` |
| Progress | `src/stores/progress.ts`, `src/stores/preferences.ts` |
| LLM | `src/services/llmReview.ts` |
| Settings | `src/features/settings/` |

**Ship gate every batch:** `npm run test` → `npm run build` → commit (user controls push). Bump `package.json` + `src/lib/version.ts` + `public/sw.js` + README cutover for user-visible changes.

## What the human wants from YOU (GPT)

Produce **only**:

### 1. Executive summary (5 bullets)

### 2. Next 2–3 hours — 2 or 3 batches

### 3. Backlog (ranked, top 8)

### 4. What NOT to do this week

## Planning rules

- Prefer **study path** (lessons, mistake log, deadlines) over new diagnostic features.
- Each batch mergeable alone; no 500-line refactors.
- Optional GPT/OpenRouter: post-action, local key only.
- Do not plan editing `.cursor/plans/` markdown.

---

**End of handoff. GPT: output the 4 sections above.**
