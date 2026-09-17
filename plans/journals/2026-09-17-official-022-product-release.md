---
title: Official 0.2.2 product release
date: 2026-09-17
summary: "Cut release/0.2.2, merged PR #42 to main, tagged v0.2.2"
---

# Official 0.2.2 product release

## What happened
Official 0.2.2 released. `release/0.2.2` cut from `develop` after PR #41 merged. PR #42 (`chore(release): publish 0.2.2`) merged to `main` as `15468af`. GitHub Release: https://github.com/DatTran26/down-town/releases/tag/v0.2.2

Staging docker-publish after #41 built GHCR `sha-332a1d4` but deploy failed with `No such image: itba-ocr-staging-vision-ai-api:latest` because `web` depended on Vision sidecars. `deploy/vps/remote-up.sh` now uses `compose up --no-deps web`.

## Decision
Patch 0.2.2, not 0.3.0. Frontend manifest stays 1.6.4. Promote the full develop-since-0.2.1 product (Vision/OCR, recruitment reports, AI providers, Face ID reauth). Invalid `develop` → `main` PR #33 was commented, not merged.

## Next steps
- Confirm production health at https://production.wpcteam.shop after docker-publish on main.
- Optionally close PR #33.
- `scripts/create-release.ps1` is still missing; this release used `gh release create`.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
