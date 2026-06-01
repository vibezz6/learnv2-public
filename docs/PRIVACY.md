# Privacy

Learn v2 is designed as a local-first study app.

## What Stays Local

By default, study data stays in your browser:

- Progress and XP
- Lesson and quiz state
- Notes and office-hours drafts
- SAT mistakes and diagnostic attempts
- College list, essay tracker, checklist, and deadlines
- Bookmarks, settings, theme, and study activity

This data is stored in `localStorage` for the exact origin you use.

## Backups

Settings can export a JSON backup. Backup files may contain sensitive learning and application data, including notes, college names, essay titles, deadlines, and SAT mistake logs.

Do not attach backup files to public GitHub issues, pull requests, or support requests.

OpenRouter API keys and model preferences are excluded from backups.

## Optional AI Features

Learn v2 can use OpenRouter for richer review feedback if you provide an API key in Settings.

When used, selected content may be sent to OpenRouter, including:

- Lesson notes
- Mentor or recall answers
- SAT diagnostic rationales
- Prompt context needed for feedback

Without an OpenRouter key, the app uses built-in offline rules where available.

## Analytics

The public app does not include telemetry or performance telemetry. Study progress, notes, backups, and settings stay in your browser unless you export them yourself.

## Browser Storage Limits

The app warns about some storage write/read failures, but browser storage is still user-controlled. Export backups regularly if you rely on the app.
