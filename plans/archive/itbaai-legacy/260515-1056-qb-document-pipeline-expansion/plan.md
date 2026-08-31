---
title: "QB Document Pipeline Expansion"
description: "Extend QB AI pipeline with Document Library, Google Drive OAuth, extended file types, version diff/AI merge, and topic drag-and-drop."
status: pending
priority: P1
effort: 14h
branch: dev
tags: [question-bank, ai-pipeline, document-library, google-drive, dnd-kit, supabase]
created: 2026-05-15
---

# QB Document Pipeline Expansion

## Overview

Extends the completed 2-phase AI document pipeline with five major capabilities:
1. **Document Library** — shared per-team document storage with role-scoped access
2. **Google Drive OAuth** — live-linked imports via Google Picker; freshness detection on page open
3. **Extended File Types** — robust PDF, .docx, .txt/.md extraction at the API layer (Node.js)
4. **Version Diff + AI Merge** — when a document is updated, AI compares old topics vs new content and proposes a color-coded merge
5. **Topic DnD Merge/Split** — drag topic onto another to merge; drag key-point out to split into new topic

## Phase Dependency Graph

```
Phase 1 (DB Schema)
  └── Phase 2 (File Parsing Service)
        ├── Phase 3 (Document Library UI + API)   ← can start after Phase 2
        └── Phase 4 (Google Drive OAuth)           ← can start after Phase 2
              └── Phase 5 (Version Diff + AI Merge) ← needs Phase 3 + Phase 4
Phase 6 (Topic DnD) ← independent; needs only existing topic-review-panel.tsx
Phase 7 (Wire Everything) ← needs all prior phases
```

## Phases

| # | Phase | Effort | Status | Parallel? |
|---|-------|--------|--------|-----------|
| 1 | [DB Schema: documents table + versioning](./phase-01-db-schema.md) | 1h | pending | No — blocks all |
| 2 | [File Parsing Service (Node.js)](./phase-02-file-parsing-service.md) | 1.5h | pending | No — blocks 3, 4 |
| 3 | [Document Library UI + API Routes](./phase-03-document-library.md) | 3h | pending | With 4 after Phase 2 |
| 4 | [Google Drive OAuth + Picker + Live Link](./phase-04-google-drive-oauth.md) | 3h | pending | With 3 after Phase 2 |
| 5 | [Version Diff + AI Merge](./phase-05-version-diff-ai-merge.md) | 2.5h | pending | After 3 + 4 |
| 6 | [Topic Drag-and-Drop Merge/Split](./phase-06-topic-dnd.md) | 2h | pending | Independent |
| 7 | [Wire Everything into QB AI Pipeline Tab](./phase-07-wire-together.md) | 1h | pending | After all |

**Total effort estimate: ~14h**

## Key Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| `documents` table separate from `document_sources` | `document_sources` is per-pipeline-run; `documents` is the canonical library record. `document_sources` gets a `document_id` FK to link runs to library entries. |
| File parsing stays in Next.js API routes (Node.js) | Deno edge functions cannot run Node binaries; mammoth.js requires Node. Edge functions receive pre-extracted text. |
| Google OAuth refresh tokens stored in `user_oauth_tokens` table (Supabase Vault encrypted) | Tokens are sensitive; vault encryption at rest; per-user isolation. |
| Version diff via new edge function `diff-document-version` | Keeps diff logic serverless; existing `extract-document-topics` unchanged. |
| `@dnd-kit/core` for DnD | Not in package.json — must add. Lighter than react-beautiful-dnd; works with React 19. |

## File Ownership Map (no conflicts across parallel phases)

| Phase | Owns |
|-------|------|
| Phase 1 | `supabase/migrations/20260515000000_document_library.sql` |
| Phase 2 | `src/lib/document-parsing/` (new module directory) |
| Phase 3 | `src/app/api/documents/`, `src/components/question-bank/document-library-*.tsx` |
| Phase 4 | `src/app/api/auth/google-drive/`, `src/components/question-bank/google-drive-picker.tsx` |
| Phase 5 | `supabase/functions/diff-document-version/`, `src/components/question-bank/version-diff-*.tsx` |
| Phase 6 | `src/components/question-bank/topic-card.tsx` (dnd wrappers only), `src/components/question-bank/topic-review-panel-dnd.tsx` (new) |
| Phase 7 | `src/app/dashboard/question-bank/question-bank-ai-pipeline-tab.tsx` |

## Pre-flight Checks

- [x] `@dnd-kit/core` NOT in package.json — must install in Phase 6
- [x] `mammoth` NOT in package.json — must install in Phase 2
- [x] `pdf-parse` types exist (`@types/pdf-parse` in devDeps) but `pdf-parse` not in deps — confirm in Phase 2
- [x] `document_sources.format` CHECK constraint: `('pdf','docx','txt','url')` — `.md` must map to `txt` format
- [x] Supabase Vault available on all project tiers? Confirm before Phase 4
- [x] Google Cloud project/OAuth credentials needed before Phase 4 can be tested
