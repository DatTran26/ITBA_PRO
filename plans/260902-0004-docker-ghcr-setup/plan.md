---
title: "Docker + GHCR publish for Town Hown"
description: "Align Frontend Docker artifacts and publish linux/amd64 images to GHCR on develop (staging) and version tags (production), without SSH deploy or committed secrets."
status: completed
priority: P1
effort: 6h
issue:
branch: develop-dat
tags: [devops, docker, ghcr, ci]
blockedBy: []
blocks: []
created: 2026-09-02
---

# Docker + GHCR publish for Town Hown

## Overview

Town Hown already has a Next.js standalone Dockerfile under `Frontend/` and a
root `docker-compose.yml`, but they do not form a working deploy path. Compose
pulls `itba-ai:latest` with no `build:` context. Dockerfile labels still point
at GitLab. GitLab CI is forbidden by hygiene. GitHub workflows do not build or
publish images. AGENTS.md names staging and production and forbids deploy
secrets in the repository for v1.

This plan makes `docker compose up --build` work locally, makes the same compose
file VPS-ready via an immutable GHCR tag, and adds GitHub Actions that build and
push those tags. VPS `docker compose pull` stays a manual operator step. No SSH,
no Kubernetes, no GitLab.

## Brainstorm contract (accepted)

| Field | Decision |
| --- | --- |
| **Outcome** | A developer or operator can build and run the Next.js app as a non-root container on port 3000, and GitHub publishes `linux/amd64` images to GHCR for staging (`develop`) and production (`v*` tags) without committing secrets. |
| **Constraints** | App lives in `Frontend/`; `Backend/` is Supabase migrations/utilities, not a long-running server. Hygiene must not regain `.gitlab-ci.yml`. Runtime secrets stay in env files / GitHub Environments, never Docker `ARG`. Public `NEXT_PUBLIC_*` may be build-args. Repo is public (`DatTran26/down-town`). Host VPS is assumed amd64. |
| **Non-goals** | SSH/VPS auto-deploy, Cloudflare/nginx config, Kubernetes/Helm/Cloud Run, Backend or vision-ocr containers, GitLab, Vercel, local Postgres in compose, multi-arch images. |
| **Acceptance** | Local compose parses without a committed `.env`. After filling public Supabase keys, `up --build` runs a non-root container whose `/api/health` is excluded from auth middleware. GHCR workflow is actionlint-clean, uses `GITHUB_TOKEN`, and pushes staging vs production tags from separate builds. Docs match the executable files. No secret values in git. |

**Chosen direction:** VPS-ready compose + GHCR publish (user selected). Smallest
path that still satisfies “deploy setup Docker” under “no deploy secrets in v1”.

**Rejected:** local-only compose (cannot deploy). Full SSH CD (secrets + host
key pinning; AGENTS.md v1 forbids this in-repo). Re-adding GitLab CI (hygiene
hard-fail).

## Scope challenge

HOLD SCOPE. Do not add SSH deploy, extra services, or a second runtime.

### What already exists

- `Frontend/Dockerfile` — 4-stage Node 20 Alpine, standalone copy, non-root
  `nextjs`, `NEXT_PUBLIC_SUPABASE_*` build-args. Labels still say ITBA AI / GitLab.
- `Frontend/next.config.ts` — `output: "standalone"`.
- `Frontend/.dockerignore` — excludes `.env*`, `node_modules`, `.next`.
- `docker-compose.yml` — single service `itba-ai`, image-only, `env_file: .env`,
  no build, no healthcheck.
- `docs/downtown/operations.md` — current ops owner; already documents
  `docker build -f Frontend/Dockerfile Frontend` and forbids GitLab CI.
- `.github/workflows/{hygiene,branch-policy,workflows-lint}.yml` — no Docker job.
- No `/api/health` route.

### What the user asked for

Docker deploy setup, brainstorm then plan, then GHCR CI on top of VPS-ready
compose. Full requested scope: artifacts + publish workflow + docs/smoke.

