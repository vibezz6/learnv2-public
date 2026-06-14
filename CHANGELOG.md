# Changelog

All notable changes to Learn v2 are documented here. Version numbers match `package.json`, `src/lib/version.ts`, and the PWA service worker cache name.

## [Unreleased]

## [2.12.3] - 2026-06-14

### Fixed

- Public profile no longer leaks SAT/college copy in Today empty states, week plan subtitles/CTAs, stats recommendations, or reminder notifications.

## [2.12.2] - 2026-06-14

### Added

- **`VITE_APP_PROFILE=public`** — public/Vercel builds expose only math, CS, and probability subjects plus the Complete Foundation track.

### Changed

- Public deploy removes remaining SAT UI leaks (status bar countdown, Today minimum strip), all college/campus surfaces, and non-foundation subjects/tracks.

## [2.12.1] - 2026-06-14

### Added

- **Simple mode** (`Settings → Interface`) — calmer Today, SAT, and College views with one clear next step; Full mode restores all cards and navigation.
- New users default to Simple mode; existing users stay on Full until they opt in.

### Changed

- Onboarding finishes on **Go to Today** with shorter copy.
- Review priority no longer duplicates the spaced-review sidebar card.

## [2.12.0] - 2026-05-30

### Added

- **Study intent picker** on Today (`StudyIntentPicker`) with same-tab refresh via `STUDY_INTENT_UPDATED_EVENT`.
- Week plan **catch-up intent**: `prioritizeCatchUp` + optional `continueLesson` row before track filler.
- Intent-aware **week plan subtitle** and empty-state CTAs (Campus, continue lesson, SAT drill/Daily 5).
- ⌘K **Focus today** actions (Balanced / SAT / College / Catch up) with active-intent description.
- Playwright **`e2e/b99-o.spec.ts`**: picker, college week-plan row, catch-up continue, palette shortcut.

## [2.11.0] - 2026-05-30

### Added

- Draft 3 **Snooze 24h** on SAT diagnostic section; **completion summary** with delta vs baseline.
- Study intent **college** boosts package/essay rows in week plan before track filler.
- ⌘K **Draft 3 retest** when hub nudge is eligible.
- Playwright **`e2e/b93-n.spec.ts`**: essay badge, good-shape streak, Draft 3 snooze, palette navigation.

## [2.10.0] - 2026-05-30

### Added

- **Draft 3 retest nudge** on SAT hub (`satDraft3Nudge.ts`) with `?draft=draft-3` deep link.
- Campus school card **essay final ratio** badge (`getEssayProgressForCollege`).
- Good-shape Today hero **streak support line**.
- Playwright **`e2e/b87-m.spec.ts`**: college session-complete, post-SAT suppress, Draft 3 hub.

### Changed

- PWA update banner shows current version; Settings note on reload-after-banner updates.

## [2.9.0] - 2026-05-30

### Added

- **Drill cooldown rows** on SAT hub (`getDrillCooldownRows`) plus Today hint when the top skill is cooling.
- **Submitted application** banner on package; hides do-this-first; college **session-complete** next-steps.
- **Post-SAT** suppresses drill Today card and post–Daily-5 hero overlays when test date has passed.
- Playwright **`e2e/b81-l.spec.ts`**: import confirm, submitted package, cooldown UI, good-shape hero, archive toggle.
- Settings: persistent last-backup line; **storage parse errors** warning above storage health details.

### Changed

- [`collegeFocus.ts`](src/lib/collegeFocus.ts) for campus session-complete routing.

## [2.8.0] - 2026-05-30

### Added

- **Today hero overlays** after Daily 5 — drill-next and “good shape” modes (`todayHero.ts`); SAT **session-complete** next-steps (mistake log, top drill).
- Package **inline essay status**; college **submitted** / **archived** with Campus toggle.
- **`readJsonSafe`** with FIFO `learnv2_storage_errors_v1` log; Settings **storage read errors** panel.
- **Import overwrite** confirmation (checkbox + key list) for full backup and admissions import.
- SAT hub **mastery ↔ drill** cross-links; stats mistake bars **click-to-drill**.
- Playwright **`e2e/b74-k.spec.ts`** — college block, Daily 5 footnote, print summary, ⌘K mistake, backup export.

### Changed

