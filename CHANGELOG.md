# Changelog

All notable changes to this project are documented in this file.

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
