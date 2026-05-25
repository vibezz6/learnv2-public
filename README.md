# Learn v2

Personal learning OS — redesign of [Learn-v1](https://github.com/dishwashersol/LearnApp).

**Current release:** v2.3.55 · **Cutover tag:** v2.0.0 · **Daily driver:** `~/liqui/projects/learnv2` (`npm run dev` → http://127.0.0.1:8080) · **Live (GitHub Pages):** https://dishwashersol.github.io/learnv2/ · **Repo:** https://github.com/dishwashersol/learnv2

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
- Tailwind CSS v4 · warm dark design tokens
- React Router v7 · shareable lesson URLs
- Zustand + persist · localStorage-first, no accounts
- KaTeX · PWA (manifest + service worker)

## Features

**Core loop**

- **Today** — daily goal, study intent, continue (lesson/notes/quiz), week plan, essays due, spaced review, daily challenge
- **11 subjects** — responsive skill-tree navigation with prerequisites, XP, and completion tracking
- **SAT Prep** — 80-lesson Digital SAT path (gap drills st76–st80, mistake log, in-app Draft 1/2/3 diagnostic, Bluebook checkpoints) with **August SAT Track**
- **Lessons** — worked examples, curated resources, takeaways, quizzes with resume/retry, KaTeX math
- **SRS review** — spaced repetition queue with due-date scheduling
- **Tracks** — guided learning paths across subjects
- **Quizzes** — per-lesson recall with in-progress state persisted locally

**Second brain**

- **Office hours (notes)** — session notes → TA feedback → recall check-in; works offline without an API key, richer with OpenRouter in Settings
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
| Lessons (nodes) | **326** |
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
```

If the app is dead locally, nothing is listening on 8080 — run `npm run dev` in this directory (or `npm run preview:live` after a build).

**GitHub Pages** deploys on push to `main` (`.github/workflows/deploy-pages.yml`). Enable **Settings → Pages → GitHub Actions** once. Public URL: https://dishwashersol.github.io/learnv2/ (separate localStorage from localhost).

```bash
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
| 8 Admissions ship (27) | ✅ **v2.0.14** — transcript + weekly deadline strip |
| 9 Nudge snooze (28) | ✅ **v2.0.15** — dismiss reminders for 7 days |
| 10 Stats admissions preview (29) | ✅ **v2.0.16** — preview college block before copy |
| 11 Office hours copy (30) | ✅ **v2.0.17** — notes flow labels and offline clarity |
| 12 Settings admissions (31) | ✅ **v2.0.18** — export JSON, restore snoozed nudges |
| 13 Admissions import/reset (32) | ✅ **v2.0.19** — import JSON, clear all admissions data |
| 14 Campus focus in settings (33) | ✅ **v2.0.20** — change placement without replaying onboarding |
| 15 College hub on campus (34) | ✅ **v2.0.21** — admissions summary on `/campus`, focus/backup deep links |
| 16 PWA + chunks (36) | ✅ **v2.0.22** — update reload banner, route lazy-load, vendor split (tagged) |
| 17 Command palette campus (37) | ✅ **v2.0.23** — ⌘K shortcuts for checklist, essays, focus, lab |
| 18 SAT Draft 1 pretest (38) | ✅ **v2.0.24** — in-app diagnostic, rationale, export for Cursor |
| 19 SAT polish + Draft 2 (39) | ✅ **v2.0.25** — dashboard SAT card, ⌘K SAT shortcuts, Draft 2 gaps + import |
| 20 Tomorrow tasks + transcript SAT (40) | ✅ **v2.0.26** — up to 3 dashboard tasks without finishing Draft 1; transcript SAT diagnostic block |
| 21 Gap lessons + diagnostic reset (41) | ✅ **v2.0.27** — recommended SAT lessons from Draft 1 misses or track; settings clear diagnostic |
| 22 Campus deadlines + ⌘K SAT picks (42) | ✅ **v2.0.28** — urgent deadline chip on campus home; ⌘K opens recommended SAT lesson |
| 23 Tomorrow overdue + SAT picks polish (43) | ✅ **v2.0.29** — overdue in tomorrow tasks; gap lesson labels; ⌘K college deadlines |
| 24 Cursor analysis handoff (44) | ✅ **v2.0.30** — Cursor prompt + response template; spec for import JSON shape |
| 25 Unified Cursor import (45) | ✅ **v2.0.31** — Draft 2 + lesson plan import; recommended lessons prefer plan |
| 26 Pretest to mistake log (46) | ✅ **v2.0.32** — log diagnostic misses to SAT mistake log from results |
| 27 Gap lesson manifest (47) | ✅ **v2.0.33** — proposed vs existing nodes from imported lesson plan |
| 28 Narrow gap curriculum (48) | ✅ **v2.0.34** — five targeted SAT prep nodes (st76–st80) on August track |
| 29 Sleep readiness micro (49) | ✅ **v2.0.35** — local test-week check-in and nudge on campus home |
| 30 OpenRouter pretest review (50) | ✅ **v2.0.36** — optional AI rationale review on diagnostic misses |
| 31 Draft 3 retest cycle (51) | ✅ **v2.0.36** — third diagnostic tab with Draft 1 comparison |
| 32 Tomorrow + SAT hub (52–53) | ✅ **v2.0.36** — pretest-aware tomorrow tasks; dashboard SAT week card |
| 33 Real study loop (54) | ✅ **v2.0.37** — SAT today command card; mistake triage; practice session log; college blocking item; diagnostics demoted after Draft 1 |
| 34 Pretest export restore (55) | ✅ **v2.0.38** — restore diagnostic attempt from downloaded export JSON in Settings |
| 35 Transcript + docs sync (56) | ✅ **v2.0.39** — Draft 3 retest line on study transcript; README lesson count 326 |
| 36 SAT dashboard polish (57) | ✅ **v2.0.40** — persist Cursor Draft 2 imports; hide duplicate SAT block on campus home when SAT today shows |
| 37 Study-first dashboard copy (58) | ✅ **v2.0.41** — optional diagnostic wording on SAT today, tomorrow tasks, daily study command |
| 38 Study-first SAT hub copy (59) | ✅ **v2.0.42** — optional baseline wording on recommended lessons and official resources cards |
| 39 Study-first command palette copy (60) | ✅ **v2.0.43** — optional baseline wording on SAT pretest and recommended-lessons shortcuts |
| 40 Study-first pretest + settings copy (61) | ✅ **v2.0.44** — optional baseline on pretest page header/StartCard; diagnostic backup in Settings |
| 41 SAT study forms mobile (62) | ✅ **v2.0.45** — 44px touch targets on mistake log and official practice forms |
| 42 Page chrome + nav copy (63) | ✅ **v2.0.46** — PageContainer, PageHeader, Section primitives; sidebar/mobile “Today”; drop Neural Utopia / IQ maxxing topbar copy |
| 43 Dashboard condense (64) | ✅ **v2.1.0** — Today → focus → This week → review → challenge; WeekPlanCard; demote stats toys off `/` |
| 44 Dashboard white-screen fix (65) | ✅ **v2.1.1** — WeekPlanCard no longer passes `undefined` into admissions loaders (crashed `/`) |
| 45 Route page chrome (66) | ✅ **v2.1.2** — PageContainer + PageHeader on Review, Saved, Stats, Settings, Campus tools, subjects/tracks, college, SAT pretest, lessons, notes, quiz |
| 46 Stats-only analytics (67) | ✅ **v2.1.3** — heatmap, quiz scores, math visualizations live on `/stats` only; removed dead dashboard widgets |
| 47 Campus hub + SAT pretest IA (68) | ✅ **v2.1.4** — `/campus` sections (college + study/labs); pretest via SAT Prep `#diagnostic` + ⌘K only; voice cleanup |
| 48 Post-IA polish (69) | ✅ **v2.1.5** — SAT Prep `#diagnostic` scroll; slimmer SAT hub card; `docs/ui-ia-cutover.md`; ⌘K SAT section |
| 49 Desktop nav + ⌘K (70) | ✅ **v2.2.0** — sidebar doc truth; Trading Lab via Campus only; ⌘K Today + Saved |
| 50 Focus mode routes (71) | ✅ **v2.2.1** — FocusShell on notes, quiz, SAT pretest; FocusStudyBar |
| 51 Today Section blocks (72) | ✅ **v2.2.2** — This week, spaced review, daily challenge use Section |
| 52 PageLoading skeletons (73) | ✅ **v2.2.3** — PageLoading + route/dashboard/lesson loading states |
| 53 EmptyState Saved/Review (74) | ✅ **v2.2.4** — shared EmptyState on Saved and Review |
| 54 Quiz keyboard a11y (75) | ✅ **v2.2.5** — radiogroup, arrow keys, aria-live feedback |
| 55 Section rollout (76) | ✅ **v2.2.6** — Section on Review, SAT hub, college, tracks, timer, lab |
| 56 Activity ledger (77) | ✅ **v2.3.0** — `studyActivity.ts` local timeline + tests + `ACTIVITY_UPDATED_EVENT` |
| 57 Activity writers (78) | ✅ **v2.3.1** — record at progress, notes, SAT, timer mutation sites |
| 58 Activity consumers (79) | ✅ **v2.3.2** — Today recent strip, Stats list, transcript bullets, Settings debug log |
| 59 Smart routing (80) | ✅ **v2.3.3** — `getContinueTarget` + SAT today use activity timestamps |
| 60 Merge + smoke (81) | ✅ **v2.3.4** — activity ledger on `main`; post-ledger QA gate |
| 61 Activity quality (82) | ✅ **v2.3.5** — debounced notes activity; week plan uses today’s notes |
| 62 Quiz continue (83) | ✅ **v2.3.6** — resume in-progress quiz in `getContinueTarget` |
| 63 Backup truth (84) | ✅ **v2.3.7** — export docs + test for `learnv2_activity_v1` |
| 64 Daily intent (85) | ✅ **v2.3.8** — `studyIntent.ts` + Today focus chips |
| 65 Read APIs (86) | ✅ **v2.3.9** — `getTodayStudySummary`, `getWeekActivityMix` |
| 66 Storage health (87) | ✅ **v2.3.10** — Settings storage health table |
| 67 Boot prune (88) | ✅ **v2.3.11** — orphan quiz keys, stale pretest cleanup |
| 68 Backup v3 (89) | ✅ **v2.3.12** — export v3 + import report |
| 69 Data events (90) | ✅ **v2.3.13** — `DATA_UPDATED_EVENT` bus |
| 70 Day narrative (91) | ✅ **v2.3.14** — Today headline from activity summary |
| 71 Week plan v2 (92) | ✅ **v2.3.15** — intent + SAT mistake row in week plan |
| 72 Continue variants (93) | ✅ **v2.3.16** — lesson / notes / quiz hero labels + links |
| 73 Empty Today (94) | ✅ **v2.3.17** — rotating empty-state CTAs |
| 74 Tomorrow v2 (95) | ✅ **v2.3.18** — tomorrow tasks from activity log |
| 75 Lesson rail (96) | ✅ **v2.3.19** — time-on-lesson in next-step footer |
| 76 Quiz context (97) | ✅ **v2.3.20** — dismissible why-it-matters intro |
| 77 Quiz moment (98) | ✅ **v2.3.21** — score screen + notes/review links |
| 78 Review cards (99) | ✅ **v2.3.22** — activity on card, keys 1–4 |
| 79 Review copy (100) | ✅ **v2.3.23** — forgot interval consequence |
| 80 Notes autosave (101) | ✅ **v2.3.24** — saved indicator on office hours |
| 81 Notes diff (102) | ✅ **v2.3.55** — your notes panel on TA review step |
| 82 Mentor export (103) | ✅ **v2.3.32** — copy recall check-in as markdown |
| 83 Notes stepper (104) | ✅ **v2.3.33** — editor → review → mentor flow nav |
| 84 Mistake drill (105) | ✅ existing — SAT mistake → lesson links |
| 85 SAT practice rhythm (106) | ✅ **v2.3.34** — weekly practice log on SAT Prep |
| 86 Readiness copy (107) | — existing readiness surfaces |
| 87 Pretest Monday (108) | — existing week plan + pretest flow |
| 88 Essay on Today (109) | ✅ **v2.3.34** — essays due soon strip |
| 89 ⌘K college (110) | ✅ **v2.3.34** — deadline counts + recent activity jumps |
| 90 Campus pulse (111) | ✅ existing — admissions hub blocking row |
| 91 Week in review (112) | ✅ **v2.3.35** — Stats paragraph from activity + minutes |
| 92 Heatmap filter (113) | ✅ **v2.3.36** — calendar day filters recent activity |
| 93 Activity milestones (114) | ✅ **v2.3.37** — ledger milestone toasts |
| 94 Level-up modal (115) | ✅ **v2.3.38** — level-up modal separate from achievement toast |
| 95 Subject chrome (116) | ✅ **v2.3.39** — quiz/review accent from subject color |
| 96 Motion + route fade (117) | ✅ **v2.3.40** — motion tokens, route page transition |
| 97 EmptyState audit (118) | ✅ **v2.3.41** — Stats empty uses shared EmptyState |
| 98 Sidebar labels (119) | ✅ **v2.3.42** — desktop nav hints (title/aria) |
| 99 ⌘K recent actions (120) | ✅ **v2.3.43** — persisted recent command jumps |
| 100 Focus bar elapsed (121) | ✅ **v2.3.44** — FocusStudyBar subject + elapsed time |
| 106 Lazy Stats widgets (122) | ✅ **v2.3.50** — QuizMastery + MathInspired lazy-loaded |
| 107 Defer KaTeX (123) | ✅ **v2.3.51** — display math loads on scroll into view |
| 108 Curriculum lint (124) | ✅ **v2.3.52** — `npm run curriculum:lint` |
| 109 SAT gap nodes (125) | ✅ existing — st76–st80 in sat-prep.json |
| 110 Playwright smoke (126) | ✅ **v2.3.54** — Today + Stats e2e via `npm run test:e2e` |
| 111 DAG examples (127) | ✅ **v2.3.55** — `examples/learnv2-wave1.json` + Pages deploy |

**College admissions arc (batches 24–34):** complete for daily-driver use — checklist, essays, nudges, transcript, settings backup, placement.

UI/IA summary: `docs/ui-ia-cutover.md` · Full roadmap: `~/cursor/LEARN-V2-PLAN.md`
