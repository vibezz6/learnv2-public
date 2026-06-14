# OSS Release Checklist

Use this private-to-public checklist before changing repository visibility.

## Verification

- [x] `npm run doctor` passes locally.
- [x] `npm run test:e2e` passes locally.
- [ ] CI is green on `main`.
- [ ] Vercel production deploy is healthy.
- [x] Current tree has no personal path matches for `/Users/...`, `~/liqui`, `~/cursor`, `file:///Users`, or `.hermes`.
- [x] Backup/export file patterns are ignored.
- [x] OSS docs and GitHub templates are present.

## Secret Scan Result

Scanner binaries were not installed in the local environment, so the fallback audit used:

- Current-tree pattern search for local paths, agent keys, OpenRouter key formats, GitHub token formats, `.env`, backup files, and OpenRouter references.
- Full-history `git grep` pattern search across all commits for local paths, agent keys, OpenRouter key formats, and GitHub token formats.

Result:

- No obvious real credential was found by the fallback pattern scan.
- History contains repeated personal/internal path references and placeholder key examples from earlier commits.
- Current tree has been sanitized for those public-facing path patterns.

## Release Path Decision

Recommended path: **fresh public repository with a clean current tree** if the priority is maximum privacy and the least public history exposure.

Existing repo can be made public only if you accept that historical commits still contain internal path references and placeholder key examples. Because the requested posture is "as aggressive as possible," a fresh public repo is the safer choice.

Before public release:

- Run `gitleaks detect --source . --log-opts=--all`.
- Run `trufflehog git file://$PWD`.
- If either tool finds a real secret, rotate it before publishing.
