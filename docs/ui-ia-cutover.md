# UI/IA cutover (Alex daily driver)

Shipped **v2.0.46 → v2.2.6** (README cutover rows 42–55). Goal: study loop first on **Today**, diagnostics and toys only where they belong. **Desktop/laptop** is the daily driver; mobile bottom nav is unchanged.

## Desktop navigation (sidebar)

| Section | Nav label | Route | Page title |
|---------|-----------|-------|------------|
| Learn | Today | `/` | Today |
| Learn | Subjects | `/subjects` | Subjects |
| Learn | Tracks | `/tracks` | Tracks |
| Learn | Campus | `/campus` | Campus |
| Learn | Saved | `/bookmarks` | Saved |
| Productivity | Review | `/review` | Review |
| Productivity | Timer | `/timer` | Timer |
| Productivity | Stats | `/stats` | Stats |
| System | Settings | `/settings` | Settings |

**Trading Lab** — route `/lab/trading`; linked from **Campus → Subjects & labs** and ⌘K (not a top-level sidebar item).

**⌘K Navigate:** Today, Saved, Subjects, Review, Stats, Timer, Settings (+ Campus/SAT sections).

## Mobile navigation (unchanged)

Bottom bar: Today, Review, Timer, Stats. Campus, Saved, and Subjects remain reachable via ⌘K or in-page links.

## Today (`/`)

1. Daily goal strip  
2. **Today's focus** — continue lesson, SAT today (compact), or empty state  
3. **This week** — `WeekPlanCard` (deadlines + track + SAT tasks)  
4. **Spaced review** — only when due or within 2 days  
5. **Daily challenge** — collapsed compact card  
6. Footer — focus / search / stats link  

No heatmap, quiz mastery, math toys, or campus duplicate blocks.

## Stats (`/stats`)

- **Progress** — transcript, level, streak, summary cards, achievements, XP by subject  
- **Study activity** — year heatmap, 7-day bar, weekly trend  
- **Optional** — quiz scores by subject, progress visualizations (collapsed)  

## Campus (`/campus`)

- **College** — admissions hub, checklist, essays, calculators  
- **Subjects & labs** — SAT Prep, Algo Lab, Trading Lab  

## SAT optional baseline (two entry points)

1. **SAT Prep** → `#diagnostic` → button opens `/sat/pretest`  
2. **⌘K** → “SAT optional baseline (Draft 1)” → `/sat/pretest`  

Today and week plan link to **SAT Prep sections**, not directly to pretest (except ⌘K).

## Focus mode (`F`)

Hides app chrome (sidebar, topbar). **FocusShell** on: lesson, office hours (notes), quiz, SAT pretest. Toggle again or use Exit focus on the page.

## Primitives

- `PageContainer` — consistent width/padding (`sm` … `xl`)  
- `PageHeader` — eyebrow, title, subtitle, optional `backTo`  
- `Section` — in-page blocks (Today, Stats, Campus, Review, Saved, college tools, SAT hub, tracks, timer, lab)  
- `PageLoading` — skeleton inside `PageContainer` while routes load  

## Verify after pull

```bash
npm run test && npm run build
npm run dev   # http://127.0.0.1:8080
```

Smoke: `/` loads with Section blocks; ⌘K shows **Today** and **Saved**; `/stats` shows heatmap; `/campus` has two sections; SAT Prep `#diagnostic` scrolls into view; `F` on a quiz widens content like a lesson.
