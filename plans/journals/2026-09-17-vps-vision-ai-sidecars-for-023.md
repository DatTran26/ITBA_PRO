---
title: VPS Vision AI sidecars for 0.2.3
date: 2026-09-17
summary: "Official 0.2.3 ships Vision AI/OCR GHCR images so Face ID, YOLO, and OCR run on VPS."
---

# VPS Vision AI sidecars for 0.2.3

## What happened
0.2.2 dashboard Vision called Python APIs that were never deployed. `remote-up.sh` used `compose up --no-deps web` after missing `itba-ocr-staging-vision-ai-api:latest`. OCR BFF hardcoded `localhost:8000` inside the `web` container.

## Decision
Patch 0.2.3, not 0.3.0. Frontend manifest stays 1.6.4. Publish `down-town-vision-ai` and `down-town-vision-ocr` to GHCR. Keep YOLO weights off git; the operator copies them to `models/vision-ai/`. Allow Face ID on `staging.wpcteam.shop` and `production.wpcteam.shop`. Trust `x-forwarded-host` only when `Host` is the Compose service name.

## Next steps
- Merge `develop-dat` to `develop`, cut `release/0.2.3` to `main`, tag `v0.2.3`.
- Operator: `GEMINI_API_KEY` on VPS `.env`; copy `smoking.pt` / `leaving.pt` (or onnx) onto the host.
- First Face ID enroll downloads InsightFace `buffalo_l` (needs GitHub HTTPS).

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
