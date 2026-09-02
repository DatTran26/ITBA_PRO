---
phase: 3
title: "Document Library UI + API Routes"
status: pending
effort: 3h
blockedBy: [1, 2]
blocks: [5, 7]
---

# Phase 3 — Document Library UI + API Routes

## Context Links
- Auth helper pattern: `src/app/api/document-sources/route.ts` lines 6–19 (`getAuthContext`, `isAdmin`, `isLeader`)
- Existing upload POST: `src/app/api/document-sources/route.ts` lines 22–79 (storage upload pattern)
- `DocumentSource` type: `src/components/question-bank/question-bank-types.ts` lines 71–88
- Pipeline tab entry point: `src/app/dashboard/question-bank/question-bank-ai-pipeline-tab.tsx` line 123 (`<DocumentUploadForm>`)
- Storage bucket already exists: `document-sources` (used by existing upload route line 53)

## Overview

Build the Document Library: a shared repository of documents scoped to a team/department. Users upload once; documents persist across pipeline runs. The QB AI Pipeline tab gains a "Pick from Library" option alongside the existing upload form.

## Architecture

### Data Flow

```
Library Panel (UI)
  → GET /api/documents?teamId=...         → list documents (with status, last run)
  → POST /api/documents (FormData)        → upload + extract text (Phase 2) + store
  → DELETE /api/documents/[id]            → soft-delete (sets deleted_at)

QB AI Pipeline Tab — "Pick from Library"
  → user selects document from library panel
  → POST /api/document-sources (body: { documentId })   ← new variant
  → edge function invoked with documentId (uses stored extracted_text)
  → same polling flow as before
```

### Component Tree

```
QuestionBankAiPipelineTab (existing, modified in Phase 7)
  └── DocumentSourceSelector (NEW)
        ├── tab: "Upload New"  → DocumentUploadForm (existing, unchanged)
        └── tab: "From Library" → DocumentLibraryPanel (NEW)
              ├── DocumentLibrarySearch (NEW, inline search/filter)
              └── DocumentLibraryCard[] (NEW, one per document)
```

### API Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/documents` | leader/admin | List library docs for team (excludes deleted) |
| POST | `/api/documents` | leader/admin | Upload new doc to library |
| GET | `/api/documents/[id]` | leader/admin | Single doc details |
| DELETE | `/api/documents/[id]` | owner or admin | Soft-delete |
| POST | `/api/document-sources` | leader/admin | Existing — add `documentId` body variant |

### Role Rules

| Action | recruiter | leader | admin/super_admin |
|--------|-----------|--------|-------------------|
| View library | No | Own team | All teams |
| Upload | No | Yes | Yes |
| Delete own | No | Yes | Yes |
| Delete any | No | No | Yes |

Note: Current codebase has no `recruiter` role gating at document level; leaders and admins are the only roles allowed (mirrors existing `document_sources` policy).

## Requirements

**Functional**
- Library list: file name, type icon, uploaded by, upload date, last pipeline run status
- Search by file name (client-side filter — library will be small, no pagination needed initially)
- Upload from library panel: same file types as existing (pdf, docx, txt; md maps to txt)
- Selecting a library doc triggers a new pipeline run linked via `document_id` FK
- Admin sees all team documents; leader sees own team only
- Soft-delete: `deleted_at` set; file stays in Storage (admins can recover within 30d)

**Non-functional**
- API routes: `export const runtime = "nodejs"` (uses Phase 2 parsing module)
- Each component file ≤ 200 lines — split if needed
- No pagination on initial implementation (YAGNI — add when library > 50 docs)

## Related Code Files

**Create**
- `src/app/api/documents/route.ts` — GET list, POST upload
- `src/app/api/documents/[id]/route.ts` — GET single, DELETE soft-delete
- `src/components/question-bank/document-library-panel.tsx` — main library UI
- `src/components/question-bank/document-library-card.tsx` — single document card
- `src/components/question-bank/document-source-selector.tsx` — tab switcher (Upload New / From Library)

**Modify**
- `src/app/api/document-sources/route.ts` — POST handler: add `documentId` body branch (alongside existing file/URL branch); link `document_sources.document_id`
- `src/components/question-bank/question-bank-types.ts` — add `Document` interface
- `src/app/dashboard/question-bank/question-bank-ai-pipeline-tab.tsx` — swap `<DocumentUploadForm>` for `<DocumentSourceSelector>` (Phase 7 handles wiring)

