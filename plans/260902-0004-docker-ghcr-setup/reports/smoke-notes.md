# Smoke notes — Docker GHCR cook

Date: 2026-09-02

## Ran

- `docker compose -f docker-compose.yml config --no-interpolate` — pass.
  Service `web`, context `Frontend`, `env_file.required: false`, default image
  `:local`, healthcheck present.
- `docker compose config` (interpolated) — also parses. Do not paste this
  output; it includes runtime env names from a local `.env`.
- `docker compose up --build -d` — **skipped**. Docker Desktop Linux engine
  was not running (`npipe:////./pipe/dockerDesktopLinuxEngine` missing).

## Intentional compose interpolation tradeoff

Red-team F5 wanted `${VAR:?}` so empty local builds fail. That also makes
`docker compose config` fail on a clean clone (competing success criterion).
Implementation uses `${VAR:-}` plus optional `env_file` so parse works; CI
still fails closed on empty GitHub Environment vars. Fill root `.env` before
`up --build`.

## Static checks still done

- `Frontend/src/app/api/health/route.ts` exists, no Supabase import.
- `Frontend/src/middleware.ts` returns next for `/api/health` before
  `createServerClient` / `getUser()`.
- `.github/workflows/docker-publish.yml` has no SSH/`scp`/`.env` write steps.
- Canonical `docs/downtown/operations.md` uses `docker compose logs web`.

## Remaining operator checks

- Start Docker Desktop, then `docker compose up --build -d` and
  `curl -fsS http://127.0.0.1:3000/api/health` expecting `{"ok":true}`.
- Create GitHub Environments `staging` / `production` and GHCR public
  visibility before the first real publish.
