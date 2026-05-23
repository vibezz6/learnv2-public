# Learn v2

Personal learning OS — Neural Utopia redesign of [Learn-v1](https://github.com/dishwashersol/LearnApp).

**Cutover release:** v2.0.0 (tagged) · **Daily driver:** `~/liqui/projects/learnv2` · **Repo:** https://github.com/dishwashersol/learnv2

Learn-v2 is the active app. Learn-v1 remains archived at `~/liqui/projects/Learn-v1` (tag `v1-final`) as a fallback and migration source.

## Stack

- React 19 + TypeScript + Vite 8
- Tailwind CSS v4 · Neural Utopia design tokens
- React Router v7 · shareable lesson URLs
- Zustand + persist · localStorage-first, no accounts
- KaTeX · PWA (manifest + service worker)

## Features

**Core loop**

- **Neural Command Center** — continue learning, review queue, daily challenge, track recommendation
- **9 subjects** — skill-tree navigation with prerequisites, XP, and completion tracking
- **Lessons** — worked examples, curated resources, quizzes with resume/retry, KaTeX math
- **SRS review** — spaced repetition queue with due-date scheduling
- **Tracks** — guided learning paths across subjects
- **Quizzes** — per-lesson recall with in-progress state persisted locally

**Second brain**

- **Notes 2.0** — guided prompts per subject, AI review (OpenRouter), mentor Q&A quiz
- **Bookmarks** — save lessons and individual resources
- **Command palette** — `⌘K` / `Ctrl+K` fuzzy search across lessons and navigation

**Focus & polish**

- **Deep focus mode** — `F` hides chrome for distraction-free study
- **Study timer** — timed sessions with summary
- **Stats** — progress charts, streaks, mastery metrics
- **Tools** — compound interest and expected value calculators
- **Achievements & sounds** — level-ups, toasts, optional audio
- **Themes** — dark, light, system
- **Export / import** — full JSON backup of progress and settings
- **Onboarding** — first-run walkthrough

**v1 parity**

- Full v1 → v2 migration (progress, SRS, notes, bookmarks, theme)
- Curriculum split script keeps JSON in sync with Learn-v1 source

## Curriculum

Audited 2026-05-22 via `node ~/cursor/scripts/audit-curriculum.mjs`:

| Metric | Count |
|--------|------:|
| Subjects | 9 |
| Lessons (nodes) | **238** |
| Quiz questions | **941** |
| Worked examples | **724** |
| Threshold flags | **0** (all nodes ≥3 quiz Qs and ≥3 worked examples) |

| Subject | Nodes | Quiz Qs | Worked Examples |
|---------|------:|--------:|----------------:|
| math | 55 | 234 | 169 |
| cs | 40 | 136 | 122 |
| trading | 38 | 168 | 115 |
| science | 33 | 121 | 99 |
| ai | 27 | 110 | 81 |
| programming | 16 | 65 | 49 |
| probability | 13 | 46 | 40 |
| finance | 11 | 45 | 34 |
| engineering | 5 | 16 | 15 |

Re-sync from v1: `npm run curriculum:split` (reads `Learn-v1/src/data/curriculums.ts`, writes `src/curriculum/data/*.json`).

## Dev

```bash
npm install
npm run dev              # http://127.0.0.1:8080
npm run build
npm run preview
npm run test             # 50 unit tests (vitest)
npm run test:watch
npm run lint
npm run curriculum:split # re-sync JSON from Learn-v1
npm run version:bump     # patch: 2.0.x → 2.0.99 → 2.1.0
node ~/cursor/scripts/audit-curriculum.mjs
```

## Migrate from v1

Use the **same browser** where Learn-v1 stored your progress (localStorage is origin-scoped).

1. **Recommended — full migration:** Open v2 → **Settings** → **Run full v1 migration**
   - Imports progress + SRS schedules
   - Merges legacy v1 notes into Notes 2.0
   - Copies resource/lesson bookmarks and theme when present
2. **Progress only:** Settings → **Import progress only** (reads `learnapp_progress_v1`)
3. **Manual backup:** Export JSON from v1 Settings → Import from file in v2 Settings

Key mapping and schema details: `~/cursor/audits/localStorage-schema-v1.md`

After migration, confirm SRS due dates and note sessions look correct before relying on v2 exclusively.

## Cutover status

| Batch | Status |
|-------|--------|
| 1 Foundation | ✅ |
| 2 Core loop | ✅ |
| 3 Second brain | ✅ |
| 4 Parity | ✅ |
| 5 Cutover | ✅ **v2.0.0** |

Full roadmap: `~/cursor/LEARN-V2-PLAN.md`
