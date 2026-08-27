# v1.0.1 Missing Features: Edit AI Summary + Export PDF

## Status: Complete

## Summary

Implement 2 remaining v1.0.1 features for the Candidate Result Detail page:
1. **Edit AI Summary** — Allow editing ai_analysis fields (overall_assessment, strengths, weaknesses, recommendation)
2. **Export PDF Report** — Generate downloadable PDF from result data

## Phases

| # | Phase | Status | Effort | Files |
|---|-------|--------|--------|-------|
| 1 | Edit AI Summary (API + UI) | Complete | Small | 2 files |
| 2 | Export PDF Report (lib + UI) | Complete | Medium | 3 files |

## Key Decisions

- **PDF library**: `jspdf` + `jspdf-autotable` (client-side generation). All data already loaded in client — no API endpoint needed. Lightweight, no server overhead.
- **Edit AI Summary**: Reuse existing PATCH `/api/results/[id]` endpoint by adding `ai_analysis` field support. Toggle edit mode in UI with inline editing.
- **File size**: result-detail-client.tsx is 952 LOC (over 200 limit). Extract PDF generation to a separate utility module. Extract AI edit section to a separate component.

## Architecture

```
Existing:
  PATCH /api/results/[id] → { note, status }

After:
  PATCH /api/results/[id] → { note, status, ai_analysis }

New files:
  src/lib/generate-result-pdf.ts       — PDF generation utility
  src/components/result/               — Extracted components (if needed)
```

## Phase Details

→ [Phase 1: Edit AI Summary](./phase-01-edit-ai-summary.md)
→ [Phase 2: Export PDF Report](./phase-02-export-pdf-report.md)