### Complexity

Three phases, about eight files, no new application services. Health route is
the only product-code addition, and only to make compose/load-balancer probes
honest.

## Architecture

```text
Developer / CI
  docker build -f Frontend/Dockerfile Frontend
        │  build-args: NEXT_PUBLIC_SUPABASE_URL
        │              NEXT_PUBLIC_SUPABASE_ANON_KEY
        │              NEXT_PUBLIC_APP_URL (optional)
        │              NEXT_PUBLIC_ENABLE_TURNSTILE (optional)
        ▼
  ghcr.io/dattran26/down-town:<tag>
        │
        ├─ local:  docker compose up --build
        └─ VPS:    DOCKER_IMAGE=ghcr.io/dattran26/down-town:<tag>
                   docker compose pull && docker compose up -d

Browser → Cloudflare/reverse proxy → host :3000 → container :3000
         → Next.js standalone (USER nextjs)
Runtime env_file (.env, never in git):
  SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL, OPENAI_API_KEY, ...
```

Image tags:

| Trigger | Image tags | Build-arg source |
| --- | --- | --- |
| Push `develop` | `:staging`, `:sha-<short>` | GitHub Environment `staging` |
| Push tag `v*` | `:latest`, `:x.y.z`, `:sha-<short>` | GitHub Environment `production` |
| `workflow_dispatch` | caller-selected environment | matching environment |

GHCR package should be **public** (repo is public; image must not contain
server secrets) so a VPS can `docker compose pull` without a PAT in v1.

## Dependencies

- Predecessor (done, not blocking): `plans/260827-1244-standardize-project-documentation`
  owns `docs/downtown/operations.md`. This plan updates that file to match the
  new compose/workflow; it does not revive archived GitLab runbooks.
- Orthogonal: `plans/260823-1449-enforce-pr-flow`.
- No `blockedBy` / `blocks`.

## Goals

| # | Goal | Priority |
|---|------|----------|
| 1 | Root compose builds from `Frontend/` and runs a healthy container on :3000 | P1 |
| 2 | Dockerfile is Town Hown / GitHub-accurate, health-probeable, no secret ARGs | P1 |
| 3 | GitHub Actions publishes staging and production images to GHCR | P1 |
| 4 | Canonical ops docs and root `.env.example` match the executable path | P1 |

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Align Docker artifacts](./phase-01-start.md) | Pending |
| 2 | [Publish images to GHCR](./phase-02-ghcr-publish.md) | Pending |
| 3 | [Ops docs and smoke](./phase-03-ops-docs-smoke.md) | Pending |

## Implementation notes

- Compose service rename: `itba-ai` → `web`. Update every canonical doc command
  (`docker compose logs web`). First VPS cutover must `docker compose down` the
  old service then `up --remove-orphans` so host `:3000` is not held by an
  orphaned `itba-ai` container.
- Image name: `ghcr.io/dattran26/down-town`. Local compose uses `build:` and
  may tag locally. VPS **must** set `DOCKER_IMAGE` to an immutable tag
  (`:1.6.4`, `:staging`, or `@sha256:…`). Do not rely on `:latest` for
  production pull/rollback.
- Healthcheck independence is enforced in **middleware**, not only the route
  file. `Frontend/src/middleware.ts` currently matches `/api/health` and calls
  `supabase.auth.getUser()` (`Frontend/src/middleware.ts:41`) or returns 500
  if public Supabase env is missing (`:12-16`). Phase 1 must early-return
  `/api/health` before any Supabase client is created.
- Add `Frontend/src/app/api/health/route.ts` returning `200` JSON
  `{ "ok": true }` with `Cache-Control: no-store` and no env reads.
- Prefer `node -e "fetch('http://127.0.0.1:3000/api/health')..."` over `wget`.
- `NEXT_PUBLIC_*` are inlined at `next build` in both client and server
  bundles. Runner-stage `ENV` cannot override them. Staging and production
  **must** be separate image builds. Never promote a `:staging` image to
  production by editing `.env`.
