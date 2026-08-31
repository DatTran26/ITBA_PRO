---
phase: 3
title: "AI Pipeline: Upload, Extract, Edge Function, Poll"
status: pending
priority: P1
effort: "5–7d"
dependencies: [1]
---

# Phase 3: AI Pipeline

## Context Links
- Brainstorm: `plans/reports/brainstorm-260513-phase4-question-bank.md`
- Foundation: `plans/260513-phase4-question-bank-ai-pipeline/phase-01-foundation.md`
- Code standards: `docs/code-standards.md`
- Auth helpers: `src/lib/api/auth-helpers.ts`

## Overview
Leader uploads a document (PDF/DOCX/TXT) or provides a URL. The system extracts text, queues an async job, and a Supabase Edge Function calls GPT-4o to generate multiple-choice questions. Leader reviews AI output before committing questions to the bank.

## Requirements
- Functional:
  - API: `POST /api/document-sources` — upload file to Supabase Storage, create `document_sources` row, enqueue `document_jobs` row
  - API: `GET /api/document-sources` — list documents (leader/admin only)
  - API: `GET /api/document-sources/[id]/job` — poll job status + result
  - API: `POST /api/document-sources/[id]/approve` — commit approved AI questions to `question_bank`
  - Supabase Edge Function `generate-questions-from-doc` — extract text + call GPT-4o, store result in `document_jobs.result_json`
  - UI: sidebar subpage "AI Pipeline" under "Ngân hàng câu hỏi"
  - UI: upload dropzone (PDF/DOCX/TXT, max 50MB) + URL input
  - UI: job status polling (pending → processing → done/failed)
  - UI: review panel — AI-generated questions list with approve/edit/reject per question
- Non-functional:
  - Edge Function timeout: Supabase allows 150s wall time; large docs should chunk text
  - Max 50 questions generated per document run
  - Approved questions go through same SHA-256 dedup as manual add

## Architecture

### API Layer
```
src/app/api/document-sources/
  route.ts                    -- GET (list) + POST (upload + enqueue)
  [id]/
    job/route.ts              -- GET job status + result_json
    approve/route.ts          -- POST commit selected questions to question_bank
```

### Edge Function
```
supabase/functions/generate-questions-from-doc/
  index.ts                    -- main handler
  text-extractor.ts           -- PDF/DOCX/TXT/URL text extraction
  question-generator.ts       -- OpenAI GPT-4o call + response parser
```

### UI Layer
```
src/app/dashboard/question-bank/ai-pipeline/
  page.tsx                    -- List documents + upload entry point
  [id]/page.tsx               -- Job status polling + review panel
src/components/question-bank/
  document-upload-form.tsx    -- File dropzone + URL input + submit
  job-status-poller.tsx       -- Polls GET job every 3s, renders progress
  ai-questions-review.tsx     -- Table of AI questions with approve/edit/reject
```

### Data Flow
```
Leader uploads file
  → POST /api/document-sources
    → Upload to Supabase Storage (document-sources bucket)
    → INSERT document_sources row (status='pending')
    → INSERT document_jobs row (status='pending')
    → Invoke Edge Function async (supabase.functions.invoke, no await)
  ← Return { documentId, jobId }

Frontend polls GET /api/document-sources/[id]/job every 3s
  → Returns { status, result_json? }
  → Stops polling when status IN ('done', 'failed')

Edge Function generate-questions-from-doc
  → UPDATE document_jobs SET status='processing'
  → Fetch file from Storage (signed URL) OR fetch URL content
  → Extract text (pdf-parse / mammoth / plain fetch)
  → Chunk text if >8000 tokens
  → Call GPT-4o with structured prompt → parse JSON array
  → UPDATE document_jobs SET status='done', result_json=[questions]

Leader reviews AI questions in UI
  → POST /api/document-sources/[id]/approve with selected question indices
    → Compute SHA-256 hash per question
    → Batch check existing hashes (dedup)
    → INSERT new non-duplicate rows to question_bank
    → Return { inserted, duplicates }
```

### GPT-4o Prompt Schema
```
System: "Generate {n} multiple-choice questions from the following content.
Return JSON array only: [{question_text, option_a, option_b, option_c, option_d,
correct_answer (a|b|c|d), explanation, level (junior|middle|senior), topic_tag}]"
User: {extracted_text_chunk}
```

## Related Code Files
- Create:
  - `src/app/api/document-sources/route.ts`
  - `src/app/api/document-sources/[id]/job/route.ts`
  - `src/app/api/document-sources/[id]/approve/route.ts`
  - `supabase/functions/generate-questions-from-doc/index.ts`
  - `supabase/functions/generate-questions-from-doc/text-extractor.ts`
  - `supabase/functions/generate-questions-from-doc/question-generator.ts`
  - `src/app/dashboard/question-bank/ai-pipeline/page.tsx`
  - `src/app/dashboard/question-bank/ai-pipeline/[id]/page.tsx`
  - `src/components/question-bank/document-upload-form.tsx`
  - `src/components/question-bank/job-status-poller.tsx`
  - `src/components/question-bank/ai-questions-review.tsx`
- Modify:
  - `src/app/dashboard/question-bank/page.tsx` — add AI Pipeline link card

## Implementation Steps

1. **API — document-sources** (`src/app/api/document-sources/route.ts`):
   - POST: accept `multipart/form-data` with `file` OR `source_url` field
   - If file: upload to `document-sources` bucket → get public URL
   - INSERT `document_sources` row
   - INSERT `document_jobs` row with `status='pending'`
   - Call `supabase.functions.invoke('generate-questions-from-doc', { body: { jobId } })` — fire and forget (no await response body)
   - Return `{ documentId, jobId }`
   - Auth guard: `isLeader || isAdmin`

