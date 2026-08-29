# Brainstorm Report: AI CV Screening & Recruitment Feature

**Date:** 2026-04-19  
**Spec:** `docs/ai_cv_screening_recruitment_feature_spec.md`  
**Status:** Architecture fully locked — ready for implementation plan

---

## Problem Statement

Add an AI-powered CV screening and recruitment pipeline workflow to the existing interview/test platform (Next.js 16 + Supabase + OpenAI). Must integrate with current stack, reuse existing CRM components, and introduce minimal new infrastructure.

---

## Locked Architecture Decisions

### 1. Role Model

| Role | DB key | Capabilities |
|------|--------|-------------|
| HR | `hr` (new) | Recruitment pipeline only: CV collection, candidate status management, interview scheduling |
| Interviewer | `interviewer` (new) | All HR rights + create/manage candidate-facing tests (NOT employee tests) |
| Recruitment | `recruiter` (existing) | Employee test management, staff lists, categories, skills |
| Admin | `admin` (existing) | Full access |

Auth context additions to `auth-helpers.ts`:
```typescript
isHr: role === 'hr' || isInterviewer || isAdmin
isInterviewer: role === 'interviewer' || isAdmin
isRecruiter: role === 'recruiter' || isAdmin
```

**No external tokenized interviewer link** — Interviewer is an authenticated system role.

### 2. Data Model

**`persons` table — two targeted additions:**
- `source: 'test' | 'recruitment' | 'both'` — distinguishes recruitment applicants from test-only candidates
- Keep `type: 'candidate' | 'employee'` unchanged

**Pipeline status lives on `job_applications` (new table) — NOT on `persons`:**
```
job_applications
├── id
├── person_id → persons
├── job_description_id → job_descriptions
├── cv_id → candidate_cvs
├── pipeline_status: NEW | SCREENED | REJECTED | SHORTLISTED |
│                    INTERVIEW_SCHEDULED | INTERVIEWED |
│                    PASSED | FAILED | OFFERED | ACCEPTED |
│                    OFFER_REJECTED | ONBOARDED
├── created_by → users
└── created_at
```

**New tables:**
- `candidate_cvs` — file ref, storage_path, parse_status, detected_language, person_id
- `candidate_screenings` — ai_score, final_score, skill/experience/domain breakdown, strengths/weaknesses JSON, override audit (is_overridden, override_reason, overridden_by, overridden_at) → linked to job_application_id
- `candidate_status_history` — from/to pipeline_status, changed_by, changed_at, note → linked to job_application_id
- `job_descriptions` — title, role_key, full_text, department, seniority, required_skills, is_active
- `interview_schedules` — interviewer_id (FK users, role=interviewer), scheduled_at, timezone, recruiter_note, status → linked to job_application_id
- `interview_results` — result (pass|fail), note, submitted_at, submitted_by → linked to interview_schedule_id

**Reused as-is:** `activity_logs`, `notes`, `tags/entity_tags`, `crm_tasks`, `system_settings`, `ai_usage`

### 3. Async CV Processing: Supabase Edge Function

```
POST /api/recruitment/upload
  → store PDF/DOCX to Supabase Storage (private bucket: 'candidate-cvs')
  → upsert persons (type='candidate', source='recruitment')
  → insert candidate_cvs (parse_status='pending')
  → insert job_applications (pipeline_status='NEW', cv_id=cvId)
  → supabase.functions.invoke('cv-processor', { cvId, applicationId })
  → return 202 + { applicationId }

Edge Function: supabase/functions/cv-processor/index.ts (Deno)
  → fetch CV from Storage
  → extract text from PDF/DOCX
  → call OpenAI [model from system_settings.ai.model]
  → parse: { name, email, phone, skills, experience, education }
  → score vs JD: { total, skill_match, experience_match, domain_match, strengths[], weaknesses[] }
  → insert candidate_screenings
  → update job_applications.pipeline_status → 'SCREENED' (or 'REJECTED' if below threshold)
  → update candidate_cvs.parse_status → 'done'
  → broadcast: Supabase Realtime channel `application:{applicationId}`
```

**CRITICAL SPIKE (Phase 2):** Validate PDF/DOCX text extraction in Deno before committing.
- Fallback A: Pass raw PDF bytes to OpenAI Files API (GPT-4o native PDF reading)
- Fallback B: Extract text in Next.js upload route synchronously; Edge Function does scoring only

### 4. AI Provider: OpenAI via `system_settings`

- Read model from `system_settings.ai.model` (same as existing /api/ai/* routes)
- Use `response_format: { type: 'json_object' }` for deterministic scoring output
- AI-generated content (parsed summary, strengths, weaknesses, score explanations) must output in **Vietnamese** via prompt instruction
- Log all AI calls to `ai_usage` table (existing pattern)

### 5. Interviewer Token Expiry

- Interview scheduling links: **48 hours** (not applicable since interviewer is system role)
- N/A — no external token flow

---

## UI Structure

```
/dashboard/recruitment/               → Application list (CandidateInbox)
/dashboard/recruitment/[id]           → Application detail (CandidateDetail)
/dashboard/recruitment/jd             → JD management
/dashboard/recruitment/settings       → Auto-reject threshold config
/dashboard/recruitment/dashboard      → Recruitment metrics

No public /interview/[token] route needed
```

**Reused CRM components:** `data-table`, `kanban-board`, `filter-bar`, `bulk-action-bar`, `kpi-card-grid`, `detail-drawer`

---

## Implementation Phases

| Phase | Scope | Risk |
|-------|-------|------|
| 1 | DB migration: `persons.source`, `job_applications` + 5 new tables, Supabase Storage bucket, `hr`+`interviewer` roles | Low |
| 2 | **SPIKE: Edge Function PDF parsing in Deno** | HIGH — validate before build |
| 3 | CV upload API + Edge Function + Realtime notification | Medium |
| 4 | Application list: pipeline status transitions, filters, bulk reject | Low |
| 5 | Application detail: score card, override, status history timeline | Low |
| 6 | Interview scheduling (Interviewer as system user, submit result via dashboard) | Low |
| 7 | Offer/onboarding status management | Low |
| 8 | JD management + auto-reject threshold + dashboard metrics | Low |

---

## Risk Summary

| Risk | L | I | Mitigation |
|------|---|---|------------|
| Deno PDF/DOCX parsing library gaps | H | H | Spike first; fallback to OpenAI file API or sync extraction |
| `hr`/`interviewer` missing from existing auth checks | H | M | Grep all role checks before shipping; add isHr/isInterviewer to AuthContext |
| persons.source migration on existing data | M | L | Backfill: set source='test' for all existing type='candidate' rows |
| job_applications multi-apply edge cases | M | M | Unique constraint: one open application per (person_id, job_description_id) |
| OpenAI cost at scale | M | M | ai_usage tracking already exists; add spend threshold alert |

---

## Final Decisions Log

1. **Candidate subtype:** `persons.source: 'test' | 'recruitment' | 'both'` — no new type enum value
2. **Pipeline status:** Lives on `job_applications`, not on `persons`
3. **Language:** AI-generated content in Vietnamese via prompt; UI language unchanged
4. **Interviewer:** System role with login, no external token flow
5. **Token expiry:** N/A (external link removed)
6. **AI provider:** OpenAI, model from `system_settings.ai.model`
7. **Processing:** Async via Supabase Edge Function + Realtime notification

---

## No Unresolved Questions Remaining
