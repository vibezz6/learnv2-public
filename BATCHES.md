# Learn v2 — Improvement Batches

This is the control file for improving Learn v2 across many sessions. Open it at the
start of every working session. It tells you (or the agent) how to run the app, how to
confirm nothing is broken, exactly which batch to work next, and how to verify each one —
then you record progress so the next session picks up cleanly.

- Durability model: **local-only** (browser localStorage). No server, $0 ongoing. The
  safety net is disciplined export/import — see "Back up your data" below.
- Ordering: **reliability and data safety first**, then run/ops, testing, UI, then features.

---

## Current position

> **B01-B38 done + shipped to Vercel + SAT skill-matching feature added.** Last session: 2026-05-30
> Live: https://learnv2-tau.vercel.app (auto-deploys on every push to `main`). Green: 314 unit tests + 8 e2e, lint 0 warnings, tsc + build clean. Version **v2.6.0**.
> Next session: pick from "Future ideas" below, or open new batches as needed.

Update this line at the end of every session.

---

## How to use this file (session protocol)

1. Read this whole file top-to-bottom (it is short on purpose).
2. Run the **Health check** below. If anything fails, fix that first or log it under
   "Known issues" before starting new batches.
3. Find the first batch that is not `[x]` Done. Work forward from there (a typical session
   is ~10 batches, e.g. B01-B10).
4. For each batch: do the Steps, then run its **Verify** line. Only then mark it `[x]`.
5. Keep `npm run lint`, `npm test`, and `npm run build` green at all times. Never leave the
   tree broken between batches.
6. Update each batch's status box, update the **Current position** pointer, and append a
   **Session log** entry (date, batches done, anything notable/blocked).
7. Commit and push (one commit per session is fine: `batches: B01-B05 ...`).

To start a session you can just say: **"work on the next batches"** or **"do B11-B20"**.

---

## Run it yourself (no Cursor needed)

You never need Cursor to run or keep this app. Full details live in
[README.md](README.md#run-it-yourself-no-cursor-needed); the short version:

```bash
# Requires Node 20 or newer (Node 22 LTS recommended)
cd ~/liqui/projects/learnv2
npm install        # first time, or after pulling changes
npm run dev        # → open http://127.0.0.1:8080
```

- Production preview: `npm run build && npm run preview`.
- If the page is blank, nothing is listening on 8080 — re-run `npm run dev` in this folder.

## Back up your data (so you never lose progress)

All progress lives in this browser's localStorage for the origin you use (e.g.
`http://127.0.0.1:8080`). Clearing browser data, using a different browser, or a different
URL means different/empty data. To stay safe:

1. In the app: **Settings -> Backup -> Export progress** — saves `learnv2-backup-YYYY-MM-DD.json`.
2. Keep that file somewhere safe (cloud drive, repo-external folder). Export weekly.
3. To restore on any machine/browser: **Settings -> Import from file** and pick the JSON.

Backups cover every `learnv2_*` and `learnapp_*` key (OpenRouter API keys are excluded).

---

## Health check (run every session)

```bash
npm install      # ensure deps present (use `npm ci` for a clean install)
npm run lint     # expect 0 errors (a few exhaustive-deps warnings are pre-existing)
npm test         # expect all suites green
npm run build    # expect a clean production build
npm run dev      # smoke test http://127.0.0.1:8080, then stop
```

Optional: `npm run test:e2e` (Playwright) for end-to-end smoke.

## Status legend

- `[ ]` todo
- `[~]` in progress
- `[x]` done
- `[!]` blocked (explain in Known issues)

---

## Batches

### A. Reliability and data safety (do first)

- [x] **B01 — Storage write/quota hardening**
  - Why: localStorage writes can silently fail (quota, private mode); progress could vanish without warning.
  - Files: [src/lib/storageJson.ts](src/lib/storageJson.ts), [src/stores/progress.ts](src/stores/progress.ts) persist layer, [src/features/settings/widgets/StorageHealthPanel.tsx](src/features/settings/widgets/StorageHealthPanel.tsx).
  - Steps: detect failed writes / near-quota; expose a `storageOk` signal; show a clear in-app warning ("backup now") when writes fail; never throw on write.
  - Verify: add a unit test simulating a throwing `setItem`; app stays usable and surfaces a warning; `npm test` green.

