# Learn v2

Personal learning OS — Neural Utopia redesign of [Learn-v1](https://github.com/dishwashersol/LearnApp).

**Version:** 2.0.2 (patch bumps via `npm run version:bump`: 2.0.1→2.0.99→2.1.0) · **Daily driver:** `~/liqui/projects/learnv2` (:8080)

## Stack

- React 19 + TypeScript + Vite 8
- Tailwind CSS v4 · Neural Utopia design tokens
- React Router v7
- Zustand + persist

## Dev

```bash
npm install
npm run dev          # http://localhost:8090
npm run test
npm run build
npm run curriculum:split   # re-sync JSON from Learn-v1
```

v1 fallback: `~/liqui/projects/Learn-v1` (:8080) — tagged `v1-final`

## Migrate from v1

1. Open v2 in the **same browser** where v1 saved progress
2. Settings → **Run full v1 migration**
3. Or export JSON from v1 Settings, import in v2 Settings

See `~/cursor/audits/localStorage-schema-v1.md` for key mapping.

## Batches (complete)

| Batch | Status |
|-------|--------|
| 1 Foundation | ✅ |
| 2 Core loop | ✅ |
| 3 Second brain | ✅ |
| 4 Parity | ✅ |
| 5 Cutover | ✅ v2.0.0 |

Full roadmap: `~/cursor/LEARN-V2-PLAN.md`

## Repo

https://github.com/dishwashersol/learnv2
