---
title: Cook Docker GHCR setup
date: 2026-09-02
summary: Implemented Frontend Docker + GHCR publish; compose up skipped (engine down)
---

# Cook Docker GHCR setup

## What happened

Cooked plans/260902-0004-docker-ghcr-setup: health route, middleware bypass, compose service web, GHCR workflow, ops/dev docs. Docker Desktop engine was down so `up --build` was skipped. `docker compose config --no-interpolate` passed.

## Decision

Kept `${VAR:-}` in compose so clean-clone `config` works; CI still guards empty public vars. Did not touch pre-existing login/Turnstile edits on Frontend/src/app/login/page.tsx.

## Next steps

Start Docker Desktop and smoke `/api/health`. Create GitHub Environments staging/production. Set GHCR package public after first push. Commit when the user asks.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
