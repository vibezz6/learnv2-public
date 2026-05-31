# Changelog

All notable changes to Learn v2 are documented here. Version numbers match `package.json`, `src/lib/version.ts`, and the PWA service worker cache name.

## [Unreleased]

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