2. **API — job poll** (`document-sources/[id]/job/route.ts`):
   - GET: query `document_jobs` by `document_source_id = id` (most recent)
   - Return `{ status, result_json, error_message }`
   - Auth: owner OR leader/admin

3. **API — approve** (`document-sources/[id]/approve/route.ts`):
   - POST body: `{ questions: QuestionInput[], level_override?: string }`
   - Compute SHA-256 per question_text
   - Batch SELECT existing hashes from `question_bank`
   - INSERT non-duplicates with `created_by = userId`
   - Return `{ inserted: number, duplicates: number }`

4. **Edge Function** (`generate-questions-from-doc/index.ts`):
   - Read `jobId` from request body
   - Fetch `document_jobs` row → get `document_source_id`
   - Fetch `document_sources` row → get `file_url`, `format`
   - UPDATE `document_jobs` status = 'processing'
   - Call `extractText(fileUrl, format)` → raw string
   - Split into chunks ≤8000 chars (~2000 tokens buffer for response)
   - Call `generateQuestions(chunk, n=10)` per chunk (max 5 chunks = 50 questions total)
   - Merge results, UPDATE `document_jobs` SET `status='done'`, `result_json=mergedQuestions`
   - On any error: UPDATE `status='failed'`, `error_message=e.message`

5. **text-extractor.ts**:
   - PDF: use `pdf-parse` npm package (Deno-compatible: `npm:pdf-parse`)
   - DOCX: use `mammoth` npm package (`npm:mammoth`)
   - TXT: fetch text directly
   - URL: `fetch(url)` → parse HTML text via regex strip tags (no full DOM in Edge)
   - Return plain string, truncated at 40000 chars max

6. **question-generator.ts**:
   - Call OpenAI API (`OPENAI_API_KEY` env var, set in Supabase Edge Function secrets)
   - Model: `gpt-4o`, temperature: 0.7, max_tokens: 3000
   - Parse JSON from response — handle markdown code fences if present
   - Validate each question has required fields; skip malformed entries
   - Return `QuestionDraft[]`

7. **UI — upload page** (`ai-pipeline/page.tsx`):
   - `document-upload-form.tsx`: tab UI — File Upload tab (dropzone, accept PDF/DOCX/TXT, max 50MB) | URL tab (text input)
   - On submit: POST to `/api/document-sources` → redirect to `/dashboard/question-bank/ai-pipeline/[id]`
   - List existing document_sources with status badges

8. **UI — review page** (`ai-pipeline/[id]/page.tsx`):
   - `job-status-poller.tsx`: poll `/api/document-sources/[id]/job` every 3s
     - pending/processing: show spinner + status label
     - failed: show error message
     - done: render `ai-questions-review.tsx`
   - `ai-questions-review.tsx`:
     - Table with columns: question_text, level, topic_tag, correct_answer, actions
     - Checkbox per row for bulk approve
     - Edit button → inline edit form (question_text, options, correct_answer, level)
     - Reject button → removes from list (client-side only)
     - "Approve Selected" → POST `/api/document-sources/[id]/approve`
     - Show result: "X questions added, Y duplicates skipped"

## Todo List
- [ ] API: document upload + enqueue job
- [ ] API: job status poll endpoint
- [ ] API: approve questions to bank
- [ ] Edge Function: main handler + orchestration
- [ ] Edge Function: text extractor (PDF/DOCX/TXT/URL)
- [ ] Edge Function: GPT-4o question generator
- [ ] Deploy Edge Function with OPENAI_API_KEY secret
- [ ] UI: upload form (file + URL tabs)
- [ ] UI: job status poller component
- [ ] UI: AI questions review + approve panel

## Success Criteria
- [ ] Leader uploads a PDF → within 60s job status shows 'done' with questions
- [ ] URL input fetches and generates questions from web page
- [ ] DOCX file extracts text correctly via mammoth
- [ ] Leader can approve subset of AI questions → they appear in question_bank
- [ ] Duplicate AI-generated questions are flagged (not hard-errored)
- [ ] Failed jobs show meaningful error message (not blank screen)
- [ ] Non-leader users get 403 on all document-sources write endpoints

## Risk Assessment
- **Edge Function cold start**: ~1–2s delay before processing begins — show "pending" UI immediately, don't let user think it's broken
- **URL scraping blocked**: Some sites block headless fetch (no JS rendering). Mitigation: catch HTTP errors, return `failed` with message "URL could not be fetched — try uploading a file instead"
- **AI question quality**: Depends entirely on document quality. Mitigate with mandatory leader review step — nothing goes to bank without human approval
- **pdf-parse in Deno/Edge**: Use `npm:pdf-parse` specifier in Deno Edge Function; may need to pin version. Test with actual PDF before ship.
- **GPT-4o JSON parsing**: Model may wrap JSON in markdown code fences. Strip with regex before `JSON.parse()`
- **Chunking strategy**: If doc has <8000 chars, single chunk. If larger, split on paragraph boundaries (double newline), not mid-sentence

## Security Considerations
- File upload: validate MIME type server-side, not just extension
- Storage bucket `document-sources` is private — never expose direct URLs; use signed URLs
- `OPENAI_API_KEY` stored as Supabase Edge Function secret (not in codebase)
- Validate `format` field against allowlist before processing
- Edge Function invocation is internal (service role key) — not exposed to browser

## Next Steps
- Phase 4 (Level Composition) can run in parallel after Phase 1 completes
- Phase 2 (Manual Input) must ship first so bank has questions for Phase 4 to pull from