- [x] **B02 — Schema versioning + safe load**
  - Why: a corrupt or future-shaped value should never white-screen the app.
  - Files: stores in [src/stores/](src/stores/), [src/lib/storageJson.ts](src/lib/storageJson.ts).
  - Steps: validate parsed shapes on load; on invalid data, fall back to defaults and quarantine the bad value (keep a `*_corrupt_backup` copy) instead of crashing.
  - Verify: tests feed malformed JSON to each store loader and assert safe defaults; no throw.

- [x] **B03 — Backup completeness + verified round-trip**
  - Why: a backup is only trustworthy if import restores exactly what export saved.
  - Files: [src/lib/backupFormat.ts](src/lib/backupFormat.ts), [src/lib/backupFormat.test.ts](src/lib/backupFormat.test.ts).
  - Steps: confirm all current `learnv2_*` keys are covered (preferences incl. `satTestDate`/`accountabilityLevel`, activity, SAT logs); exclude ephemeral keys (`learnv2_focus_session_v1`, `learnv2_reminders_fired_v1`); add an import "restored N / skipped M" self-check.
  - Verify: round-trip test (export -> clear -> import -> deep-equal) passes.

- [x] **B04 — Auto-backup nudge**
  - Why: people forget to export; a gentle reminder prevents catastrophic loss.
  - Files: new `src/lib/backupReminder.ts`, a small nudge in [src/features/dashboard/DashboardPage.tsx](src/features/dashboard/DashboardPage.tsx) or Settings.
  - Steps: track `lastBackupAt`; if older than N days, show a one-click "Export backup" nudge; record on export.
  - Verify: unit test for the "is backup overdue" logic; nudge renders when overdue.

- [x] **B05 — Error boundaries + recovery escape hatch**
  - Why: one component crash shouldn't lose the session or hide the data.
  - Files: [src/components/ComponentErrorBoundary.tsx](src/components/ComponentErrorBoundary.tsx), route mounts in [src/app/App.tsx](src/app/App.tsx).
  - Steps: ensure boundaries wrap routes/widgets; friendly fallback with "Reload" and "Export backup"; log the error locally.
  - Verify: a deliberately-throwing test component renders the fallback, not a white screen.

- [x] **B06 — Clean up synthetic SAT-quiz node pollution**
  - Why: Daily 5 / drill use synthetic node ids (`sat-daily-*`, `sat-drill-*`) that add junk entries to progress nodes + quiz-progress keys.
  - Files: [src/features/quiz/QuizPage.tsx](src/features/quiz/QuizPage.tsx), [src/features/quiz/quizProgress.ts](src/features/quiz/quizProgress.ts), [src/stores/progress.ts](src/stores/progress.ts), [src/lib/storagePrune.ts](src/lib/storagePrune.ts).
  - Steps: either route daily/drill completion through a non-node path, or prune `sat-daily-*`/`sat-drill-*` node + quizProgress keys on boot; ensure they never count toward completion stats.
  - Verify: after a Daily 5, `data.nodes` has no synthetic entry (or it is pruned); completion % unchanged; test added.

- [x] **B07 — Reminder reliability + honesty**
  - Why: notifications only fire while a tab is open; behavior must be predictable and de-duped.
  - Files: [src/lib/reminders.ts](src/lib/reminders.ts), [src/lib/serviceWorker.ts](src/lib/serviceWorker.ts), [src/features/settings/RemindersSettingsCard.tsx](src/features/settings/RemindersSettingsCard.tsx).
  - Steps: guard against duplicate scheduler init; show "fires only while a Learn v2 tab is open" + last-fired time in Settings; confirm `notificationclick` focuses an existing tab.
  - Verify: manual check (enable reminders, set time to now, confirm one fire + focus); add a test for the once-per-day guard.

