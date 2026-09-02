---
title: "Phase 1: Align Docker artifacts"
status: todo
phase: 1
priority: P1
effort: "2h"
dependencies: []
---

# Phase 1: Align Docker artifacts

## Overview

Make the repo-root compose file and `Frontend/Dockerfile` a single working
local/VPS runtime: build context `Frontend/`, Town Hown identity, health probe,
runtime secrets only via env file.

## Requirements

- Functional: `docker compose up --build` from repo root produces a running
  `web` service on host port 3000 (override with `APP_PORT`).
- Functional: `/api/health` returns 200 without the handler **or middleware**
  calling Supabase (`Frontend/src/middleware.ts` early-return before
  `createServerClient` / `getUser()`).
- Non-functional: non-root user, no secret build-args, `.dockerignore` uses an
  explicit `.env.*` glob (today only literals at `Frontend/.dockerignore:8-11`).
- Non-functional: default image name `ghcr.io/dattran26/down-town`.

## Architecture

```text
docker-compose.yml
  web:
    image: ${DOCKER_IMAGE:-ghcr.io/dattran26/down-town:local}
    build:
      context: ./Frontend
      dockerfile: Dockerfile
      args: NEXT_PUBLIC_* from env
    ports: "${APP_PORT:-3000}:3000"
    env_file: .env (required: false)
    healthcheck: GET /api/health
```

Local path uses `build:`. VPS path sets `DOCKER_IMAGE` to an immutable
tag/digest and runs `docker compose pull` (no rebuild on the server). Do not
use `:latest` as the VPS pin.

## Related Code Files

- Modify: `Frontend/Dockerfile`
- Modify: `Frontend/.dockerignore`
- Modify: `Frontend/src/middleware.ts`
- Modify: `docker-compose.yml`
- Create: `Frontend/src/app/api/health/route.ts`
- Create: `.env.example` (repo root; gitignore already has `!.env.example`)
- Keep: `Frontend/.env.example` for `npm run dev` (do not delete)

## Implementation Steps

1. Add `GET /api/health` App Router handler:
   - `export const dynamic = "force-dynamic"`
   - JSON `{ ok: true }`
   - no env reads, no Supabase client
2. <!-- RED-TEAM F1 --> Patch `Frontend/src/middleware.ts`:
   - Before reading `NEXT_PUBLIC_SUPABASE_*` or calling `getUser()`, if
     `request.nextUrl.pathname === '/api/health'` (and optional trailing slash),
     return `NextResponse.next()`
   - Do not add `/api/health` to `publicRoutes` only — that still runs
     `getUser()` first (`Frontend/src/middleware.ts:41` then `:45-48`)
3. Update `Frontend/Dockerfile`:
   - OCI labels: title `Town Hown`, source
     `https://github.com/DatTran26/down-town`
   - Keep 4-stage standalone + `USER nextjs`
   - Add `ARG`/`ENV` for `NEXT_PUBLIC_APP_URL` and
     `NEXT_PUBLIC_ENABLE_TURNSTILE` on the **builder** only
   - <!-- RED-TEAM F8 --> Do **not** claim runner `ENV` overrides these. Next
     inlines `process.env.NEXT_PUBLIC_*` at `next build` (see
     `Frontend/src/app/api/recruitment/sessions/[id]/notify/route.ts:57`).
     Re-declaring them on the runner is optional noise, not a runtime fix.
   - Do **not** add `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `DATABASE_URL`
   - `HEALTHCHECK` using `node` + `fetch` against `http://127.0.0.1:3000/api/health`
   - <!-- RED-TEAM --> `CHANGELOG.md` copy stays; treat runtime appends as
     ephemeral (no volume in v1)
4. <!-- RED-TEAM F3 --> Replace env ignores in `Frontend/.dockerignore`:
   - `.env`, `.env.*`, `!.env.example` (current file is literals only at
     `Frontend/.dockerignore:8-11`)
   - Keep excluding `node_modules`, `.next`, `.git`
   - Do not exclude `public/`, `CHANGELOG.md`, CSS/source needed for Tailwind
   - Do not add a blanket `*.mjs` ignore (legacy CSS break)
5. Replace root `docker-compose.yml`:
   - Service name `web`
   - `image` + `build` as above
   - <!-- RED-TEAM F2 --> `env_file` with `required: false`
   - <!-- RED-TEAM F5 --> build-args use `${NEXT_PUBLIC_SUPABASE_URL:?set in .env}`
     and the same for `ANON_KEY` so empty local bake fails loudly
   - `restart: unless-stopped` — <!-- RED-TEAM F13 --> does **not** restart
     `unhealthy`; document that in phase 3
   - Compose `healthcheck` matching the image (interval 30s, start_period 25s)
   - No extra services, no CHANGELOG volume
6. Add root `.env.example` with **names only** (compose/VPS template; keep
   `Frontend/.env.example` for Next.js local):
   - `DOCKER_IMAGE`, `APP_PORT`
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_ENABLE_TURNSTILE`
   - `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `OPENAI_API_KEY`, `OPENAI_MODEL`
   - Point readers to copy into gitignored `.env`
7. Compose snippet to use (implementation should match this contract):

```yaml
services:
  web:
    image: ${DOCKER_IMAGE:-ghcr.io/dattran26/down-town:local}
    build:
      context: ./Frontend
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL:?set in .env}
        NEXT_PUBLIC_SUPABASE_ANON_KEY: ${NEXT_PUBLIC_SUPABASE_ANON_KEY:?set in .env}
        NEXT_PUBLIC_APP_URL: ${NEXT_PUBLIC_APP_URL:-}
        NEXT_PUBLIC_ENABLE_TURNSTILE: ${NEXT_PUBLIC_ENABLE_TURNSTILE:-}
    ports:
      - "${APP_PORT:-3000}:3000"
    env_file:
      - path: .env
        required: false
    restart: unless-stopped
    healthcheck:
      test:
        [
          "CMD",
          "node",
          "-e",
          "fetch('http://127.0.0.1:3000/api/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))",
        ]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 25s
```

## Todo

- [x] Add `/api/health` route with no secret/IO side effects
- [x] Early-return `/api/health` in middleware before Supabase
- [x] Relabel and extend Dockerfile builder ARGs; add HEALTHCHECK
- [x] Replace `.dockerignore` env rules with `.env.*`
- [x] Rewrite compose (`web`, optional env_file, `:?` build-args, healthcheck)
- [x] Add root `.env.example` (names only); keep Frontend copy

## Success Criteria

- [x] `docker compose config` succeeds on a clone with no `.env`
- [x] Build context is `Frontend/` (compose config shows that)
- [x] Health route file exists and does not import `@/lib/supabase/*`
- [x] Middleware returns next for `/api/health` before `getUser()`
- [x] Dockerfile has no `ARG` for service-role / OpenAI / DATABASE_URL
- [x] Service name `itba-ai` is gone from compose
- [x] Default compose image is not `:latest`

## Risk Assessment

<!-- RED-TEAM F1 --> If middleware still calls `getUser()` on `/api/health`,
Supabase downtime or missing bake marks the container unhealthy. Early-return
is mandatory.

<!-- RED-TEAM F2 --> If `env_file` stays required, `docker compose config`
fails on a clean clone.

If Compose v1 vs v2 differs on Windows, document Compose v2
(`docker compose`, not `docker-compose`). Optional `env_file.required` needs
Compose ≥2.24.

If `.dockerignore` drops CSS inputs, static 404s appear after a green health
probe — keep source and `public/` in the context.