- Do not add `SUPABASE_SERVICE_ROLE_KEY` / `OPENAI_API_KEY` / `DATABASE_URL` as
  Docker build-args.
- `env_file: .env` must be optional (`required: false`) so `docker compose
  config` works on a clean clone. `up --build` still requires a populated
  `.env` (or shell env) via `${VAR:?…}` for the two public Supabase keys.
- Two env templates: `Frontend/.env.example` for `npm run dev`; root
  `.env.example` for compose/VPS. Phase 3 updates `docs/downtown/development.md`.
- `CHANGELOG.md` inside the image is ephemeral. Version approval already writes
  the DB; container recreate/rollback discards filesystem appends. Do not add a
  volume in v1; document the data-loss boundary.
- Compose `restart` does not restart `unhealthy` containers. Ops docs must not
  imply self-heal from the healthcheck.
- Do not recreate `.gitlab-ci.yml`.
- Pin GitHub Actions by full SHA at implementation time.
- Image tags follow **git tags** (`v*`), not `Frontend/package.json` (currently
  `1.6.4` while the repo tag is `v0.1.0`). Do not reconcile versions in this
  plan; document the mismatch.

## Success Criteria

- [ ] `docker compose -f docker-compose.yml config` is valid on a clean clone
      (no `.env` required for parse)
- [ ] After copying root `.env.example` → `.env` with public Supabase values,
      `docker compose up --build -d` starts `web` healthy
- [ ] `GET /api/health` returns 200 even if middleware would otherwise call
      Supabase (matcher/early-return proven)
- [ ] Container process is non-root
- [ ] `.github/workflows/docker-publish.yml` is actionlint-clean and uses `GITHUB_TOKEN` only
- [ ] `develop` → `:staging` + sha; `v*` → `:x.y.z` + sha; `:latest` is serialized
      and not the VPS default pin
- [ ] Production CI fails if `NEXT_PUBLIC_APP_URL` is empty
- [ ] Root `.env.example` lists compose keys; `Frontend/.env.example` remains
      the Next.js local template; no real values committed
- [ ] `docs/downtown/operations.md` and `development.md` match service `web`,
      GHCR flow, `--remove-orphans`, and `$APP_PORT`
- [ ] Hygiene still fails if `.gitlab-ci.yml` is re-added

## Risks

| Risk | Signal it broke | Pre-decided response |
| --- | --- | --- |
| Public GHCR package still private by default | VPS pull 401 | Set package visibility public once, or a read-only PAT only on the VPS (not in git) |
| Staging/prod `NEXT_PUBLIC_APP_URL` mixed | Magic links / Turnstile / notify emails point at wrong host | Separate image builds; never reuse a staging image in production |
| Tailwind/CSS missing in standalone | HTML 200, `/_next/static` 404 | Keep `.dockerignore` from excluding CSS sources; copy `.next/static` + `public` |
| Middleware still wraps `/api/health` | Probe 500 / `getUser()` in health logs | Early-return in middleware before Supabase client |
| Missing `.env` on clone | `env file not found` | `required: false` on env_file; `:?` on required build-args for `up --build` |
| Orphan `itba-ai` after rename | bind: address already in use on :3000 | `down` then `up --remove-orphans` |
| Mutable `:latest` race | VPS pull gets older release | Pin `DOCKER_IMAGE` to semver/sha; serialize production `:latest` pushes |
| `CHANGELOG.md` in container | Approval lines vanish after recreate | Treat as ephemeral; DB remains source of truth |
| Unhealthy but process alive | Compose `unhealthy`, restart policy idle | Document; recover by recreate/rollback, not restart policy |
| Windows Docker Desktop | Build works, file sharing slow | Document WSL2 engine; no Windows-container targets |

## Open questions

- [ ] Confirm GitHub Environments `staging` and `production` will be created on
      `DatTran26/down-town` (manual org/repo setting; cannot be done from a
      workflow file alone).
