# Security Policy

## Supported Versions

The `main` branch is the supported development line. Releases are documented in [CHANGELOG.md](CHANGELOG.md).

## Reporting a Vulnerability

Please do not open public issues for vulnerabilities, API keys, backup files, or private student data.

Until GitHub private vulnerability reporting is enabled for the public repo, contact the maintainer through the GitHub profile associated with this repository and include:

- A short description of the issue
- Steps to reproduce
- Affected files or routes
- Whether any private data or credentials are involved

## Local-First Security Model

Learn v2 has no app server and no accounts. Most data is stored in browser `localStorage` for the exact origin you use.

Important implications:

- Clearing browser data can delete progress unless you exported a backup.
- Different origins have separate data stores.
- Backup files may contain study history, notes, SAT mistakes, colleges, essay titles, and deadlines.
- Do not attach backup files to public issues or pull requests.

## OpenRouter Keys

AI review features are optional and bring-your-own-key:

- OpenRouter keys are stored locally in the browser when entered in Settings.
- Keys are browser-visible by design and should be treated as client-side secrets.
- OpenRouter keys and model preferences are excluded from Learn v2 backup exports.
- Optional AI features may send selected notes, answers, rationales, and prompts to OpenRouter.

Use a restricted key where possible and never commit `.env.local` or console snippets containing real keys.

## Secret Scanning

Before making this repo public, run a full-history secret scan. If a real credential or private backup is found in history, rotate it and use a fresh public repository or a carefully reviewed history rewrite.
