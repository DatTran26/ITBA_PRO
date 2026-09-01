---
title: "Brainstorm — Docker deploy setup"
created: 2026-09-02
status: accepted
---

# Brainstorm — Docker deploy setup

## Outcome

Working Docker runtime for the Next.js app plus GHCR publish for staging and
production tags, without SSH deploy or secrets in git.

## Constraints

Frontend-only container. Backend is Supabase, not a container. Hygiene forbids
`.gitlab-ci.yml`. AGENTS.md: staging/production, no deploy secrets in v1.
Public GitHub repo `DatTran26/down-town`.

## Non-goals

SSH/VPS CD, Kubernetes, Cloud Run, GitLab, Vercel, Backend/vision-ocr images,
local Postgres, multi-arch.

## Acceptance

Local `docker compose up --build` healthy on :3000. GHCR workflow on `develop`
and `v*` using `GITHUB_TOKEN`. Docs match files.

## Options compared

| Approach | Assumption | First failure |
| --- | --- | --- |
| A. Local-only compose | Operators never need a registry | Cannot deploy a tagged artifact to staging/prod |
| B. VPS-ready compose, no CI | Humans build on the VPS | Drift, no immutable tags, NEXT_PUBLIC bake happens on the server |
| C. VPS-ready + GHCR publish | GitHub Environments exist; package can be public | First push fails until Environments are filled; private package blocks anonymous pull |

**Selected:** C (user).

## Recommendation rationale

C is the smallest setup that is actually a deploy path. SSH CD is the next
plan, after host-key pinning and secret-file permissions exist outside git.
