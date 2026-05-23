# Learn v2

Personal learning OS — Neural Utopia redesign of [Learn-v1](https://github.com/dishwashersol/LearnApp).

**Current release:** v2.0.8 · **Cutover tag:** v2.0.0 · **Daily driver:** `~/liqui/projects/learnv2` (`npm run dev` → http://127.0.0.1:8080) · **Repo:** https://github.com/dishwashersol/learnv2

Learn-v2 is the active daily driver. Learn-v1 remains archived at `~/liqui/projects/Learn-v1` (tag `v1-final`) as a fallback and migration source. Post-cutover patches **v2.0.1–v2.0.8** shipped UI polish, v1 migration hardening, **SAT Prep** (55-lesson subject + August SAT track), full localStorage backup export, and continue-learning SAT priority.

## Stack

- React 19 + TypeScript + Vite 8
- Tailwind CSS v4 · Neural Utopia design tokens
- React Router v7 · shareable lesson URLs
- Zustand + persist · localStorage-first, no accounts
- KaTeX · PWA (manifest + service worker)

## Features

**Core loop**

- **Neural Command Center** — continue learning, review queue, daily challenge, track recommendation
- **10 subjects** — responsive skill-tree navigation with prerequisites, XP, and completion tracking
- **SAT Prep** — 55-lesson Digital SAT path (Math + R&W drills, Bluebook checkpoints, test-week plan) with **August SAT Track**
- **Lessons** — worked examples, curated resources, takeaways, quizzes with resume/retry, KaTeX math
- **SRS review** — spaced repetition queue with due-date scheduling
- **Tracks** — guided learning paths across subjects
- **Quizzes** — per-lesson recall with in-progress state persisted locally

**Second brain**

- **Notes 2.0** — gated Write → Review → Mentor flow with guided prompts, AI review (OpenRouter), mentor Q&A quiz
- **Bookmarks** — save lessons and individual resources
- **Command palette** — `⌘K` / `Ctrl+K` fuzzy search with grouped results and persisted recents

**Focus & polish**

- **Mobile-first layout** — 480px polish on dashboard, lessons, quiz, review, and notes
- **Deep focus mode** — `F` hides chrome for distraction-free study
- **Study timer** — timed sessions with summary
- **Review & stats** — SRS spotlight cards, level/streak hero, 7-day study chart, achievement unlocks
- **Tools** — compound interest and expected value calculators
- **Achievements & sounds** — level-ups, toasts, optional audio
- **Themes** — dark, light, system
- **Export / import** — JSON backup of all `learnv2_*` and `learnapp_*` localStorage keys (OpenRouter API keys excluded)
- **Onboarding** — first-run walkthrough; links to Settings when v1 data is detected

**v1 parity**

- Full v1 → v2 migration (progress, SRS, notes, bookmarks, achievements, theme)
- Curriculum split script keeps JSON in sync with Learn-v1 source

## Curriculum

Audited 2026-05-23 via `node ~/cursor/scripts/audit-curriculum.mjs`:

| Metric | Count |
|--------|------:|
| Subjects | 10 |
| Lessons (nodes) | **293** |
| Quiz questions | **1,039** |
| Worked examples | **724** |
| Threshold flags | **110** (all SAT Prep — drill lessons, no worked examples by design) |

| Subject | Nodes | Quiz Qs | Worked Examples |
|---------|------:|--------:|----------------:|
| sat-prep | 55 | 98 | 0 |
| math | 55 | 234 | 169 |
| cs | 40 | 136 | 122 |
| trading | 38 | 168 | 115 |
| science | 33 | 121 | 99 |
| ai | 27 | 110 | 81 |
| programming | 16 | 65 | 49 |
| probability | 13 | 46 | 40 |
| finance | 11 | 45 | 34 |
| engineering | 5 | 16 | 15 |

Re-sync from v1: `npm run curriculum:split` (reads `Learn-v1/src/data/curriculums.ts`, writes `src/curriculum/data/*.json`). SAT Prep lives in `src/curriculum/data/sat-prep.json` only (not synced from v1).

## Dev

```bash
npm install
npm run dev              # http://127.0.0.1:8080 (vite.config.ts port 8080)
npm run build
npm run preview
npm run test             # 75 unit tests (vitest)
npm run test:watch
npm run lint
npm run curriculum:split # re-sync JSON from Learn-v1
npm run version:bump     # patch: 2.0.x → 2.0.99 → 2.1.0
node ~/cursor/scripts/audit-curriculum.mjs
```

## Migrate from v1

Use the **same browser** where Learn-v1 stored your progress (localStorage is origin-scoped). Run v2 on the same origin you used for v1 if possible (`http://127.0.0.1:8080`).

1. **Recommended — full migration:** Open v2 → **Settings** → **Run full v1 migration**
   - Imports progress + SRS schedules (normalized on import; invalid SRS dates flagged)
   - Merges legacy v1 notes and lesson takeaways into Notes 2.0
   - Copies resource/lesson bookmarks, achievements, and theme when present (existing v2 theme is preserved)
   - Reloads UI after import so migrated state is visible immediately
2. **On first launch:** onboarding detects v1 data and links to Settings for full migration
3. **Progress only:** Settings → **Import progress only** (reads `learnapp_progress_v1`)
4. **Manual backup:** Export JSON from v1 Settings → Import from file in v2 Settings

Key mapping and schema details: `~/cursor/audits/localStorage-schema-v1.md`

After migration, confirm SRS due dates and note sessions look correct before relying on v2 exclusively.

## Cutover status

| Batch | Status |
|-------|--------|
| 1 Foundation | ✅ |
| 2 Core loop | ✅ |
| 3 Second brain | ✅ |
| 4 Parity | ✅ |
| 5 Cutover | ✅ **v2.0.0** (tagged) |
| 6 Post-cutover polish | ✅ **v2.0.8** (daily driver) |

Full roadmap: `~/cursor/LEARN-V2-PLAN.md`