- [ ] Confirm production canonical URL for `NEXT_PUBLIC_APP_URL` (needed as
      production environment variable, not as a committed value).
- [ ] Confirm GHCR package visibility: public (recommended for v1, no pull
      credential) vs private (requires a VPS pull token).

These still block the first real GHCR push and the first VPS pull. They do not
block writing the files. Phase 3 must verify Environments exist (or record that
publish is blocked until they do) before claiming GHCR success.

## Red Team Review

### Session — 2026-09-02

**Findings:** 14 presented (13 accepted, 1 rejected)
**Severity breakdown:** 1 Critical, 7 High, 6 Medium (plus 1 rejected Medium)

| # | Finding | Severity | Disposition | Applied To |
|---|---------|----------|-------------|------------|
| 1 | Middleware wraps `/api/health` and calls Supabase | Critical | Accept | Phase 1, plan notes |
| 2 | `env_file: .env` missing on clean clone | High | Accept | Phase 1, success criteria |
| 3 | `.dockerignore` has no `.env.*` glob | High | Accept | Phase 1 |
| 4 | `itba-ai`→`web` orphans port 3000 | High | Accept | Phase 3, plan notes |
| 5 | Local compose has no empty build-arg guard | High | Accept | Phase 1 |
| 6 | `:latest` races across concurrent `v*` tags | High | Accept | Phase 2–3 |
| 7 | Production CI does not guard `NEXT_PUBLIC_APP_URL` | High | Accept | Phase 2 |
| 8 | `NEXT_PUBLIC_*` runner ENV cannot override bake | Medium | Accept | Phase 1, plan notes |
| 9 | Mutable public tags / no digest pin | Medium | Accept (docs digest; no cosign in v1) | Phase 3 |
| 10 | Git tags (`v0.1.0`) ≠ `package.json` `1.6.4` | Medium | Accept (document only) | Phase 2–3 |
| 11 | GitHub Environments not creatable from git | Medium | Accept (Phase 3 gate) | Phase 3 |
| 12 | `APP_PORT` vs hardcoded `:3000` smoke | Medium | Accept | Phase 3 |
| 13 | `restart` does not heal `unhealthy` | Medium | Accept (docs) | Phase 1, 3 |
| 14 | Two `.env.example` files | Medium | Accept (dual template) | Phase 1, 3 |
| 15 | `github.actor` + `GITHUB_TOKEN` login | Medium | Reject | — |

**Reject rationale (15):** Official GHCR login uses `username: github.actor` and
`password: GITHUB_TOKEN`. Token permissions come from the workflow
`permissions:` block, not the triggering user's package ACL.

**Out of v1 (accepted as docs, not extra product work):** CHANGELOG volume /
rewrite approval to DB; cosign/provenance; aligning app semver with git tags.

### Whole-Plan Consistency Sweep

- Files reread: `plan.md`, `phase-01-start.md`, `phase-02-ghcr-publish.md`,
  `phase-03-ops-docs-smoke.md`
- Decision deltas checked: 9
  - health independence = middleware early-return
  - `env_file.required: false`
  - `.dockerignore` `.env.*` replace (not keep)
  - compose default image `:local` not `:latest`
  - VPS pin immutable tag/digest + `--remove-orphans`
  - `NEXT_PUBLIC_*` bake-only (no runner override)
  - production `APP_URL` guard + serialized `:latest`
  - dual `.env.example` templates
  - git tags ≠ package.json (document only)
- Reconciled stale references: architecture `:latest` in phase 1; compose
  snippet `:?` + optional env_file; phase 2 example tag `v0.1.0`; phase 3
  operator loop
- Unresolved contradictions: 0

## Handoff

Red-team applied. Next: `/ak:plan validate plans/260902-0004-docker-ghcr-setup`
or `/ak:cook plans/260902-0004-docker-ghcr-setup`.

<!-- slug: docker-ghcr-setup -->
