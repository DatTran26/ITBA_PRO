# Changelog

All notable changes to this project are documented in this file.

## [0.2.2] - 2026-09-17

### Added

- OpenAI and Gemini provider routing from System Settings, with masked API keys.
- Face ID re-authentication links, claim-before-process enrollment, and an active-request guard.
- Internal-user role guard used by settings RLS and privileged Edge Functions.
- Workplace Vision: Face ID attendance, behavior monitors, and OCR studio on the dashboard.
- Recruitment management report with KPI snapshot and Excel export.
- HRMS feature documentation set (PRD feature map 39/39).

### Changed

- AI routes and Edge Functions read provider/model/key from `system_settings`, with env as fallback.
- Vision AI controller tests accept a persisted match threshold.
- VPS `remote-up.sh` recreates only the GHCR `web` service (`--no-deps`) so missing local Vision images do not block deploy.

### Fixed

- Privileged Edge Functions require an internal JWT/role before using the service-role client.
- Face ID sign-in is rate-limited and cannot clear a block with a revoked token.
- Gemini Vision calls send the API key in `x-goog-api-key` instead of the query string.

[0.2.2]: https://github.com/DatTran26/down-town/compare/v0.2.1...v0.2.2

## [0.2.1] - 2026-09-02

### Added

- Open Graph and Twitter share image for ITBA.CORE (`/og-image.jpg`, 1200x630).

### Fixed

- Traefik terminates Cloudflare Full SSL on origin `:443` so `https://` is served and `http://` redirects to HTTPS.

[0.2.1]: https://github.com/DatTran26/down-town/releases/tag/v0.2.1

## [0.2.0] - 2026-09-02

### Added

- Town Hown Next.js app (`Frontend/`) with Supabase backend migrations.
- GitHub Actions `docker-publish`: GHCR `linux/amd64` images and SSH deploy as root.
- VPS layout `/opt/ITBA-OCR/staging` (port 2026) and `/opt/ITBA-OCR/production` (port 2005).

### Changed

- Push `develop` deploys staging (`staging.wpcteam.shop`); push `main` deploys production (`production.wpcteam.shop`).
- Staging and production stay separate baked `NEXT_PUBLIC_*` images.

[0.2.0]: https://github.com/DatTran26/down-town/releases/tag/v0.2.0

## [0.1.0] - 2026-08-24

### Added

- Vision OCR module with a FastAPI scan endpoint and health check.
- Gemini Vision text extraction with local Tesseract fallback.
- React and TypeScript image upload interface for OCR scanning.
- Reproducible frontend production build with Vite and Tailwind CSS.
- Backend API and service tests plus frontend component coverage.

### Changed

- Isolated the Vision OCR implementation under `modules/vision-ocr`.
- Updated Vite to a release without the known development-server vulnerabilities.
- Enforced the GitFlow pull request policy for integration and release branches.

[0.1.0]: https://github.com/DatTran26/down-town/releases/tag/v0.1.0