- [x] **B08 — Date / timezone audit**
  - Why: streaks/minimum/daily keys use UTC; reminders use local time — risk of off-by-one near midnight.
  - Files: [src/stores/progress.ts](src/stores/progress.ts) (`getToday`), [src/lib/dailyMinimum.ts](src/lib/dailyMinimum.ts), [src/lib/reminders.ts](src/lib/reminders.ts), [src/lib/satCountdown.ts](src/lib/satCountdown.ts).
  - Steps: document the chosen convention; add tests crossing local midnight in a non-UTC timezone; fix any mismatch.
  - Verify: timezone-shifted tests pass for streak rollover and countdown.

- [x] **B09 — Tag completion activities with subjectId**
  - Why: `lesson_completed` / `quiz_completed` lack `subjectId`, so SAT-specific weekly stats are approximate.
  - Files: [src/stores/progress.ts](src/stores/progress.ts), [src/lib/studyActivity.ts](src/lib/studyActivity.ts), [src/lib/satWeeklyProgress.ts](src/lib/satWeeklyProgress.ts).
  - Steps: pass/record `subjectId` on completion events; use it in weekly SAT aggregation instead of the `sat-daily` id heuristic.
  - Verify: weekly SAT card counts SAT lessons/quizzes correctly; tests updated.

### B. Run-it-yourself / ops

- [x] **B10 — Beginner-proof README run + backup section**
  - Why: you must be able to run + protect the app with zero Cursor and minimal dev knowledge.
  - Files: [README.md](README.md).
  - Steps: expand the "Run it yourself" + "Back up your data" sections (install Node, exact commands, expected output, common failures, deploy + live URL note).
  - Verify: a fresh clone + the documented steps starts the app on 8080.

- [x] **B11 — Pin the runtime**
  - Why: it should still build years from now.
  - Files: [package.json](package.json) (`engines`), new `.nvmrc`.
  - Steps: add `"engines": { "node": ">=20" }` and `.nvmrc` (e.g. `22`); note it in README.
  - Verify: `npm install` warns on older Node; build works on the pinned version.

- [x] **B12 — `npm run doctor` one-shot health command**
  - Why: a single command to confirm the app is healthy each session.
  - Files: [package.json](package.json).
  - Steps: add `"doctor": "npm run lint && npm test && npm run build"`; reference it from the Health check above and `npm start`.
  - Verify: `npm run doctor` runs lint + test + build and exits 0.

- [x] **B13 — PWA / offline + update-flow verification**
  - Why: installable + offline + clean update banner are part of "always works".
  - Files: [public/sw.js](public/sw.js), [public/manifest.json](public/manifest.json), [src/lib/serviceWorker.ts](src/lib/serviceWorker.ts), [src/components/ServiceWorkerUpdateBanner.tsx](src/components/ServiceWorkerUpdateBanner.tsx).
  - Steps: verify install, offline load, and the SKIP_WAITING update flow on a production build; document install steps.
  - Verify: `npm run build && npm run preview`, install as PWA, go offline, app still loads.

- [x] **B14 — GitHub Pages deploy verification**
  - Why: a working public URL is a free backup of the running app.
  - Files: [.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml), [vite.config.ts](vite.config.ts) (base path).
  - Steps: confirm the workflow builds + deploys; verify base path + asset URLs; document the live URL has separate storage from localhost.
  - Verify: a push to `main` deploys; the live site loads with working assets.

### C. Testing and QA

- [x] **B15 — Unit tests for new logic**
  - Why: lock in the Phase 1-5 behavior.
  - Files: [src/stores/focusSession.ts](src/stores/focusSession.ts), [src/lib/satCountdown.ts](src/lib/satCountdown.ts), [src/lib/satWeeklyProgress.ts](src/lib/satWeeklyProgress.ts), [src/lib/reminders.ts](src/lib/reminders.ts).
  - Steps: add tests for focus-session start/finish/cancel + minute capping, countdown edge cases, weekly aggregation, reminder edges.
  - Verify: new tests pass; coverage of these modules is meaningful.

- [x] **B16 — Render/smoke tests for new UI**
  - Why: catch crashes in the new surfaces.
  - Files: SessionBar, SessionCompleteModal, [src/components/StatusBar.tsx](src/components/StatusBar.tsx), RightNowHero, TodayMinimumStrip, RemindersSettingsCard.
  - Steps: minimal render tests (mount with mock state, assert key text/controls).
  - Verify: tests pass headless.

