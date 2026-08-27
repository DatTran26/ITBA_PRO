---
phase: 2
title: "Manual Input: CRUD API, Bulk Import, Duplicate Detection"
status: pending
priority: P1
effort: "2–3d"
dependencies: [1]
---

# Phase 2: Manual Input

## Context Links
- Brainstorm: `plans/reports/brainstorm-260513-phase4-question-bank.md`
- Foundation: `plans/260513-phase4-question-bank-ai-pipeline/phase-01-foundation.md`
- Code standards: `docs/code-standards.md`
- Sidebar nav: `plans/260501-1706-sidebar-nav-redesign/`

## Overview
Leader can add questions to the bank manually (single form) or via bulk Excel/CSV upload with SHA-256 duplicate detection. CRUD API + UI.

## Requirements
- Functional:
  - API: `GET /api/question-bank` (list, filter by level/topic/search)
  - API: `POST /api/question-bank` (single create, leader/admin only)
  - API: `PUT /api/question-bank/[id]` (update, leader/admin only)
  - API: `DELETE /api/question-bank/[id]` (leader/admin only)
  - API: `POST /api/question-bank/bulk-import` (Excel/CSV upload, parse, dedup, insert)
  - UI: sidebar tab "Ngân hàng câu hỏi" with subpages: Overview, Manual Add, Bulk Import
  - Bulk import: parse 9-column template, SHA-256 dedup, return success/duplicate/error rows report
  - Provide downloadable import template (xlsx)
- Non-functional:
  - Bulk import supports up to 500 rows per file
  - Duplicate rows return warning (not hard error) — leader decides to skip or overwrite

## Architecture

### API Layer
```
src/app/api/question-bank/
  route.ts                    -- GET (list) + POST (single create)
  [id]/route.ts               -- PUT + DELETE
  bulk-import/route.ts        -- POST multipart/form-data
  template/route.ts           -- GET xlsx template download
```

### UI Layer
```
src/app/dashboard/question-bank/
  page.tsx                    -- Overview: stats + recent questions table
  add/page.tsx                -- Single question form
  import/page.tsx             -- Bulk import UI: upload + result report
src/components/question-bank/
  question-bank-table.tsx     -- Reusable data table (level filter, search, pagination)
  question-form.tsx           -- Single question form fields
  bulk-import-dropzone.tsx    -- File drop + parse preview
  import-result-report.tsx    -- Success/duplicate/error breakdown
```

### Duplicate Detection
- On single add: SHA-256(`question_text.trim().toLowerCase()`) → check `question_hash` UNIQUE constraint
- On bulk import: compute hash for each row client-side or server-side → batch SELECT existing hashes → report duplicates before insert

### Import Template Columns (9)
`question_text | option_a | option_b | option_c | option_d | correct_answer | level | explanation | points | time_limit`

## Related Code Files
- Create:
  - `src/app/api/question-bank/route.ts`
  - `src/app/api/question-bank/[id]/route.ts`
  - `src/app/api/question-bank/bulk-import/route.ts`
  - `src/app/api/question-bank/template/route.ts`
  - `src/app/dashboard/question-bank/page.tsx`
  - `src/app/dashboard/question-bank/add/page.tsx`
  - `src/app/dashboard/question-bank/import/page.tsx`
  - `src/components/question-bank/question-bank-table.tsx`
  - `src/components/question-bank/question-form.tsx`
  - `src/components/question-bank/bulk-import-dropzone.tsx`
  - `src/components/question-bank/import-result-report.tsx`
- Modify:
  - `src/components/ui/app-sidebar.tsx` (or equivalent nav file) — add "Ngân hàng câu hỏi" entry, leader/admin only
  - `src/lib/api/auth-helpers.ts` — already updated in Phase 1

## Implementation Steps

1. **API — CRUD** (`src/app/api/question-bank/route.ts`):
   - GET: query `question_bank` with optional `?level=`, `?topic=`, `?q=` filters; paginate (limit 50)
   - POST: validate body (required: question_text, option_a-d, correct_answer, level), compute `question_hash`, insert

2. **API — single question** (`src/app/api/question-bank/[id]/route.ts`):
   - PUT: update fields (recalculate `question_hash` if `question_text` changed)
   - DELETE: hard delete (no soft-delete needed at MVP)
   - Both: require `isLeader || isAdmin` via `getAuthContext()`

3. **API — bulk import** (`src/app/api/question-bank/bulk-import/route.ts`):
   - Accept `multipart/form-data` with file (xlsx/csv, max 2MB)
   - Parse with `xlsx` npm package
   - Validate each row (required columns, correct_answer ∈ {a,b,c,d}, level ∈ {junior,middle,senior})
   - Compute SHA-256 hash per row (`crypto.createHash('sha256')`)
   - Batch query existing hashes → separate duplicates
   - Insert valid non-duplicate rows; return `{ inserted, duplicates, errors }` JSON

4. **API — template** (`src/app/api/question-bank/template/route.ts`):
   - Return static xlsx file with header row + 2 sample rows
   - Content-Disposition: attachment

5. **Sidebar navigation** — find existing sidebar component, add entry:
   ```
   { label: "Ngân hàng câu hỏi", href: "/dashboard/question-bank", icon: Database, roles: ["leader","admin"] }
   ```

6. **UI — Overview page** (`question-bank/page.tsx`):
   - Stats cards: total questions, by level breakdown
   - `question-bank-table.tsx` with level/topic filter chips + search input

7. **UI — Add page** (`question-bank/add/page.tsx`):
   - `question-form.tsx`: all fields, level select (junior/middle/senior), topic_tag input
   - Submit → POST `/api/question-bank` → toast success/duplicate error

8. **UI — Import page** (`question-bank/import/page.tsx`):
   - `bulk-import-dropzone.tsx`: drag-and-drop xlsx/csv, preview row count
   - Submit → POST `/api/question-bank/bulk-import`
   - `import-result-report.tsx`: table showing inserted/duplicate/error rows
   - "Download Template" button → GET `/api/question-bank/template`

## Todo List
- [ ] CRUD API (GET + POST `/api/question-bank`)
- [ ] Update + Delete API (`/api/question-bank/[id]`)
- [ ] Bulk import API with parse, dedup, insert
- [ ] Template download API
- [ ] Sidebar nav entry (leader/admin only)
- [ ] Overview page + question table component
- [ ] Add question form page
- [ ] Bulk import page + result report

## Success Criteria
- [ ] Leader can create, edit, delete single question
- [ ] Recruiter/HR cannot write to question bank (403 response)
- [ ] Bulk import with 100-row xlsx inserts correctly, flags duplicates
- [ ] Template xlsx downloads with correct headers
- [ ] Sidebar shows "Ngân hàng câu hỏi" for leader/admin only

## Risk Assessment
- **xlsx parsing**: use `xlsx` (SheetJS) — already in many Next.js projects; if not installed, `npm install xlsx`
- **File size**: cap at 2MB / 500 rows in API validation to prevent abuse
- **SHA-256 in Edge runtime**: `crypto` module available in Node.js API routes; not available in Edge runtime — keep bulk import as Node.js route

## Security Considerations
- `isLeader || isAdmin` guard on all write endpoints — never trust client-side role
- Validate `correct_answer` and `level` enum values server-side
- Sanitize `question_text` — no HTML injection risk since rendered as plain text

## Next Steps
- Phase 3 (AI Pipeline) can start in parallel after Phase 1 completes
- Phase 4 (Level Composition) requires questions in the bank (this phase)
