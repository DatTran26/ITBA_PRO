---
title: Docker GHCR plan
date: 2026-09-02
summary: Brainstormed and planned Frontend Docker + GHCR publish without SSH
---

# Docker GHCR plan

## What happened

Inspected Town Hown Docker artifacts. Root `docker-compose.yml` still pulls `itba-ai:latest` with no build context. `Frontend/Dockerfile` is a working Next.js standalone image with GitLab-era labels. GitLab CI is blocked by hygiene. User chose VPS-ready compose plus GHCR publish, not SSH deploy.

## Decision

Accepted contract: Frontend-only container, GHCR `linux/amd64` on `develop` (`:staging`) and `v*` (`:x.y.z` + `:latest`), runtime secrets only in `.env` / GitHub Environments. Wrote plan `plans/260902-0004-docker-ghcr-setup` (3 phases). Backend stays Supabase, not a container.

## Next steps

Human review, then red-team (recommended) or cook the plan. GitHub Environments `staging`/`production` and GHCR package visibility remain operator setup, not git files.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
