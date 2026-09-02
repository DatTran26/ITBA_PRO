# Phase 2 — CV Processing Spike + Edge Function

## Context Links
- Phase 1 schema (required)
- Existing AI routes: `src/app/api/ai/{generate,analyze}/route.ts`
- `system_settings` keys: `ai.model`, `ai.temperature`
- `ai_usage` table for token logging

## Overview
- **Priority:** P1
- **Status:** pending
- **Description:** Spike Deno PDF/DOCX extraction, implement Edge Function `cv-processor`, upload API, signed-URL API, and Realtime hook.

## Key Insights
- Upload must return **202 Accepted** fast; Edge Function runs async
- Edge Function invoked non-blocking from API route (`supabase.functions.invoke` without await in fire-and-forget pattern, OR via pg_net)
- Supabase Realtime channel `application:{id}` broadcasts state changes
- AI output MUST be Vietnamese via system prompt instruction
- JSON mode: `response_format: { type: 'json_object' }`

## Requirements
**Functional**
- `POST /api/recruitment/upload` (multipart): file + job_description_id → creates persons (source=recruitment) + candidate_cvs + job_applications(NEW), uploads to Storage, invokes Edge Function, returns 202 with `{applicationId}`
- `GET /api/recruitment/cv/[cvId]` returns short-lived signed URL (5 min)
- `POST /api/recruitment/applications/[id]/reprocess` — resets `parse_status=PENDING`, increments `retry_count`, re-invokes Edge Function; allowed when `parse_status=FAILED`; roles: hr/interviewer/admin
- Edge Function: set `parse_status=PROCESSING` + `processing_started_at` → extract text → call CvScorer → persist screening → update `job_applications.current_screening_id` + `pipeline_status` → set `parse_status=COMPLETED` + `processing_finished_at` → broadcast; on error: set `parse_status=FAILED` + `last_error`
- Frontend hook `useApplicationRealtime(id)` subscribes + returns current state; polls every 15s as fallback while PENDING/PROCESSING

**Non-functional**
- File size limit 10 MB
- Allowed mime: `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- Edge Function timeout budget <60s

## Architecture

### Spike decision tree
1. Try `pdfjs-dist` on Deno → if OK, continue
2. Else try `unpdf` package
3. Else **Fallback A:** send raw bytes to OpenAI Files API (GPT-4o handles PDF natively)
4. Else **Fallback B:** extract in Next.js API route using `pdf-parse`/`mammoth`; Edge Function only scores

### AI prompt (Vietnamese output)
System: "Bạn là chuyên gia tuyển dụng. Trả về JSON với fields: ai_score (0-100), skill_match_score, experience_match_score, domain_match_score, strengths (array of Vietnamese strings), weaknesses (array of Vietnamese strings), parsed_cv (object). Toàn bộ text phải viết bằng tiếng Việt."

### Provider-agnostic CvScorer interface
```ts
// supabase/functions/cv-processor/cv-scorer.ts
export interface ScreeningResult {
  ai_score: number;
  skill_match_score: number;
  experience_match_score: number;
  domain_match_score: number;
  strengths: string[];        // Vietnamese
  weaknesses: string[];       // Vietnamese
  parsed_cv: Record<string, unknown>;
  ai_provider: string;        // 'openai'
  ai_model: string;           // e.g. 'gpt-4o'
  prompt_version: string;     // 'v1'
}

export interface CvScorer {
  score(cvText: string, jdText: string): Promise<ScreeningResult>;
}

// Default implementation: OpenAIScorer
// Future: GeminiScorer implements CvScorer
```

### TypeScript types (shared in src/)
```ts
// src/types/recruitment.ts — re-export ScreeningResult + application types
```

## Related Code Files
**Create**
- `supabase/functions/cv-processor/index.ts`
- `supabase/functions/cv-processor/deno.json`
- `supabase/functions/cv-processor/extract.ts` (PDF/DOCX extraction)
- `supabase/functions/cv-processor/cv-scorer.ts` (interface + OpenAIScorer implementation)
- `src/app/api/recruitment/upload/route.ts`
- `src/app/api/recruitment/cv/[cvId]/route.ts`
- `src/app/api/recruitment/applications/[id]/reprocess/route.ts`
- `src/hooks/use-application-realtime.ts`
- `src/types/recruitment.ts`
- `plans/260419-0136-ai-cv-screening-recruitment/research/spike-deno-pdf-parsing.md`

## Implementation Steps
1. **SPIKE** — create `research/spike-deno-pdf-parsing.md`, test 3 sample CVs (PDF/DOCX), document chosen approach
2. Scaffold `cv-processor` Edge Function; implement `extract.ts` with chosen strategy
3. Implement `cv-scorer.ts`: `CvScorer` interface + `OpenAIScorer` class — reads model/temp from `system_settings`, calls OpenAI JSON mode with VN system prompt, returns `ScreeningResult` with `ai_provider/ai_model/prompt_version`
4. Edge Function orchestration: set `parse_status=PROCESSING` + `processing_started_at` → extract → score → insert `candidate_screenings` → update `job_applications.current_screening_id` → resolve threshold (JD → global 40) → update `pipeline_status` → set `parse_status=COMPLETED` + `processing_finished_at` → broadcast; catch: `FAILED` + `last_error`
5. Log `ai_usage` row per screening call
6. Implement `POST /api/recruitment/upload` — auth (hr/interviewer/admin), validate mime/size (10 MB), upload to Storage, insert rows (parse_status=PENDING), invoke Edge Function fire-and-forget, return 202
7. Implement `POST /api/recruitment/applications/[id]/reprocess` — validates `parse_status=FAILED`, increments `retry_count`, resets to PENDING, re-invokes Edge Function
8. Implement signed URL endpoint `GET /api/recruitment/cv/[cvId]` with role scope check
9. Implement `useApplicationRealtime` hook; poll fallback every 15s while PENDING/PROCESSING
10. End-to-end test with one real PDF CV

## Todo
- [ ] Spike report written and committed
- [ ] `cv-scorer.ts` interface + OpenAIScorer implemented
- [ ] Edge Function: PROCESSING/COMPLETED/FAILED lifecycle + audit fields set correctly
- [ ] Upload API returns 202 with applicationId
- [ ] Reprocess endpoint works when parse_status=FAILED
- [ ] Signed URL endpoint with scope check
- [ ] Realtime subscription hook + 15s poll fallback
- [ ] `ai_usage` row created per screening
- [ ] `current_screening_id` updated on job_applications after screening
- [ ] VN output verified on real CV

## Success Criteria
- Upload a real PDF → within 60s a `candidate_screenings` row exists with Vietnamese strengths/weaknesses
- Frontend receives Realtime event and re-fetches detail
- Failed extractions set `parse_status='failed'` without breaking UI

## Risk Assessment
- **Risk:** Deno PDF libs unmaintained → fallback A (OpenAI Files) chosen
- **Risk:** OpenAI rate limits → retry with backoff (1 retry)
- **Risk:** Realtime not delivered → UI polls every 15s while status in (NEW, processing)

## Security Considerations
- Storage bucket private; only service role writes
- Signed URL expiry 5 min
- Validate mime server-side (do not trust client content-type only)
- Redact sensitive data in `ai_usage.feature`

## Next Steps
- Phase 3 consumes applications + screenings
