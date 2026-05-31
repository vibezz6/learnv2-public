# Anything planner prompt

Use **Plan or Discussion** in Anything (not Build). Attach screenshots of the real app first.

- **Phase 1 (done):** B61–B67 — application package, college registry, drill queue, palette, stats.
- **Phase 2 (done):** B68–B73 — college-aware Today, registry notes, drill Today card, Daily 5 weighting, print summary, a11y.
- **Phase 3 (next):** B74+ — copy the block below.

After Anything answers, paste the full output in Cursor:

`Here is Anything's plan — turn it into BATCHES §K B74+ implementation plan:`

---

## Phase 3 — B74+ (copy from here)

```text
You are a senior product designer planning the NEXT wave of improvements for "Learn v2" — a local-first study PWA (React + Vite, no backend, no accounts). I'm attaching screenshots of the REAL app (dark slate UI, indigo accent, card layout).

## What already shipped (do NOT re-propose unless a small polish pass)

**Campus / applications (B61–B73)**
- Application package per college (`/campus/application?college=…`) — essays, shared checklist preview, do-this-first
- College registry `learnv2_colleges_v1` — Campus grid, deadlines, optional `notes` (ED/EA/RD copy-only, NOT a deadline schema)
- Week plan links to package; Today `college_blocking` with package CTA when school known; registry deadlines in urgent merge
- Essay tracker + `#essay-<id>` deep links from package (no essay detail route)
- Print summary `/campus/print-summary` via `window.print` (no PDF lib)
- Drill queue on SAT hub + secondary "Drill next" card on Today (hidden when college blocks ≤7d; 24h snooze)
- Daily 5 soft 2× weight toward top-3 drill-queue skills (deterministic)

**SAT study loop (B48–B60)**
- Mistake log with skillId; Daily 5 + drill rotation; diagnostics Draft 1/3; skill mastery; ⌘K actions; gap lessons

**Ops**
- `npm run doctor` (363+ unit tests), Vercel deploy on push to main, localStorage backup/export

## HARD CONSTRAINTS (never violate)

- Desktop study loop only — no mobile nav/strip/480px layout batches unless I explicitly ask
- localStorage only — no server, auth, sync, or payments
- Do NOT suggest rebuilding in Anything/Next.js — plan is for the existing React repo
- SAT study-first: lessons, mistakes, drills, official practice; diagnostics optional
- College blocking wins over drill nudges when deadline ≤7 days
- NO: `deadlines: { ED, EA, RD }` schema; per-school checklist fork; essay `/essay/:id` route; PDF library; browser "you changed devices" backup detection; drill queue overriding college in 7d window; bulk ~400 new SAT MCs unless I explicitly opt in

## YOUR JOB

1. Ask me **12–18 specific clarifying questions** BEFORE proposing batches. Group by:
   - Today / week plan / focus session
   - Campus / essays / package / print
   - SAT hub / mistakes / drills / Daily 5 / diagnostics
   - Data safety / backup / export / migration
   - Polish / a11y / e2e / performance
   - August SAT date / study intent / countdown alignment

2. After I answer, produce **6–10 batches** (IDs **B74–B8X**), each shippable in ~1–2 Cursor sessions.

For EACH batch include:
- Batch ID + short title
- User problem (1 sentence)
- Scope IN / OUT
- UI behavior (screens, components, example copy)
- Data model (localStorage keys / modules: `satMistakeLog`, `satDrillQueue`, `colleges`, `essayTracker`, `admissionsSummary`, `progress`, etc.)
- Open questions
- Verify steps (browser manual test)
- Effort: S / M / L
- **Anything Build:** skip / optional / recommended (default **skip** — we ship in Cursor)

## Seed themes (prioritize and challenge these — add better ideas)

Rank what matters most for a student using Learn v2 daily until August SAT + college apps:

| Theme | Why it might matter now |
|--------|-------------------------|
| **Study loop closure** | After Daily 5 / drill / lesson — clearer "what's next" without nag overload |
| **Mistake → drill → mastery** | Triage queue UX, spaced re-drill schedule visibility, skill mastery gaps on SAT hub |
| **Backup confidence** | Export reminders, import UX, corrupt-data recovery — without cloud sync |
| **Campus depth (light)** | Package/checklist/essay flows still rough edges — no new routes |
| **⌘K + Stats CTAs** | Power-user paths from mistake categories / week plan to drill or package |
| **E2E coverage** | Playwright for package, print, drill Today card, college blocking |
| **Stretch SAT content** | Only if `sat:coverage:stretch` shows gaps — default defer bulk authoring |
| **PWA / perf** | SW update UX, chunk load, focus mode — only if user-visible pain |

Explicitly **deprioritize or OUT**: AI tutor chat, social features, accounts, mobile redesign, new subjects.

## Output format (strict markdown)

## Questions for you
(numbered)

## Assumptions
(bullets)

## Batch backlog
### B74 — Title
(repeat B75–B8X)

## Recommended order
| Order | Batch | Why |

## Anything Build vs skip
| Batch | Build in Anything? | Why |

## What NOT to do next
(align with constraints above)

## Open risks
```

---

## Phase 1 archive (B61 — historical)

<details>
<summary>B61 planner prompt (collapsed)</summary>

```text
You are a senior product designer planning improvements for "Learn v2" …
START with batch B61 — "Application package" view …
```
</details>
