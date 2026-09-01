---
title: "Phase 2: Publish images to GHCR"
status: todo
phase: 2
priority: P1
effort: "2.5h"
dependencies: [1]
---

# Phase 2: Publish images to GHCR

## Overview

Add a root GitHub Actions workflow that builds `Frontend/Dockerfile` and pushes
`linux/amd64` tags to `ghcr.io/dattran26/down-town`. Staging builds on `develop`;
production builds on `v*` tags. Authentication is `GITHUB_TOKEN` only. No SSH,
no `.env` upload, no GitLab.

## Requirements

- Functional: push to `develop` publishes `:staging` and `:sha-<short>`.
- Functional: push of tag `v0.1.0` (example: current repo tag, **not**
  `Frontend/package.json` `1.6.4`) publishes `:0.1.0`, `:latest`, and `:sha-<short>`.
- Functional: `workflow_dispatch` can target staging or production.
- Non-functional: actionlint-clean; pinned actions; no secret echo; build-args
  come from GitHub Environments, not the repository tree.
- Non-functional: `permissions` is least-privilege (`contents: read`,
  `packages: write`).

## Architecture

```text
on:
  push.branches: [develop]     → environment: staging
  push.tags:     ['v*']        → environment: production
  workflow_dispatch.choice     → selected environment

jobs.build:
  permissions: contents:read, packages:write
  checkout
  docker/setup-buildx
  docker/login ghcr.io (GITHUB_TOKEN)
  docker/metadata → tags
  docker/build-push
    context: Frontend
    file: Frontend/Dockerfile
    platforms: linux/amd64
    cache: type=gha
    build-args from env:
      NEXT_PUBLIC_SUPABASE_URL
      NEXT_PUBLIC_SUPABASE_ANON_KEY
      NEXT_PUBLIC_APP_URL
      NEXT_PUBLIC_ENABLE_TURNSTILE
```

Required GitHub Environment variables (names only; values stay in the GitHub UI):

| Variable | staging | production |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | staging Supabase URL | production Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | staging anon key | production anon key |
| `NEXT_PUBLIC_APP_URL` | staging origin | production origin |
| `NEXT_PUBLIC_ENABLE_TURNSTILE` | `true`/`false` as needed | `true`/`false` as needed |

These are public-by-design client values. Still do not print them in `run:`
scripts. Pass them only as `build-args`.

Do **not** put `SUPABASE_SERVICE_ROLE_KEY` in the workflow.

## Related Code Files

- Create: `.github/workflows/docker-publish.yml`
- Modify: none of the existing hygiene/branch-policy workflows unless a path
  filter conflict appears (none expected)

## Implementation Steps

1. Create `.github/workflows/docker-publish.yml` at repo root (GitHub only
   discovers workflows here). Frontend working directory is the Docker context,
   not `defaults.run.working-directory` for the whole job.
2. Use `concurrency`:
   - `github.ref` with `cancel-in-progress: true` for staging (`develop`)
   - <!-- RED-TEAM F6 --> a single group `ghcr-production-latest` with
     `cancel-in-progress: false` for production/`v*` jobs so concurrent tags
     cannot finish out of order and leave `:latest` on an older image
3. Resolve environment:
   - `develop` → `staging`
   - tag `v*` → `production`
   - dispatch → input
4. Login:

```yaml
- uses: docker/login-action@v3
  with:
    registry: ghcr.io
    username: ${{ github.actor }}
    password: ${{ secrets.GITHUB_TOKEN }}
```

   Pin the action SHA at implementation time.
   <!-- RED-TEAM reject F15 --> Keep `github.actor` + `GITHUB_TOKEN` (official
   GHCR pattern; token rights come from workflow `permissions:`).

5. Tags via `docker/metadata-action`:
   - staging: `type=raw,value=staging` plus `type=sha,prefix=sha-`
   - production: `type=semver,pattern={{version}}` from tag `v*` plus
     `type=raw,value=latest` plus sha
   - <!-- RED-TEAM F10 --> Image version follows the **git tag**, not
     `Frontend/package.json` (today `1.6.4` vs repo tag `v0.1.0`). Document;
     do not bump/reconcile versions in this plan.
6. `docker/build-push-action`:
   - `push: true`
   - `platforms: linux/amd64`
   - `provenance: false` / `sbom: false` for v1 (no cosign in this plan)
   - Always emit sha tags so operators can pin `@sha256:` / `:sha-…`
7. Fail the job if required public vars are empty:
   - Always: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - <!-- RED-TEAM F7 --> Production (and production dispatch): also
     `NEXT_PUBLIC_APP_URL` (notify route falls back to `http://localhost:3000`
     at `Frontend/src/app/api/recruitment/sessions/[id]/notify/route.ts:57`)
8. After first successful publish, operator sets GHCR package visibility to
   **public** (manual). Document in phase 3.
9. Run `actionlint` mentally against the file (CI will run
   `.github/workflows/workflows-lint.yml` on path `.github/workflows/**`).
   Do not add `pull_request` as a publish trigger.

## Todo

- [x] Add `docker-publish.yml` with develop/tag/dispatch triggers
- [x] Map Environments staging vs production to build-args
- [x] Pin Docker official actions by SHA
- [x] Restrict to `linux/amd64` and `GITHUB_TOKEN`
- [x] Guard empty required public build-args (including production `APP_URL`)
- [x] Serialize production `:latest` via `ghcr-production-latest`

## Success Criteria

- [x] Workflow file exists only under `.github/workflows/`
- [x] No SSH keys, `scp`, `ssh-keyscan`, or `.env` write steps
- [x] No `.gitlab-ci.yml`
- [x] `pull_request` is not a publish trigger
- [x] Image name is `ghcr.io/dattran26/down-town`
- [x] Staging and production cannot share a single baked `NEXT_PUBLIC_APP_URL`
- [x] Production job fails closed if `NEXT_PUBLIC_APP_URL` is empty
- [x] Production `:latest` pushes are serialized (`ghcr-production-latest`)

## Risk Assessment

If Environments are missing, the first `develop` push fails closed — that is
desired. Phase 3 must verify the GitHub UI exists rather than calling the
workflow file "done".

If the package stays private, VPS pull needs a PAT. Prefer public package.

Fork PRs must not publish: omit `pull_request` trigger.

<!-- RED-TEAM F6 --> `:latest` on every `v*` tag can race. Serialize production
jobs and tell VPS operators to pin semver/sha, not `:latest`.
