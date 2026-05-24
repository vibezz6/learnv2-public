# Learn v2

Personal learning OS — Neural Utopia redesign of [Learn-v1](https://github.com/dishwashersol/LearnApp).

**Current release:** v2.0.13 · **Cutover tag:** v2.0.0 · **Daily driver:** `~/liqui/projects/learnv2` (`npm run dev` → http://127.0.0.1:8080) · **Repo:** https://github.com/dishwashersol/learnv2

Learn-v2 is the active daily driver. Learn-v1 remains archived at `~/liqui/projects/Learn-v1` (tag `v1-final`) as a fallback and migration source.

### Local ports (with tradingv1 journal)

| Service | URL | Config |
|---------|-----|--------|
| **Learn v2** (this app) | http://127.0.0.1:8080 | `vite.config.ts` |
| **tradingv1 API** | http://127.0.0.1:8000 | `uvicorn … --port 8000` |
| **tradingv1 journal UI** | http://127.0.0.1:8081 | `tradingv1/web/vite.config.ts` |

Constants: `src/lib/devPorts.ts`. Trading Lab page links to the journal on **8081** and health-checks the API on **8000**.

## Stack

- React 19 + TypeScript + Vite 8
- Tailwind CSS v4 · Neural Utopia design tokens
- React Router v7 · shareable lesson URLs
- Zustand + persist · localStorage-first, no accounts
- KaTeX · PWA (manifest + service worker)

## Features

**Core loop**

- **Campus home** — enrolled track, weekly syllabus, SAT next step, review/timer/stats links
- **Neural Command Center** — continue learning, review queue, daily challenge, track recommendation
- **11 subjects** — responsive skill-tree navigation with prerequisites, XP, and completion tracking
- **SAT Prep** — 75-lesson Digital SAT path (st66+ round-4/5 drills, mistake log, Bluebook checkpoints) with **August SAT Track**
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
- **Campus services** (`/campus`) — college checklist, essay tracker, Trading Lab, calculators, SAT, algo lab
- **College checklist** — FAFSA, counselor, SAT send, custom deadlines (`/campus/college-checklist`)
- **Essay tracker** — Common App / supplement prompts, draft status, due dates (`/campus/essay-tracker`)
- **Placement onboarding** — SAT, foundations, or explore; enrolls default track on first run
- **Admissions nudges** — dashboard reminders for overdue essays and checklist steps
- **Study transcript** (Stats) — copy/download proof of study hours and progress
- **Tools** — compound interest and expected value calculators (`/campus/calculators`)
- **Achievements & sounds** — level-ups, toasts, optional audio
- **Themes** — dark, light, system
- **Export / import** — JSON backup of all `learnv2_*` and `learnapp_*` localStorage keys (OpenRouter API keys excluded)
- **Onboarding** — placement + track enrollment; links to Settings when v1 data is detected

**v1 parity**

- Full v1 → v2 migration (progress, SRS, notes, bookmarks, achievements, theme)
- Curriculum split script keeps JSON in sync with Learn-v1 source

## Curriculum

Audited 2026-05-23 via `node ~/cursor/scripts/audit-curriculum.mjs`:

| Metric | Count |
|--------|------:|
| Subjects | 11 |
| Lessons (nodes) | **321** |
| Quiz questions | **1,039** |
| Worked examples | **724** |
| Threshold flags | **110** (all SAT Prep — drill lessons, no worked examples by design) |

| Subject | Nodes | Quiz Qs | Worked Examples |
|---------|------:|--------:|----------------:|
| sat-prep | 75 | — | — |
| algo-lab | 8 | — | — |
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
npm run dev
# → http://127.0.0.1:8080 (port is in vite.config.ts — do not pass :8080 on the command line)

npm run build
npm run preview
npm run test
npm run test:watch
npm run lint
npm run curriculum:split
npm run version:bump
node ~/cursor/scripts/audit-curriculum.mjs
```

**Journal stack** (separate terminal, from `~/liqui/projects/tradingv1`):

```bash
npm run dev
# or: bash scripts/dev.sh
# → API http://127.0.0.1:8000 , UI http://127.0.0.1:8081
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
| 7 College admissions (24–26) | ✅ **v2.0.13** — placement, checklist, essays, nudges |

Full roadmap: `~/cursor/LEARN-V2-PLAN.md`
