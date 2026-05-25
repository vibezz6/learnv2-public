# Learn v2 — DAG batch waves (5 per wave)

Operational map for the [52-batch roadmap](file:///Users/clawbot/.cursor/plans/learn_v2_50-batch_roadmap_862ebb64.plan.md). **Do not edit the plan file** — update this doc when wave boundaries change.

## Rules

- **One wave = up to 5 batches** (Wave 0 is 1 batch: merge/smoke).
- **One batch = one version bump** (`src/lib/version.ts`, `package.json`, `public/sw.js`), tests, README cutover row.
- **DAG rank inside a wave:** group batches that touch **different files** in the same rank; never two writers on `progress.ts`, `weekPlan.ts`, or `DashboardPage.tsx` in one rank.
- **Gate:** `npm run test && npm run build` at end of each wave before starting the next.

## Wave overview

| Wave | Batches | Target version | Theme |
|------|---------|----------------|--------|
| 0 | 60 | v2.3.4 | Ship ledger on `main`, post-ledger smoke |
| 1 | 61–65 | v2.3.9 | Local backend A — activity, continue, backup, intent, read APIs |
| 2 | 66–70 | v2.3.14 | Local backend B + Today narrative — health, prune, export v3, events, day line |
| 3 | 71–75 | v2.3.19 | Today + lesson — week plan, continue hero, empty Today, tomorrow, lesson rail |
| 4 | 76–80 | v2.3.24 | Quiz + review + notes autosave |
| 5 | 81–85 | v2.3.29 | Notes depth + SAT rhythm start |
| 6 | 86–90 | v2.3.34 | SAT + college surfaces |
| 7 | 91–95 | v2.3.39 | Stats delight + subject chrome |
| 8 | 96–100 | v2.3.44 | UI chrome — motion, empties, nav, ⌘K, focus bar |
| 9 | 101–105 | v2.3.49 | Mobile + reliability |
| 10 | 106–110 | v2.3.54 | Perf + curriculum lint + E2E |
| 11 | 111 | v2.3.55 | DAG examples + this doc maintenance |

---

## Wave 0 — Ship (batch 60)

| Batch | Deliverable |
|-------|-------------|
| 60 | Merge `cursor/study-activity-ledger-v2.3.3` → `main`; checklist in `docs/qa-2026-05.md` |

**DAG:** single task.

---

## Wave 1 — Batches 61–65 (local backend A)

| Batch | Ver | Focus | Main files |
|-------|-----|-------|------------|
| 61 | v2.3.5 | Debounce `notes_updated`; week plan uses **today** via `listActivitiesForDate` | `noteSessions.ts`, `weekPlan.ts` |
| 62 | v2.3.6 | Quiz-in-progress in `getContinueTarget` | `progress.ts`, `quizProgress.ts` |
| 63 | v2.3.7 | Backup copy + tests for `learnv2_activity_v1` | `SettingsPage.tsx`, `progress.ts` export |
| 64 | v2.3.8 | `studyIntent.ts` — SAT / college / catch-up | `studyIntent.ts`, `DashboardPage.tsx` |
| 65 | v2.3.9 | `getTodayStudySummary()`, `getWeekActivityMix()` | `studyActivity.ts` |

**Suggested DAG ranks:**

1. 61 + 63 (different files) — serialize 61 before 62 if both touch routing later  
2. 62 alone (`progress.ts`)  
3. 65 alone (APIs)  
4. 64 alone (`DashboardPage.tsx`)

---

## Wave 2 — Batches 66–70 (local backend B + Today line)

| Batch | Ver | Focus |
|-------|-----|-------|
| 66 | v2.3.10 | Settings storage health table |
| 67 | v2.3.11 | Boot-time prune (quiz orphans, stale pretest) |
| 68 | v2.3.12 | Backup export `version: 3` + import report |
| 69 | v2.3.13 | `dataSync.ts` unified `DATA_UPDATED_EVENT` |
| 70 | v2.3.14 | Today day narrative from summary API |

**Suggested DAG ranks:**

1. 66 + 67 + 68 (Settings vs lib vs boot — separate files)  
2. 69 alone (many store touchpoints)  
3. 70 alone (`DashboardPage.tsx`)

---

## Wave 3 — Batches 71–75 (Today + lesson)

| Batch | Ver | Focus |
|-------|-----|-------|
| 71 | v2.3.15 | Week plan v2 + intent/activity mix |
| 72 | v2.3.16 | ContinueHero variants (lesson / notes / quiz) |
| 73 | v2.3.17 | Rotating Empty Today CTAs |
| 74 | v2.3.18 | Tomorrow tasks from ledger + admissions |
| 75 | v2.3.19 | Lesson rail (time, complete, next chip) |

**Serialize:** 71 and 72 both affect Today — different files OK in rank 1; avoid 71 + 74 both editing `weekPlan.ts` / `tomorrowTasks.ts` same rank.

---

## Wave 4 — Batches 76–80

| 76 | Quiz intro (`whyItMatters`) |
| 77 | Quiz score moment |
| 78 | Review cards + activity label |
| 79 | SRS keyboard + copy |
| 80 | Notes autosave indicator |

---

## Wave 5 — Batches 81–85

| 81 | Notes review diff |
| 82 | Mentor markdown export |
| 83 | Office hours stepper |
| 84 | Mistake → gap lesson |
| 85 | SAT practice rhythm card |

---

## Wave 6 — Batches 86–90

| 86 | SAT daily copy + activity mix |
| 87 | Pretest Monday plan |
| 88 | Essay row on Today |
| 89 | ⌘K college shortcuts |
| 90 | Campus pulse hero |

---

## Wave 7 — Batches 91–95

| 91 | Stats week-in-review paragraph |
| 92 | Heatmap → activity filter |
| 93 | Activity milestone toasts |
| 94 | Level-up modal polish |
| 95 | Subject color chrome on lesson/quiz |

---

## Wave 8 — Batches 96–100

| 96 | Motion tokens + route fade |
| 97 | EmptyState audit |
| 98 | Sidebar / mobile nav labels |
| 99 | ⌘K recent actions |
| 100 | FocusStudyBar elapsed + subject |

---

## Wave 9 — Batches 101–105

| 101 | Mobile nav Campus + Saved |
| 102 | Subjects tree 480px |
| 103 | Touch target audit |
| 104 | Route error boundaries |
| 105 | PWA “what’s new” on update |

---

## Wave 10 — Batches 106–110

| 106 | Lazy-load heavy Stats widgets |
| 107 | Defer below-fold KaTeX |
| 108 | `npm run curriculum:lint` |
| 109 | SAT gap nodes JSON (if needed) |
| 110 | Playwright smoke (Today + activity) |

---

## Wave 11 — Batch 111

| 111 | `examples/learnv2-wave1.json` + keep this doc in sync |

---

## Current status

| Wave | Status |
|------|--------|
| 0 | ✅ v2.3.4 on `main` — ledger merged; browser smoke optional |
| 1 | ✅ v2.3.9 — batches 61–65 |
| 2 | ✅ v2.3.14 — batches 66–70 |
| 3 | ✅ v2.3.19 — batches 71–75 |
| 4 | ✅ v2.3.24 — batches 76–80 |
| 5–6 | ✅ v2.3.34 — batches 81–90 (81/86/87 deferred or pre-existing) |
| 7 | ✅ v2.3.39 — batches 91–95 (Stats delight + subject chrome) |
| 8 | ✅ v2.3.44 — batches 96–100 (motion, EmptyState, sidebar hints, ⌘K actions, focus bar) |
| 9 | Skipped — mobile daily driver unchanged |
| 10 | ✅ v2.3.54 — batches 106–110 (lazy Stats, defer KaTeX, curriculum lint, Playwright) |
| 11 | ✅ v2.3.55 — batch 111 + batch 81 notes diff; GitHub Pages deploy |

## Related

- UI/IA: `docs/ui-ia-cutover.md`
- QA: `docs/qa-2026-05.md`
- DAG runner: `~/.cursor/skills/dag-task-runner/SKILL.md`
