# Contributing to Learn v2

Thanks for helping improve Learn v2. This project is a local-first React/Vite PWA for study workflows, SAT prep, and college application tracking.

## Development Setup

Requirements:

- Node.js 20 or newer (Node 22 recommended)
- npm

```bash
git clone https://github.com/vibezz6/learnv2-public.git
cd learnv2-public
npm install
npm run dev
```

Open http://127.0.0.1:8080.

## Quality Gate

Before opening a pull request, run:

```bash
npm run doctor
```

For UI, routing, backup, SAT, college, or PWA changes, also run:

```bash
npm run test:e2e
```

## Pull Request Expectations

- Keep changes scoped and easy to review.
- Do not add a backend, accounts, sync, or paid services without prior discussion.
- Do not commit real user backups, `.env.local`, API keys, screenshots containing personal data, or local machine paths.
- Preserve local-first behavior: the app should work without accounts and without an OpenRouter key.
- Add or update tests for behavior changes.
- Use existing UI primitives from `src/components/ui` where possible.

## Curriculum Contributions

Curriculum lives under `src/curriculum/data`. SAT Prep is maintained directly in this repo. When editing curriculum:

- Run `npm run curriculum:lint`.
- Keep examples original; do not copy proprietary SAT, College Board, Khan Academy, or Bluebook question text.
- Prefer small, targeted additions over bulk generated content.

## Security and Privacy

Read [SECURITY.md](SECURITY.md) and [docs/PRIVACY.md](docs/PRIVACY.md) before working on storage, backup, analytics, or AI features.
