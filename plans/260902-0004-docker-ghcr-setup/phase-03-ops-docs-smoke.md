---
title: "Phase 3: Ops docs and smoke"
status: todo
phase: 3
priority: P1
effort: "1.5h"
dependencies: [1, 2]
---

# Phase 3: Ops docs and smoke

## Overview

Point canonical operations docs at the new compose service, GHCR tags, and
manual VPS pull/recreate flow. Prove the local build path. Do not treat a docs
edit as a substitute for `docker compose up`.

## Requirements

- Functional: `docs/downtown/operations.md` commands succeed if copied
  (service `web`, image `ghcr.io/dattran26/down-town`, Dockerfile path
  `Frontend/Dockerfile`).
- Functional: local smoke of health endpoint after compose up.
- Non-functional: no secrets, no archived GitLab runbook revival, no claim that
  Vercel/VPS SSH is automated.

## Architecture

Canonical owner remains `docs/downtown/operations.md`. Archived files under
`docs/archive/itbaai-legacy/` stay historical. Root `README.md` should link
to operations for container run, not duplicate a second runbook.

Operator loop after CI publishes:

```text
# on VPS, secrets already in .env (never from git)
# first cutover from itba-ai:
docker compose down
export DOCKER_IMAGE=ghcr.io/dattran26/down-town:staging   # or :x.y.z or @sha256:…
docker compose pull
docker compose up -d --remove-orphans
docker compose ps
curl -fsS http://127.0.0.1:${APP_PORT:-3000}/api/health
```

<!-- RED-TEAM F4 F9 F12 --> Pin `DOCKER_IMAGE` to staging/semver/digest, not
`:latest`. Prefer the sha tag printed by the workflow. Host smoke uses
`$APP_PORT`.

Rollback: set `DOCKER_IMAGE` to the previous **immutable** tag/digest, pull,
`up -d --remove-orphans`. Do not roll back by pulling `:latest`.

## Related Code Files

- Modify: `docs/downtown/operations.md`
- Modify: `docs/downtown/development.md` (dual `.env.example` contract)
- Modify: `README.md` (one-line pointer only if the start section should mention
  Docker; do not paste a second full runbook)
- Create: `plans/260902-0004-docker-ghcr-setup/reports/smoke-notes.md` during
  cook (evidence of commands run; redact any env values)

Do not edit `docs/archive/itbaai-legacy/*`.

## Implementation Steps

1. Rewrite the container section of `docs/downtown/operations.md`:
   - Local: copy root `.env.example` → `.env`, fill values, then
     `docker compose up --build`
   - CI: workflow name, tags, Environments to create in GitHub UI
   - <!-- RED-TEAM F11 --> Treat Environments as a **done gate**: list the
     exact GitHub UI clicks; do not call GHCR "working" until a dry-run
     `workflow_dispatch` or first `develop` push proves non-empty `vars`
   - GHCR visibility: set package public after first push
   - VPS: pin tag/digest, `down` once if migrating from `itba-ai`,
     `up --remove-orphans`, health curl on `$APP_PORT`
   - Logs: `docker compose logs --tail=200 web` (not `itba-ai`)
   - Rollback by immutable tag/digest, not `:latest`
   - <!-- RED-TEAM --> `CHANGELOG.md` in the container is ephemeral
   - <!-- RED-TEAM F13 --> `unhealthy` does not trigger `restart:`
   - <!-- RED-TEAM F10 --> GHCR semver follows git tags, not
     `Frontend/package.json`
2. List GitHub UI prerequisites (cannot be committed):
   - Environments `staging` and `production`
   - Four `NEXT_PUBLIC_*` variables per environment (`APP_URL` required on
     production)
   - Packages write is already covered by `GITHUB_TOKEN` + workflow permissions
3. Update `docs/downtown/development.md`:
   - `npm run dev` still copies `Frontend/.env.example`
   - Docker/compose copies root `.env.example`
   - Do not delete either template
4. Local smoke (cook must run these; skip only if Docker engine is absent, and
   then say so explicitly):
   - `docker compose config` **without** requiring `.env` (parse-only)
   - Copy `.env.example` → `.env` if building
   - `docker compose build` — **do not invent or log real keys**
   - `docker compose up -d` and `curl` `/api/health` on `$APP_PORT`
   - `docker compose down`
5. If Docker is unavailable in the cook environment, still verify:
   - compose YAML parses
   - health route exists
   - middleware early-return exists
   - workflow YAML exists and has no SSH steps
   - report the engine gap in the smoke notes
6. Keep `docs/downtown/operations.md` “pipeline deploy later” checklist; add a
   sentence that GHCR publish is in place and SSH CD is still out of v1.

## Todo

- [x] Update operations.md service/image/workflow/VPS pull/`--remove-orphans`
- [x] Update development.md dual env-template contract
- [x] Point README at operations if needed
- [x] Run or explicitly skip Docker smoke with reason
- [x] Record redacted smoke notes
- [x] Leave archive GitLab docs untouched

## Success Criteria

- [x] No remaining canonical instruction to `docker compose logs itba-ai`
- [x] No canonical instruction to use `.gitlab-ci.yml` or GitLab registry
- [x] Health smoke documented with expected `{"ok":true}` on `$APP_PORT`
- [x] Staging vs production tags documented; VPS pin is not `:latest`
- [x] GitHub Environments listed as a verification gate, not an assumption
- [x] Secret policy restated: runtime `.env` on VPS, public build-args in
      GitHub Environments, nothing in git

## Risk Assessment

Docs that still say `itba-ai` will send operators to the wrong service after
rename — grep canonical `docs/` (not archive) for `itba-ai` and `gitlab` before
closing the phase.

If cook cannot start Docker Desktop on Windows, do not claim the image runs;
gate “compose up healthy” as a remaining operator check rather than inventing a
pass.
