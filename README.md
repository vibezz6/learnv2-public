# Learn v2

Personal learning OS — Neural Utopia redesign of [Learn-v1](https://github.com/dishwashersol/LearnApp).

## Stack

- React 19 + TypeScript + Vite 8
- Tailwind CSS v4
- React Router v7
- Zustand (preferences + future stores)

## Dev

```bash
npm install
npm run dev
```

Open http://localhost:8090 (v1 stays on :8080).

## Batches

See `~/cursor/LEARN-V2-PLAN.md` for full roadmap.

| Batch | Status |
|-------|--------|
| 1 Foundation | ✅ scaffold, shell, tokens, focus mode, math stub |
| 2 Core loop | pending |
| 3 Second brain | pending |
| 4 Parity | pending |
| 5 Cutover | pending |

## Git remote

If this folder was created locally first:

```bash
git remote add origin https://github.com/dishwashersol/learnv2.git
git add -A && git commit -m "Batch 1: Neural Utopia scaffold"
git push -u origin main
```

## Hermes / Cursor split

- **Cursor** owns this repo (UI + architecture)
- **Hermes** does v1 support audits in `~/cursor/audits/` — does NOT edit learnv2
