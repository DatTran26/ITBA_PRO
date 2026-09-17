---
title: Ship 0.2.2-beta.1 AI providers and face reauth
date: 2026-09-17
summary: "Beta ship of AI provider settings, Face ID reauth, and Edge Function auth to develop"
---

# Ship 0.2.2-beta.1 AI providers and face reauth

## What happened
Beta-shipped `develop-dat` to `develop` as PR https://github.com/DatTran26/down-town/pull/41 (Closes #40, Relates to #22).

The working tree against `origin/develop` was uncommitted ship-readiness work: OpenAI/Gemini routing from masked `system_settings`, Face ID reauth with SHA-256 hashed tokens and claim-before-process, and `requireInternalCaller` on privileged Edge Functions. Two commits landed:

- `31db70b` feat(platform): add AI providers and face reauth
- `d5652cc` docs(release): record 0.2.2-beta.1 ship notes

`ak plan resolve` found no registry match for `plans/260917-1838-ship-readiness-repair`, so plan files were committed as docs rather than flipped to completed through `ak plan update`.

The journal-writer subagent failed to spawn (model usage limit). This entry is the parent-agent follow-up.

## Decision
Ship as beta to `develop` only (GitFlow: personal branch never targets `main`). Leave ONNX/PT models, `Backend/rc1/`, Playwright dumps, showoff assets, and `NUL` unstaged. Changelog version is `0.2.2-beta.1`; Frontend package `1.6.4` stays a separate app version.

Local gates: `npx tsc --noEmit` pass; `npx vitest run` 24 passed; `npx eslint .` 0 errors / 184 warnings; `npm run build` pass; `python -m pytest -q` 13 passed; `docker compose config --quiet` pass. Pre-landing review: 0 critical, informational in-memory Face ID rate limit and Settings GET with masked secrets.

## Next steps
- Human review/merge of PR #41 into `develop` (staging deploy).
- Do not replay 20260917 migrations blindly if staging/production already have the objects.
- Optional: exclude `.next/` from Vitest; persist Face ID rate limits across instances.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
