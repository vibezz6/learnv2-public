# SAT / study copy audit (Run A)

**Release baseline:** v2.0.40 · **Voice:** study-first (track, mistake log, official practice, college); diagnostics optional after Draft 1.

Generated for batched implementation (Runs B–E). Do not ship as one release.

---

## Copy voice rules

1. **Primary CTAs:** lesson, mistake log, official practice, college checklist/essay.
2. **Diagnostics:** label “optional” where the user already completed Draft 1; keep Draft 2/3/Cursor import for people on that tab.
3. **Avoid:** implying another draft is the main daily action; “official score” language on the short in-app bank.
4. **Keep:** error toasts that name Draft 1 prerequisite (accurate).
5. **Lib strings:** update `satDailyStudy.ts` `diagnosticNote` / button labels in the same batch as dashboard (Run B).

---

## Batch B — Dashboard (v2.0.41)

| File | Line (approx) | Current | Suggested | Priority |
|------|---------------|---------|-----------|----------|
| `TomorrowTasks.tsx` | 17 | `pretest: "Diagnostic"` | `pretest: "Optional diagnostic"` | high |
| `TomorrowTasks.tsx` | 45 | `…SAT, or diagnostic` | `…SAT study, or an optional diagnostic` | med |
| `SatTodayCard.tsx` | 82 | `SAT diagnostic` (button) | `Optional diagnostic` | high |
| `CampusHome.tsx` | 153 | `Draft 1 diagnostic` (link) | `Optional diagnostic` or hide when SAT today visible (already hidden if `showSatToday`) | low |
| `satDailyStudy.ts` | 89–91 | `Start Draft 1` / baseline copy | `Optional: Draft 1 baseline` / `Start baseline (optional)` | high |
| `satDailyStudy.ts` | 105 | `retest later from SAT diagnostic when ready` | `retest optional from SAT diagnostic when ready` | med |

**Files to touch:** `TomorrowTasks.tsx`, `SatTodayCard.tsx`, `satDailyStudy.ts` (and tests in `satDailyStudy.test.ts` if assertions match strings).

---

## Batch C — SAT Prep hub (v2.0.42)

| File | Line (approx) | Current | Suggested | Priority |
|------|---------------|---------|-----------|----------|
| `SatRecommendedLessonsCard.tsx` | 24 | `Recommended from Draft 1 gaps` | `From your baseline misses` | med |
| `SatRecommendedLessonsCard.tsx` | 33 | `…missed on the diagnostic` | `…missed on the optional baseline` | med |
| `SatRecommendedLessonsCard.tsx` | 37 | `Draft 1 adds gap targeting when you are ready` | `Optional baseline adds gap targeting when you are ready` | med |
| `SatRecommendedLessonsCard.tsx` | 73 | `Open SAT diagnostic` | `Optional diagnostic` | high |
| `SatOfficialResourcesCard.tsx` | 87 | `Take Draft 1 diagnostic` | `Take optional baseline` | high |
| `SatOfficialResourcesCard.tsx` | 80–83 | (already good) | Keep “Optional: Draft 1 baseline” pattern | — |

**Files to touch:** `SatRecommendedLessonsCard.tsx`, `SatOfficialResourcesCard.tsx`.

---

## Batch D — Command palette (v2.0.43)

| File | Line (approx) | Current | Suggested | Priority |
|------|---------------|---------|-----------|----------|
| `CommandPalette.tsx` | 218 | `SAT Draft 1 diagnostic` | `SAT optional baseline (Draft 1)` | high |
| `CommandPalette.tsx` | 219 | `In-app pretest with rationale` | `Short in-app baseline; optional` | med |
| `CommandPalette.tsx` | 229 | `Track or diagnostic` / `Track next or Draft 1` | `Next lesson or optional baseline` | high |

**Files to touch:** `CommandPalette.tsx` only.

---

## Batch E — Pretest flow + Settings (v2.0.44)

| File | Line (approx) | Current | Suggested | Priority |
|------|---------------|---------|-----------|----------|
| `SatPretestPage.tsx` | 285 | `SAT diagnostic` (eyebrow) | `SAT optional baseline` | med |
| `SatPretestPage.tsx` | 310–311 | Draft 2 targeting lead | Lead with study path; Draft 2 as follow-up | high |
| `SatPretestPage.tsx` | 499 | `Start diagnostic` | `Start baseline` | med |
| `SatPretestSettingsCard.tsx` | 80 | `SAT diagnostic` (h2) | `SAT diagnostic backup` | low |
| `SatPretestSettingsCard.tsx` | 149 | `Open SAT diagnostic` | `Open diagnostic tool` | med |

**Do not change:** Draft 2/3 tab labels, Cursor import instructions, scoring/export copy, error messages with Draft prerequisites.

**Files to touch:** `SatPretestPage.tsx` (header + StartCard only), `SatPretestSettingsCard.tsx`.

---

## Out of scope

- Mobile `min-h-11` pass
- New `sat-prep.json` nodes
- College essay/checklist copy (unless palette batch picks up one line)
- Pretest logic, storage, or more questions
- `docs/gpt-planning-handoff-prompt.md` (separate doc commit)

---

## Approval

- [x] Batches B–E shipped (v2.0.41–v2.0.44 on `main`)
