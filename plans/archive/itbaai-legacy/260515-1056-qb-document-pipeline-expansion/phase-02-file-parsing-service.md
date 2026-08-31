---
phase: 2
title: "File Parsing Service (Node.js API layer)"
status: pending
effort: 1.5h
blockedBy: [1]
blocks: [3, 4, 5]
---

# Phase 2 — File Parsing Service (Node.js API layer)

## Context Links
- Existing Deno text extractor: `supabase/functions/generate-questions-from-doc/text-extractor.ts`
- Existing upload route: `src/app/api/document-sources/route.ts` (POST handler, line 29–79)
- Existing format CHECK: `document_sources.format IN ('pdf','docx','txt','url')`
- `@types/pdf-parse` in devDeps — but `pdf-parse` itself not in deps (unverified at runtime)

## Overview

Create a Node.js-side text extraction module at `src/lib/document-parsing/`. This is a prerequisite for all features that need to re-process documents server-side (library uploads, Drive imports, version diffs). The Deno edge function already handles extraction at generation time; this module handles extraction **at upload/import time** so the API layer can pre-store extracted text and pass it downstream.

**Why Node.js and not Deno?** mammoth.js (docx parsing) requires Node.js. The Next.js API routes run on Node.js runtime. Edge functions run on Deno and cannot use Node packages.

## Architecture

### Data Flow

```
Upload request (FormData: file bytes)
  → src/app/api/documents/route.ts (POST)
    → src/lib/document-parsing/extract-text-from-buffer.ts
        PDF  → pdf-parse (Node)
        DOCX → mammoth (Node)
        TXT/MD → Buffer.toString('utf8')
        URL  → fetch + strip HTML (same as Deno extractor)
    → extracted text stored in documents.extracted_text (new column, see Phase 1 addendum)
    → file bytes uploaded to Supabase Storage
  → document_sources row created (document_id = documents.id)
  → edge function invoked with { documentId, preExtractedText }
```

### Module Structure (all files under 200 lines)

```
src/lib/document-parsing/
  extract-text-from-buffer.ts   ← main entry; routes by file type
  extract-pdf-text.ts           ← pdf-parse wrapper
  extract-docx-text.ts          ← mammoth wrapper
  extract-url-text.ts           ← fetch + HTML strip
```

### Edge Function Compatibility

The existing `text-extractor.ts` in Deno will remain unchanged. The edge function will accept an optional `preExtractedText` field in its body. If present, it skips re-downloading and re-parsing. If absent (backward compat), it falls back to its own extraction logic. This means no breaking change to the existing pipeline.

## Requirements

**Functional**
- PDF: use `pdf-parse` (Node.js); extract all pages as plain text
- DOCX: use `mammoth` to convert to plain text (not HTML); strip formatting
- TXT/MD: `Buffer.toString('utf8')` — trivial
- URL: fetch + regex HTML strip (mirror existing Deno logic)
- Max input: 50 MB (already enforced at upload route line 45)
- Return: `{ text: string; charCount: number; truncated: boolean }`
- If extracted text > 150K chars: truncate and set `truncated: true` (log warning)
- Propagate meaningful errors: `UnsupportedFormatError`, `ExtractionFailedError`

**Non-functional**
- Each file ≤ 200 lines
- No global state (pure functions — safe for concurrent Next.js requests)
- `export const runtime = "nodejs"` on all API routes that use this module

## Dependencies to Install

```bash
npm install pdf-parse mammoth
npm install --save-dev @types/mammoth
```

Note: `@types/pdf-parse` already in devDeps. Confirm `pdf-parse` itself is absent from deps before installing.

## Related Code Files

**Create**
- `src/lib/document-parsing/extract-text-from-buffer.ts`
- `src/lib/document-parsing/extract-pdf-text.ts`
- `src/lib/document-parsing/extract-docx-text.ts`
- `src/lib/document-parsing/extract-url-text.ts`

**Modify**
- `supabase/functions/extract-document-topics/index.ts` — accept optional `preExtractedText` in body (lines 24–86, add early-exit branch)
- `supabase/functions/generate-questions-from-doc/index.ts` — same `preExtractedText` passthrough