- Subject SAT hero uses **Settings SAT date** (`getSatCountdown`) — no hardcoded August 2026.
- Week plan empty state CTA when caught up (Daily 5 or drill).
- Essay **final** toast; package checklist **Saved** banner.

## [2.7.3] - 2026-05-31

### Added

- **College-aware Today hero** — blocking admissions rows include registry deadlines; package CTA when a school is known (`collegeName`, `blockerKind`).
- Registry **notes** field (ED/EA/RD copy-only) on Campus schools, application package, and week plan.
- **Drill queue Today card** — secondary nudge when college is not blocking within 7 days; 24h snooze.
- Daily 5 **2× soft weight** toward top-3 drill-queue skills (deterministic per day).
- **Print summary** at `/campus/print-summary` (`window.print`, no PDF library).
- Essay tracker **hash links** (`#essay-<id>`) from application package cards.

### Changed

- a11y pass on application package, Campus schools, drill Today card, print summary, and stats mistake bars.

## [2.7.2] - 2026-05-31

### Added

- Campus **Application package** page (`/campus/application?college=…`) — per-college essays, shared checklist preview, do-this-first, deadline ladder.
- **College schools registry** (`learnv2_colleges_v1`) — Campus grid, import from essays, deadlines wired into package view.
- Week plan college rows link to application package (max 3; “+N more in Campus”).
- SAT **drill queue** by skill with 48h mark-drilled cooldown (`drilledAt` on mistake entries).
- **Lock tooltips** on skill tree and track lessons (`lockRules.ts`).
- Command palette: log mistake, start focus session, open package per school.
- Stats: top mistake category bars and 14-day study minutes chart.
- [`docs/anything-planner-prompt.md`](docs/anything-planner-prompt.md) and [`docs/anything-ui-iteration.md`](docs/anything-ui-iteration.md) for Anything → Cursor batch workflow.

## [2.7.1] - 2026-05-31

### Added

- Today surfaces urgent college application work (`college_blocking`) ahead of optional SAT diagnostics.
- Post-complete follow-up on SAT gap/recommended lessons (mistake log, official practice, drill).
- Mistake log top categories show drill/lesson links and clearer empty-state copy.
- Unit test for drill question rotation; Playwright e2e for ⌘K → SAT Daily 5.

### Changed

- Tomorrow tasks prefer the single blocking admissions item when due within a week or overdue.

## [2.7.0] - 2026-05-31

### Added

- CI and `npm run doctor` run `curriculum:lint` and `sat:coverage:strict`.
- SAT question rotation history for drills and Daily 5 (`learnv2_sat_question_history_v1`).
- Stretch coverage report (`npm run sat:coverage:stretch`, target 8 MC per skill).
- Draft 3 retest with 24 unique stems ([`satPretestDraft3Extra.ts`](src/data/satPretestDraft3Extra.ts)).
- Command palette SAT shortcuts (Daily 5, drill weakest, mastery); Stats desktop drill CTAs.
- Mastery diagnostic % from latest baseline or Draft 3 retest.

### Changed

- Expanded SAT MC bank (+34 questions) so all teachable skills reach 8 MC.
- SAT hub / pretest copy emphasizes study-first workflow on desktop.

## [2.6.2] - 2026-05-31

### Added

- SAT skill coverage report (`npm run sat:coverage`, `npm run sat:coverage:strict`) and gap-drill lint rule (st76–st80 need ≥5 MC).
- Expanded SAT curriculum MC bank so every teachable skill has at least five questions; gap drills st76–st80 now have five items each.
- Pretest `skillId` on diagnostic questions; Draft 1 expanded to 24 items (12 math / 12 R&W); Draft 2 to 16; Draft 3 retest bank (24 unique ids).
- `MobileStudyStrip` on phones (streak, daily minimum, SAT countdown).
- Vercel Web Analytics and Speed Insights (production only) with study custom events.

### Changed

- Pretest skill breakdown merges by canonical `SatSkillId` instead of free-text labels only.

## [2.6.0] - 2026-05-30

### Added

- Canonical SAT skill taxonomy and skill-based Daily 5 / micro-drill matching.
- Skill mastery view on the SAT hub and drill-any-skill links (`/sat/drill?skill=`).
- App version on Today footer, Settings, and desktop status bar.
- Vercel deployment with SPA rewrites; removed broken GitHub Pages workflow.
