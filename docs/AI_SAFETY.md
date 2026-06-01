# AI Safety and OpenRouter

Learn v2's AI features are optional. The app works without an API key.

## Bring Your Own Key

Users can paste an OpenRouter API key in Settings. The key is stored in browser `localStorage` under `learnv2_openrouter_key`.

There is no server-side proxy. Requests go from the user's browser to OpenRouter.

## What Can Be Sent

Depending on the feature used, Learn v2 may send selected:

- Lesson notes
- Office-hours answers
- Recall or mentor responses
- SAT diagnostic rationales after completion
- Prompt instructions and compact context needed for feedback

The app should not send a full backup export to OpenRouter.

## Backup Behavior

OpenRouter key and model storage keys are excluded from backup export/import. Tests cover this behavior in `src/lib/backupFormat.test.ts` and `src/stores/progress.test.ts`.

## Offline Fallback

Without an OpenRouter key, notes review uses built-in rules where available. SAT diagnostic rationale review shows a Settings prompt instead of attempting a network request.

## Maintainer Rules

- Do not add a hosted proxy without a separate privacy/security design.
- Do not log API keys.
- Do not include user backups in prompts.
- Keep AI features optional and clearly labeled.
