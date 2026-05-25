# UI/IA cutover (Alex daily driver)

Shipped **v2.0.46 → v2.1.4** (README cutover rows 42–47). Goal: study loop first on **Today**, diagnostics and toys only where they belong.

## Navigation map

| Nav label | Route | Page title |
|-----------|-------|------------|
| Today | `/` | Today |
| Saved | `/bookmarks` | Saved |
| Review | `/review` | Review |
| Timer | `/timer` | Timer |
| Stats | `/stats` | Stats |
| Campus | `/campus` | Campus |

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

## Primitives

- `PageContainer` — consistent width/padding (`sm` … `xl`)  
- `PageHeader` — eyebrow, title, subtitle, optional `backTo`  
- `Section` — in-page blocks (Today dashboard, Stats)  

## Verify after pull

```bash
npm run test && npm run build
npm run dev   # http://127.0.0.1:8080
```

Smoke: `/` loads, `/stats` shows heatmap, `/campus` has two sections, SAT Prep `#diagnostic` scrolls into view.