## Implementation Steps

1. Add `Document` interface to `question-bank-types.ts`:
   ```ts
   export interface Document {
     id: string; title: string; file_type: string; source_type: 'upload' | 'google_drive';
     storage_path: string | null; drive_file_id: string | null;
     uploaded_by: string; created_at: string; updated_at: string;
     deleted_at: string | null;
   }
   ```
2. Create `src/app/api/documents/route.ts`:
   - GET: query `documents` table WHERE `deleted_at IS NULL` + team scope; return list
   - POST: validate file (same rules as existing upload), call `extractTextFromBuffer` (Phase 2), upload to Storage at `library/{teamId}/{timestamp}-{filename}`, insert `documents` row with `extracted_text`
3. Create `src/app/api/documents/[id]/route.ts`:
   - GET: single document details + last pipeline run status (JOIN `document_sources` ORDER BY created_at DESC LIMIT 1)
   - DELETE: role check → set `deleted_at = now()`; return 204
4. Modify `src/app/api/document-sources/route.ts` POST:
   - Detect `documentId` in form body (alongside existing `file`/`source_url`)
   - If `documentId`: fetch `documents` row, verify ownership/team, insert `document_sources` with `document_id` populated, invoke edge function (passes `documentId`; edge function reads `documents.extracted_text`)
5. Create `src/components/question-bank/document-library-card.tsx`:
   - Props: `document: Document`, `onSelect: (id: string) => void`, `onDelete: (id: string) => void`
   - Show: icon by file type, title, uploader name, date, last run status badge
   - ≤ 150 lines
6. Create `src/components/question-bank/document-library-panel.tsx`:
   - Fetches `GET /api/documents` on mount
   - Client-side search filter by title
   - Renders `DocumentLibraryCard[]`
   - "Upload to Library" button opens file picker inline
   - ≤ 180 lines; split search into inline if grows
7. Create `src/components/question-bank/document-source-selector.tsx`:
   - Two-tab switcher: "Upload New" (renders existing `DocumentUploadForm`) | "From Library" (renders `DocumentLibraryPanel`)
   - Props: `onSuccess: (documentId: string) => void` (same signature as current `DocumentUploadForm.onSuccess`)
   - ≤ 80 lines

## Todo List

- [ ] Add `Document` interface to `question-bank-types.ts`
- [ ] Create `GET /api/documents` (list)
- [ ] Create `POST /api/documents` (upload to library)
- [ ] Create `GET /api/documents/[id]` (single)
- [ ] Create `DELETE /api/documents/[id]` (soft-delete)
- [ ] Modify `POST /api/document-sources` to support `documentId` body variant
- [ ] Create `document-library-card.tsx`
- [ ] Create `document-library-panel.tsx`
- [ ] Create `document-source-selector.tsx`
- [ ] Verify Storage path `library/{teamId}/...` does not conflict with existing `{userId}/...` paths
- [ ] Test: upload file → appears in library → select from library → pipeline starts

## Success Criteria

- Leader uploads a PDF → appears in library panel
- Leader picks library doc → pipeline run created (new `document_sources` row with `document_id` set)
- Admin sees all team documents; leader sees own team only
- Soft-delete removes from UI; Storage file retained
- `DocumentSourceSelector` renders identically to existing upload form when "Upload New" tab active (no regression)

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Storage bucket path collision between library and pipeline uploads | Low | Medium | Use distinct prefix `library/` vs `{userId}/` (existing) |
| `extracted_text` column missing if Phase 1 implementer missed the addendum | Medium | High | Phase 3 POST route must handle null `extracted_text` gracefully; fall back to edge function re-extraction |
| Team scoping — `team_id` on `documents` if `teams` table doesn't exist | Medium | High | Phase 1 must resolve this; Phase 3 blocked until confirmed |
| Library grows large over time without pagination | Low | Low | Add pagination in future; YAGNI now |

## Unresolved Questions

- Confirm team scoping field name (`team_id` vs `department_id` vs `organization_id`) from existing schema.
- Should library uploads trigger topic extraction immediately (eager) or only when user picks from library (lazy)? Recommend lazy — cheaper, simpler.
