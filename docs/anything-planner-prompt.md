# Anything planner prompt

Use **Plan or Discussion** in Anything (not Build). Attach screenshots of the real app first.

- **Phase 1 (done):** B61–B67 — application package, college registry, drill queue, palette, stats.
- **Phase 2 (done):** B68–B73 — college-aware Today, registry notes, drill Today card, Daily 5 weighting, print summary, a11y.
- **Phase 3 (done):** B74–B80 — study loop closure, package submit/archive, `readJsonSafe`, import confirm, mastery/drill links, SAT date sync, e2e.
- **Phase 4 (done):** B81–B86 — Cursor-planned §L (v2.9.0); cooldown, submitted package, college modal, post-SAT, e2e, backup UI.
- **Phase 5 (done):** B87–B92 — Cursor-planned §M (v2.10.0); Draft 3 nudge, essay badge, good-shape streak, PWA copy, e2e verify.
- **Phase 6 (done):** B93–B98 — Cursor-planned §N (v2.11.0); Draft 3 snooze/summary, college intent week plan, ⌘K, e2e.
- **Phase 7 (done):** B99–B104 — Cursor-planned §O (v2.12.0); study intent picker, catch-up week plan, intent copy/CTAs, ⌘K focus, e2e.
- **Phase 8 (next):** B105+ — copy the block below (or extend themes in Phase 4 block).

After Anything answers, paste the full output in Cursor:

`Here is Anything's plan — turn it into BATCHES §P B105+ implementation plan:`

---

## Phase 4 — B81+ (copy from here)

```text
You are a senior product designer planning the NEXT wave of improvements for "Learn v2" — a local-first study PWA (React + Vite, no backend, no accounts). I'm attaching screenshots of the REAL app (dark slate UI, indigo accent, card layout).

## What already shipped (do NOT re-propose unless a small polish pass)

**Study loop + safety (B74–B80, v2.8.0)**
- Today hero overlays after Daily 5: drill-next (`todayHero.ts`) and "good shape" ghost CTAs; college blocking unchanged
- Session complete modal: SAT "What's next" (mistake log, top drill) when focus href is SAT
- Package: inline essay status Select; college Mark submitted; Campus submit/archive + Show archived
- `readJsonSafe` + `learnv2_storage_errors_v1` FIFO log; Settings storage read-errors panel
- Import overwrite confirm (checkbox + key list) for full backup + admissions import
- SAT hub: mastery ↔ drill cross-links; stats mistake bars click → `?skill=` drill
- Subject SAT hero uses Settings `satTestDate` + `getSatCountdown` (no hardcoded August date)
- Week plan empty CTA (Daily 5 or drill); essay final toast; package checklist "Saved" banner
- Playwright `e2e/b74-k.spec.ts` + stabilized palette tests

**Campus / applications (B61–B73)**
- Application package per college; college registry with copy-only `notes` (ED/EA/RD label, NOT deadline schema)
- Today `college_blocking` with package CTA; essay `#essay-<id>` links (no essay detail route)
- Print summary `/campus/print-summary` via `window.print`
- Drill queue + Today "Drill next" card (hidden when college blocks ≤7d; 24h snooze)
- Daily 5 soft 2× weight toward top-3 drill-queue skills

**SAT study loop (B48–B60)**
- Mistake log with skillId; Daily 5 + drill rotation; diagnostics Draft 1/3; skill mastery; ⌘K; gap lessons

**Ops**
- `npm run doctor` (368 unit tests, 14 e2e), Vercel deploy on push to main, localStorage backup/export v3

## HARD CONSTRAINTS (never violate)

