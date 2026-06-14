# New Cursor session — copy/paste workflow

## Flow (one chat, two model hats)

1. **Message 1** — **Ask** or **Agent** + **GPT 5.5** (or Extra High): paste **PLANNER PROMPT** below. Get ideas + how/why. You pick what sounds good.
2. **Message 2** — Switch model to **Composer 2.5**, stay in **same chat**, **Agent** mode: paste **BUILDER MESSAGE** below (add what you chose from step 1).

You do **not** need a second chat. You do **not** need to `@` files — the planner can read the repo.

---

## PLANNER PROMPT (message 1 — GPT 5.5, Ask mode recommended)

```
You are advising on Learn v2 — a local-first study PWA I actually ship in Cursor.

Do NOT wait for me to tell you what batches to build. I want YOU to review where the project is and propose what work is worth doing next.

## Read the repo yourself
Start by reading: README.md (cutover table), package.json version, docs/gpt-planning-handoff-prompt.md if useful, and skim src/app, src/features/dashboard, src/features/sat, src/lib/satPretest.ts, src/services/llmReview.ts.

## Session summary (last chat — for context only)
- Repo: Learn v2, React/Vite/TS, localStorage, no backend.
- Shipped through v2.0.36: full SAT diagnostic loop (Draft 1–3, Cursor export/import, mistake log, gap lessons st76–st80, readiness, OpenRouter review on completed misses only, SAT week card, tomorrow tasks). College admissions arc is daily-driver level.
- I ran ONE test Draft 1 (3/10), saved export, OpenRouter review worked. I am NOT taking more drafts right now — real SAT study + college apps are the point of the app.
- Minor debt: version.ts was out of sync with package.json (may be fixed locally). I will download pretest exports when I run drafts again.

## Hard constraints (challenge me if I’m wrong)
- No AI tutor chat on every screen
- No journal / Notion clone / full calendar
- No backend/accounts unless there’s a crushing reason
- No mass sat-prep.json without real gap evidence
- Pretest is optional infrastructure; don’t center the next month on more diagnostic features unless you convince me why

## What I need from you
1. **Honest read** — Where is the product actually strong vs fake-complete?
2. **10–15 ideas** for next work (any size — small polish to larger features). Tag each: user value, effort (S/M/L), risk.
3. For your **top 5** picks only: what it achieves for an August SAT + college student, which parts of the repo to touch, and what “done” looks like.
4. **3 things I should NOT do** (call out delusion if I’m overbuilding diagnostics or AI).
5. **Suggested order** if I only have 2–4 hours today — but don’t limit the idea list to 2 batches; I’ll choose.

Do not write implementation code yet. Do not assume I want more pretest work unless you justify it.
```

---

## BUILDER MESSAGE (message 2 — Composer 2.5, Agent mode)

After GPT replies, switch model to **Composer 2.5** + **Agent**, same thread:

```
Implement the work we selected from your plan above:

[Paste the items you want — e.g. "Do ideas #2, #5, and #7" or copy GPT’s top 5 subset]

Rules:
- Ship in sensible commits (one per logical chunk is fine).
- npm run test && npm run build before each commit.
- Bump src/lib/version.ts + package.json together if you release (use 2.0.37+).
- README cutover row for anything user-visible.
- Do not push unless I say.
- Do not expand scope beyond what I listed — if blocked, say so.

Start with git status, then execute.
```

---

## Mode / model (my recommendation)

| Step | Mode | Model | Why |
|------|------|--------|-----|
| Plan | **Ask** | **GPT 5.5 Extra High** | Read-only bias = less accidental edits; better for “what should we do?” |
| Build | **Agent** | **Composer 2.5** | Fast, good at repo edits and tests |

Using **Agent** for message 1 also works if you want it to read more files automatically — just say “plan only, no commits yet.”

**One session is correct.** Model switch mid-thread keeps the plan in context.

---

## When Composer asks to build

Let it run in that same chat. No need to paste back to an old session.

---

## If the planner goes off the rails

Reply: “Drop anything that’s backend, journal, or AI-everywhere. Re-rank for Alex: 18, job, August SAT, 2–4 hours today.”