**Phase 1 Addendum** (coordinate with Phase 1 implementer)
- Add `extracted_text TEXT` column to `documents` table in migration (not `document_sources` — text lives on the library record, shared across runs)

## Implementation Steps

1. Install deps: `npm install pdf-parse mammoth && npm install -D @types/mammoth`
2. Create `src/lib/document-parsing/extract-pdf-text.ts`:
   - Import `pdf-parse`
   - `export async function extractPdfText(buffer: Buffer): Promise<string>`
   - Use `pdfParse(buffer)` → return `.text`
   - Catch and wrap errors as `ExtractionFailedError`
3. Create `src/lib/document-parsing/extract-docx-text.ts`:
   - Import `mammoth`
   - `export async function extractDocxText(buffer: Buffer): Promise<string>`
   - Use `mammoth.extractRawText({ buffer })` → return `.value`
4. Create `src/lib/document-parsing/extract-url-text.ts`:
   - Mirror the Deno `extractTextFromUrl` but in Node.js (built-in `fetch` available in Node 18+)
5. Create `src/lib/document-parsing/extract-text-from-buffer.ts`:
   - Export `extractTextFromBuffer(buffer: Buffer, fileType: string, fileName: string, sourceUrl?: string): Promise<ExtractionResult>`
   - Route by fileType: `pdf` → `extractPdfText`, `docx` → `extractDocxText`, `txt|md` → toString, `url` → `extractUrlText`
   - Apply 150K char truncation; return `{ text, charCount, truncated }`
6. Update `supabase/functions/extract-document-topics/index.ts`:
   - Add `preExtractedText?: string` to body type (line 24)
   - If `preExtractedText` provided, skip lines 68–86 (download + extract) and use it directly
7. Update `supabase/functions/generate-questions-from-doc/index.ts` — same pattern
8. Write unit tests for each parser (mock file buffers)

## Todo List

- [ ] Install `pdf-parse`, `mammoth`, `@types/mammoth`
- [ ] Create `extract-pdf-text.ts`
- [ ] Create `extract-docx-text.ts`
- [ ] Create `extract-url-text.ts`
- [ ] Create `extract-text-from-buffer.ts` (main router)
- [ ] Update `extract-document-topics/index.ts` for `preExtractedText` passthrough
- [ ] Update `generate-questions-from-doc/index.ts` for `preExtractedText` passthrough
- [ ] Verify `export const runtime = "nodejs"` on all routes that import this module
- [ ] Test PDF extraction with a real PDF buffer
- [ ] Test DOCX extraction with a real DOCX buffer

## Success Criteria

- `extractTextFromBuffer(pdfBuffer, 'pdf', 'test.pdf')` returns non-empty text string
- `extractTextFromBuffer(docxBuffer, 'docx', 'test.docx')` returns plain text (no XML tags)
- `extractTextFromBuffer(txtBuffer, 'txt', 'test.txt')` returns raw string
- Existing pipeline (upload → edge function) still works unchanged (preExtractedText absent = fallback)
- Files stay ≤ 200 lines each

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `pdf-parse` fails on encrypted/scanned PDFs | Medium | Medium | Return partial text + `truncated: true`; surface error message to UI |
| `mammoth` produces garbled output on complex DOCX (tables, images) | Medium | Low | Text-only extraction acceptable; tables become whitespace |
| Node 18 built-in `fetch` missing in some deployment environments | Low | Medium | Use `node-fetch` as fallback if needed; check Next.js 15 (uses Node 18+) |
| Edge function `preExtractedText` passthrough breaks if body size > Supabase limit (1 MB) | Medium | High | Store extracted text in `documents.extracted_text` DB column; pass `documentId` reference, not raw text |

## Unresolved Questions

- Confirm Supabase Edge Function body size limit (default 1 MB). If extracted text can exceed this, must store in DB and pass `documentId` instead.
- Is `pdf-parse` sufficient or do we need `pdfjs-dist` for complex layouts? Evaluate with real documents from the team.