- [x] **B17 — Playwright e2e flows**
  - Why: prove the core loops work end-to-end.
  - Files: [e2e/](e2e/), [playwright.config.ts](playwright.config.ts).
  - Steps: cover start-session ritual, Daily 5 completion, Settings goal/SAT date, theme toggle, export/import round-trip.
  - Verify: `npm run test:e2e` green locally.

- [x] **B18 — CI gate on PRs**
  - Why: stop regressions from merging.
  - Files: new `.github/workflows/ci.yml`.
  - Steps: run lint + test + build on pull requests and pushes.
  - Verify: a PR shows the checks running and passing.

### D. UI / color (the "almost there" pass)

- [x] **B19 — Palette refinement + contrast**
  - Why: the look is close but the color/feel needs a final tune (your call-out).
  - Files: [src/index.css](src/index.css).
  - Steps: audit text/accent contrast to WCAG AA in dark + light; refine accent + surfaces + shadows + grid overlay; document the final tokens.
  - Verify: spot-check key screens in both themes; no low-contrast text.

- [x] **B20 — Finalize subject-accent harmony (incl. light mode)**
  - Files: [src/lib/subjectAccent.ts](src/lib/subjectAccent.ts).
  - Steps: confirm the cool palette reads well on light surfaces; tweak any muddy hues.
  - Verify: subject dots/borders look cohesive in both themes.

- [x] **B21 — Status bar / session bar polish**
  - Files: [src/components/StatusBar.tsx](src/components/StatusBar.tsx), [src/features/session/SessionBar.tsx](src/features/session/SessionBar.tsx).
  - Done: SessionBar now sits above the mobile nav (`bottom: mobile-nav + 0.5rem`) and the desktop status bar (`md: statusbar + 0.5rem`) so it never overlaps; StatusBar body bumped from `text-subtle` to `text-muted` for AA legibility; cancel button given a 44px touch target.
  - Verify: clean on desktop + mobile; no overlap during a session. (e2e session ritual green.)

- [x] **B22 — Typography + spacing rhythm**
  - Files: [src/index.css](src/index.css), dashboard widgets.
  - Done: contrast/legibility sweep replacing 11-12px `text-subtle` body copy with `text-muted` (StatusBar, Today footer, RightNowHero diagnostic note, ContinueHero lesson index, Reminders hint); "not met" minimum icon now `--warning`.
  - Verify: pages read consistently; no low-contrast small text.

- [x] **B23 — Today hierarchy + empty states + motion**
  - Files: [src/features/dashboard/](src/features/dashboard/), dialogs.
  - Done: unified modal entrance motion (`modal-in` on ConfirmDialog + LevelUpModal to match SessionCompleteModal); minimum-strip "not met" state now color-distinct.
  - Verify: Today still reads as one obvious action; consistent motion.