- Desktop study loop only — no mobile nav/strip/480px layout batches unless I explicitly ask
- localStorage only — no server, auth, sync, or payments
- Do NOT suggest rebuilding in Anything/Next.js — plan is for the existing React repo
- SAT study-first: lessons, mistakes, drills, official practice; diagnostics optional
- College blocking wins over drill nudges when deadline ≤7 days (fixed 48h drill cooldown — no graduated SRS)
- NO: `deadlines: { ED, EA, RD }` schema; per-school checklist fork; essay `/essay/:id` route; PDF library; browser "you changed devices" backup detection; drill queue overriding college in 7d window; bulk ~400 new SAT MCs unless I explicitly opt in; auto-archive on submit; diff preview on import; auto-repair corrupt keys

## YOUR JOB

1. Ask me **12–18 specific clarifying questions** BEFORE proposing batches. Group by:
   - Today / week plan / focus session / study intent
   - Campus / essays / package / print / submitted schools
   - SAT hub / mistakes / drills / Daily 5 / diagnostics / stretch MC coverage
   - Data safety / backup / export / corrupt recovery / PWA update UX
   - Polish / a11y / e2e gaps / performance
   - Countdown / test date / August track alignment

2. After I answer, produce **6–10 batches** (IDs **B81–B8X**), each shippable in ~1–2 Cursor sessions.

For EACH batch include:
- Batch ID + short title
- User problem (1 sentence)
- Scope IN / OUT
- UI behavior (screens, components, example copy)
- Data model (localStorage keys / modules — cite real ones: `todayHero`, `satDrillQueue`, `colleges`, `essayTracker`, `storageErrors`, `admissionsSummary`, etc.)
- Open questions
- Verify steps (browser manual test)
- Effort: S / M / L
- **Anything Build:** skip / optional / recommended (default **skip** — we ship in Cursor)

## Seed themes (prioritize and challenge these — add better ideas)

| Theme | Why it might matter now |
|--------|-------------------------|
| **Stretch SAT MCs** | `npm run sat:coverage:stretch` — only if gaps block daily drill quality |
| **Diagnostic / Draft 2** | Retest flow, score history — defer heavy promotion unless user pain |
| **Study intent → routing** | `learnv2_study_intent_v1` exists but does NOT drive Daily 5 — intentional; revisit lightly? |
| **Campus polish** | Submitted/archived schools UX, package empty states, print layout (no PDF) |
| **E2e gaps** | Mark-drilled cooldown, import confirm flow, hero drill overlay with seeded mistakes |
| **Backup habits** | `backupReminder` nudge, export cadence — without cloud |
| **⌘K depth** | More SAT/campus actions; recent actions quality |
| **PWA / perf** | SW update banner, chunk errors — only if user-visible |
| **A11y / keyboard** | Desktop focus traps on new modals (import confirm, package status) |

Explicitly **deprioritize or OUT**: AI tutor chat, social, accounts, mobile redesign, new subjects, graduated drill SRS, essay detail routes, ED/EA/RD deadline schema.

## Output format (strict markdown)

## Questions for you
(numbered)

## Assumptions
(bullets)

## Batch backlog
### B81 — Title
(repeat B82–B8X)

## Recommended order
| Order | Batch | Why |

## Anything Build vs skip
| Batch | Build? | Why |

## What NOT to do next
(align with constraints + §K footer: graduated cooldown, Draft 2 promotion, ED/EA schema, print polish batch, study intent → Daily 5, 400 MCs, browser backup detection, perf batch, drill overrides college)

## Open risks
```

---

## Phase 3 archive (B74 — historical)

<details>
<summary>B74+ planner prompt (collapsed — shipped as §K v2.8.0)</summary>

Phase 3 covered study loop closure, package essay status + submit/archive, `readJsonSafe`, import confirm, mastery/drill links, stats click-to-drill, SAT date sync, and e2e extension. See `CHANGELOG.md` [2.8.0] and `BATCHES.md` §K.
</details>

---

## Phase 1 archive (B61 — historical)

<details>
<summary>B61 planner prompt (collapsed)</summary>

```text
You are a senior product designer planning improvements for "Learn v2" …
START with batch B61 — "Application package" view …
```
</details>
