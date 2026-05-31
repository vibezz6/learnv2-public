# Anything planner prompt (Phase 1)

Copy everything inside the fenced block into **Anything → Plan or Discussion** (not Build). Attach Learn v2 screenshots first.

```text
You are a senior product designer planning improvements for "Learn v2" — a local-first study PWA (React, no backend, no accounts). I'm attaching screenshots of the REAL app (dark slate UI, indigo accent, card layout).

IMPORTANT CONSTRAINTS (do not violate):
- Desktop study loop only — no mobile nav/strip/layout batches unless I explicitly ask later
- Data stays in browser localStorage — no server, auth, or payments
- Do NOT suggest rebuilding the app in Anything or Next.js — this plan is for an existing React codebase
- SAT: study-first (lessons, mistakes, drills, official practice); diagnostics optional
- College: we already have global checklist + essay tracker with optional essay.college field — call out data-model limits in your questions

YOUR JOB:
1. Ask me 12–18 specific clarifying questions BEFORE proposing batches (group questions: Today/dashboard, Campus/college, SAT hub, mistakes/drills, settings/data, polish/a11y).
2. After I answer, produce a phased backlog of 6–10 improvement BATCHES (not one giant feature). Each batch must be shippable in ~1–2 Cursor sessions.

For EACH batch include:
- Batch ID suggestion (B61, B62, …) and short title
- User problem (1 sentence)
- Scope IN / OUT (bullet lists)
- UI behavior (screens, components, copy examples)
- Data model notes (which localStorage keys / existing modules: collegeChecklist, essayTracker, admissionsSummary, satMistakeLog, etc.)
- Open questions you still have
- Verify steps (how a human tests in the browser)
- Rough effort: S / M / L
- Credit burn hint: whether I should prototype this screen in Anything Build or go straight to code

START with batch B61 — "Application package" view (one college: name, deadline badge, shared checklist section, essays for that college, links to full checklist + essay tracker). Ask whether checklist should be shared across schools or essays-only on that page.

Also propose batches for items already on our backlog where relevant:
- Application package per college (B61)
- Stretch SAT coverage / gap nodes (only with evidence — likely defer)
- Today/college blocking polish
- Mistake log as study queue
- Command palette / stats CTAs polish

End with:
- Recommended implementation order (table)
- What NOT to do next (align with study-first, no bulk SAT JSON, no AI tutor everywhere)

OUTPUT FORMAT (strict markdown):
## Questions for you
(numbered)

## Assumptions
(bullets)

## Batch backlog
### B61 — Title
...repeat for B62–B6X...

## Recommended order
| Order | Batch | Why |

## Anything Build vs skip
| Batch | Build in Anything? | Why |

## Open risks
```

After Anything finalizes, paste the full output in Cursor with:

`Here is Anything's plan — turn it into BATCHES B61+ implementation plan:`