- [x] **B24 — Accessibility sweep**
  - Files: app-wide.
  - Done: shared `useEscapeKey` hook + Escape/backdrop dismissal on ConfirmDialog, SessionCompleteModal, LevelUpModal (with initial focus on Confirm's cancel); `focus-visible` ring on Button; quiz progressbar `aria-label`; StatusBar per-segment `aria-label`s; review badge exposed in nav `aria-label`; `aria-pressed` on reminder/accountability toggles; robust `prefers-reduced-motion` reset (incl. `.app-chrome` + global belt).
  - Verify: keyboard-only pass works; reduced-motion honored; tests green.

- [x] **B25 — Mobile (480px) polish for new surfaces**
  - Files: [src/app/AppShell.tsx](src/app/AppShell.tsx), SessionBar.
  - Done: SessionBar offset clears the 56px mobile nav; main content drops its nav-height bottom padding in focus mode (no wasted space); icon touch targets >= 44px.
  - Verify: no overflow/overlap at 480px or during a session.

### E. Features / SAT depth (after the above)

- [x] **B26 — SAT readiness signal (honest, not a fake score)**
  - Files: [src/lib/satWeeklyProgress.ts](src/lib/satWeeklyProgress.ts), [src/features/stats/widgets/SatWeeklyProgressCard.tsx](src/features/stats/widgets/SatWeeklyProgressCard.tsx).
  - Done: `getSatReadinessSignal()` combines weekly consistency, diagnostic trend, due re-drills, and the countdown into a qualitative band (crunch / strong / on-track / building) — deliberately NOT a predicted score, since the in-app diagnostics are short samplers. Surfaced as a tag + line on the weekly card.
  - Verify: signal shifts sensibly (test-week, strong rhythm, building); 3 unit tests.

- [x] **B27 — Weak-skill weighting for Daily 5**
  - Files: [src/lib/satDailyQuiz.ts](src/lib/satDailyQuiz.ts).
  - Done: the Daily 5 now ranks SAT questions by overlap with your top logged-mistake categories (token match on node name/concepts + question), with a day-stable tiebreak for variety; degrades to a plain deterministic daily shuffle when no mistakes are logged. (Draft 2 diagnostic already builds from gaps.)
  - Verify: weak-category questions float to the top; determinism per day preserved; unit test added.

- [x] **B28 — Mistake -> spaced re-drill loop**
  - Files: new [src/lib/satDrillSchedule.ts](src/lib/satDrillSchedule.ts), [src/lib/satMicroDrills.ts](src/lib/satMicroDrills.ts), [src/features/sat/SatDrillPage.tsx](src/features/sat/SatDrillPage.tsx).
  - Done: drill page now targets the next category *due* for re-drill (most-missed, not drilled within ~2 days) and marks it drilled on completion so the rotation advances; due count feeds the readiness signal. New key `learnv2_sat_drill_log_v1` registered for backup.
  - Verify: top miss drills first, rotates after drilling, returns as due after the interval; 3 unit tests.

- [x] **B29 — Resolve dead LessonContent + exotic quiz types**
  - Files: removed `src/features/lesson/LessonContent.tsx`; [src/curriculum/types.ts](src/curriculum/types.ts).
  - Done: deleted the unused `LessonContent` component (was imported nowhere) and trimmed the never-used `code-completion`/`drag-and-drop` quiz schema (no data uses them; lint script doesn't reference them) down to the implemented multiple-choice shape.
  - Verify: build + lint + tsc green; no declared-but-unrendered fields remain.

- [x] **B30 — Targeted college/essay depth (SAT-first, low priority)**
  - Files: [src/components/StatusBar.tsx](src/components/StatusBar.tsx) reusing [src/lib/admissionsSummary.ts](src/lib/admissionsSummary.ts).
  - Done: an urgent college-deadline chip (overdue / due today / due tomorrow) now appears in the always-on desktop status bar, linking straight to the essay tracker / checklist — small, conditional, and only when something is actually urgent so it never competes with the SAT-first Today.
  - Verify: chip shows only for urgent deadlines and links correctly; no e2e/unit regressions.

---

## F. Finish pass (B31-B38) — done 2026-05-30

- [x] **B31** — lint to 0 warnings: documented the 4 intentional cache-buster `useMemo` deps (`entries`, `activityRevision`, `progressNodes` x2) instead of removing them (removal would cause stale UI).
- [x] **B32** — deleted 6 dead dashboard widgets (`SatTodayCard`, `DailyGoalStrip`, `DayNarrativeStrip`, `StudyIntentStrip`, `RecentStudyStrip`, `StudyBlockCard`); refreshed README + docs references.
- [x] **B33** — synced version to **2.6.0** across `package.json`, `src/lib/version.ts`, and the SW cache via `scripts/bump-version.mjs`.
- [x] **B34** — shared `useFocusTrap` hook + `Modal` shell (backdrop + role/aria + Escape + Tab trap + initial focus + focus restore); refactored ConfirmDialog / SessionCompleteModal / LevelUpModal / OnboardingModal onto it; trapped the CommandPalette.
- [x] **B35** — CommandPalette `role=listbox` + `aria-activedescendant` + input focus ring; OnboardingModal accessible step state + duplicate-id cleanup + roving-tabindex arrow-key options.
- [x] **B36** — quiz options use `--focus-ring`; AchievementToast 44px dismiss target; DailyChallengeCompact `aria-controls` + `aria-hidden` chevrons.
- [x] **B37** — bottom-stack z-index policy tokens (`--z-chrome` < `--z-action-bar` < `--z-overlay` < `--z-modal` < `--z-modal-top`) + offsets; fixed session-bar/quiz-footer/toast/SW-banner collisions and the focus-mode nav gap.
- [x] **B38** — unified the Today hero title scale via one `--text-hero` token (RightNowHero + ContinueHero).

## Future ideas (optional — open new batches when you want them)

- **Author more SAT questions per skill** — 17 single-question nodes + gap drills st76-st80; target >=5 MC items per teachable skill so drills/Daily 5 have real variety (skills live in `src/lib/satSkills.ts`; matching already prefers same-skill questions and flags thin coverage).
- **Deepen diagnostics** — expand Draft 1/2/3 (`src/data/satPretestDraft1.ts`, `satPretestDrafts.ts`) to ~20-30 section-representative items and align their `skill` strings to the `SatSkillId` taxonomy.
- **Compact mobile status row** — StatusBar is desktop-only; the Today minimum strip is the phone accountability surface. Optionally add a slim mobile status line.
- **CHANGELOG + git release tags** — now that versioning is synced at 2.6.0.
- **Periodic a11y audit** — run axe/Lighthouse occasionally; wire any remaining custom lists to roving-tabindex like the onboarding options.

## Session log

Append newest at the top. Format: `YYYY-MM-DD — batches — notes`.

- 2026-05-30 — Deploy + SAT skill matching — Shipped v2.6.0 to Vercel (PR #2 merged to `main`; added `vercel.json` SPA rewrite; removed the broken GitHub Pages workflow). Live at https://learnv2-tau.vercel.app, auto-deploys on push to `main`. Then added a canonical SAT skill taxonomy (`src/lib/satSkills.ts`: `SatSkillId` + `SAT_SKILLS` + 80-node map + free-text alias resolver), made mistake logging a section-filtered skill picklist (`skillId` on entries; legacy free-text categories auto-resolve), and rewrote Daily 5 + micro-drill selection to rank by nodeId > skillId > domain > section (`src/lib/satSkillMatch.ts`) with token overlap as a fallback, MC filter + dedupe, and a thin-skill hint. Triage + drill schedule now key on `skillId` so "comma / commas / Comma splice" merge. Added satSkills/satSkillMatch/satMicroDrills tests; updated satDrillSchedule tests. Result: 314 unit tests + 8 e2e, lint 0 warnings, tsc + build clean.
- 2026-05-30 — B31-B38 — Finish pass: cleanup, accessibility, UI polish. Pushed the 3 prior commits. Lint to 0 warnings (documented intentional cache-buster useMemo deps). Deleted 6 dead dashboard widgets + refreshed README/docs. Synced version to 2.6.0 (package.json + version.ts + SW cache via bump-version.mjs). New `useFocusTrap` hook + shared `Modal` shell (Escape + Tab trap + initial focus + restore) adopted by ConfirmDialog/SessionCompleteModal/LevelUpModal/OnboardingModal; CommandPalette trapped + `role=listbox`/`aria-activedescendant`/input ring; OnboardingModal step a11y + roving-tabindex options. Quiz `--focus-ring`, toast 44px dismiss, DailyChallengeCompact `aria-controls`. Bottom-stack z-index policy tokens + offsets (fixed session/quiz/toast/banner collisions + focus-mode gap). Unified Today hero scale (`--text-hero`). Added Modal SSR render test + a Playwright keyboard/focus-trap e2e. Result: 305 unit tests + 8 e2e, lint 0 warnings, tsc + build clean. Released v2.6.0.
- 2026-05-29 — B21-B30 — A11y + UI polish pass and SAT-depth features (backlog complete). Ran a read-only Composer 2.5 UI/a11y audit in parallel, then implemented: SessionBar overlap fix (clears mobile nav + desktop status bar) + 44px touch targets; contrast sweep (small `text-subtle` body copy -> `text-muted` across StatusBar/Today/heroes/reminders); shared `useEscapeKey` hook + Escape/backdrop dismissal + initial focus on ConfirmDialog/SessionCompleteModal/LevelUpModal; Button `focus-visible` ring; quiz progressbar + StatusBar segment + nav review-badge `aria-label`s; `aria-pressed` on reminder toggles; robust `prefers-reduced-motion` reset; focus-mode mobile padding. Features: honest SAT readiness signal (B26), weak-category weighting for the Daily 5 (B27), spaced mistake re-drill schedule (B28, new `satDrillSchedule.ts`), removed dead `LessonContent` + trimmed exotic quiz schema (B29), urgent college-deadline chip in the status bar (B30). Result: 303 unit tests + 7 e2e, lint 0 errors, build green.
- 2026-05-29 — B11-B20 — Ops + testing + start of UI pass. Pinned runtime (engines >=20, .nvmrc 22); `npm run doctor`; fixed PWA under sub-path (relative manifest/icon links, scope-relative SW precache, cool-slate theme colors) and verified the /learnv2/ base build; README "install as app" + "update the app" notes; CI workflow (lint+test+build on PRs); unit tests for focusSession/satCountdown/satWeeklyProgress; render smoke tests for StatusBar/RightNowHero/TodayMinimumStrip/RemindersSettingsCard/SessionBar/SessionCompleteModal; Playwright e2e flows (theme, session ritual, Daily 5, settings goal/date, export) — all 7 green via reducedMotion + onboarding seed; guarded focus-mode DOM access for SSR/tests; contrast bump on --text-subtle (both themes) + deepened the lightest subject accents for light mode. Result: 296 unit tests + 7 e2e, lint 0 errors, build green.
- 2026-05-29 — B01-B10 — Reliability + data-safety + ops pass. storageSafety.ts (write/quota failure tracking + StorageHealthPanel warning + corrupt-data quarantine on rehydrate via safe persist storage on progress + preferences). Backup hardened (registry entries + ephemeral exclusion + export/round-trip tests). Auto-backup nudge (backupReminder.ts + Settings prompt). Error boundary recovery (export-backup + reload) + route-level boundary. Removed synthetic sat-daily/sat-drill node pollution (Quiz persistAttempt=false + rehydrate strip). Reminder honesty (Settings test button, last-fired, tab-open note) + cross-midnight 12h activity guard. UTC day convention documented. subjectId now tagged on lesson/quiz completion -> accurate SAT weekly stats. README "update the app" note. Result: 278 tests, lint 0 errors, build green.
- 2026-05-29 — system created — BATCHES.md + `.cursor/rules/batches.mdc` + README quickstart added. Phases 1-5 of the SAT daily-driver shipped in `a6ca7ec`.

---

## Known issues / debug

- Reminders fire **only while a Learn v2 browser tab is open** (no push server) — by design for the local-only model; now stated in Settings (B07) and guarded against cross-midnight false nags (B08).
- Daily 5 / drill node-record pollution is fixed (B06): they no longer persist a node (`persistAttempt=false`) and any legacy `sat-daily-*` / `sat-drill-*` node entries are stripped on rehydrate. Their per-day quiz-progress keys clear on finish.
- Version is synced at **2.6.0** across `package.json`, `src/lib/version.ts`, and the SW cache (`learnv2-v2.6.0`) as of B33; use `node scripts/bump-version.mjs patch|minor|set X.Y.Z` for the next release so all three stay in lockstep.
- Lint is at **0 warnings** (B31). The 4 former `exhaustive-deps` warnings were intentional cache-busters and are now documented with scoped `eslint-disable` + reason comments — do not "fix" them by removing the dep (that reintroduces stale UI).
- Dialogs share the `Modal` shell (B34): Escape + backdrop + Tab focus trap + initial focus + focus restore. New dialogs should use `Modal` (or `useFocusTrap`) rather than hand-rolling an overlay.
- Bottom-stack layering is governed by the `--z-*` tokens in `index.css` (B37); keep new fixed bottom elements on that scale.
- StatusBar is desktop-only (`hidden md:flex`); on phones the Today minimum strip is the accountability surface — see "Future ideas" (compact mobile status row).
- e2e (`npm run test:e2e`) runs against a clean `npm run preview` build with `reducedMotion: reduce`; tests seed `onboardingCompleted` so the first-run modal doesn't block clicks.
