# Brainstorm Report — Phase 4: Question Bank & AI Pipeline
Date: 2026-05-13 | Project: Hitek Testhub (ITBAAI)

## Problem Statement
Leaders spend excessive time creating tests manually. Phase 4 introduces a reusable Question Bank + AI document pipeline to reduce test creation time by 70% and standardize knowledge evaluation across levels.

## Requirements Summary (from 3_new features.docx)
- Feature 1: AI generate questions from uploaded docs (PDF/DOCX/TXT/URL)
- Feature 2: Manual question input (single form + bulk Excel/CSV import)
- Feature 3: Level-based test composition (Junior/Middle/Senior, mixed ratios)
- New role: `leader` (= recruiter + question bank management)

## Evaluated Approaches

### Question Bank Architecture
| Option | Pros | Cons |
|--------|------|------|
| Separate new table | No breaking changes, clean isolation | Migration needed to link with existing tests |
| Reuse existing `questions` table | Less schema change | Pollutes per-test data, complex RLS |
**Decision: Separate `question_bank` table — integrate with test creation later**

### Async Processing
| Option | Pros | Cons |
|--------|------|------|
| Supabase Edge Function | No Vercel timeout, scales | Cold start latency |
| Next.js waitUntil | Simpler | 60s limit, unreliable for long docs |
**Decision: Supabase Edge Function + DB job polling**

### Document Formats (MVP)
**Decision: PDF, DOCX, TXT, URL. Google Drive deferred post-MVP.**

## Final Architecture

### Database Schema (new tables)
```sql
question_bank (id, question_text, question_hash, option_a..d, correct_answer,
               explanation, points, time_limit, level ENUM('junior','middle','senior'),
               topic_tag, created_by, created_at)

document_sources (id, file_name, file_url, format, status, created_by, created_at)

document_jobs (id, document_source_id, job_type, status, result_json, error_message, created_at)

-- profiles.role: add 'leader' to enum
```

### Role Permissions
`leader = recruiter + upload docs + manage question_bank + create tests from bank + send to team`

RLS: `question_bank` leader/admin write, recruiter/HR read-only

### UI Structure
- Sidebar new tab: "Ngân hàng câu hỏi" → subpages: Overview, Manual Add, Bulk Import, AI Pipeline
- Test creation wizard: extend existing flow, add "Level Config" step when source = Question Bank
  - Mode 1: single level (all Junior/Middle/Senior)
  - Mode 2: mixed ratio (default 30/50/20) + optional topic filter
  - Auto-pull questions, leader can swap individual questions
  - Send to individual or team

### Bulk Import Template
9 columns: question_text, option_a, option_b, option_c, option_d, correct_answer, level, explanation, points, time_limit
Duplicate detection: SHA-256 hash of `question_text`

## Implementation Phases
| Phase | Content | Days |
|-------|---------|------|
| A — Foundation | leader role, DB schema, Storage bucket | 1–2 |
| B — Manual Input | CRUD API + UI, bulk import, duplicate detect | 2–3 |
| C — AI Pipeline | Upload UI, text extract, Edge Function, polling | 5–7 |
| D — Level Composition | Level config wizard, auto-pull, swap, team send | 3–4 |
**Total: ~11–16 days**

## Risks
- Edge Function cold start — mitigate with keep-warm strategy
- URL scraping may be blocked — need robust error handling + fallback message
- AI question quality depends on doc quality — mandatory leader review step before committing to bank

## Unresolved Questions
- None at time of writing. All major decisions confirmed by user.
