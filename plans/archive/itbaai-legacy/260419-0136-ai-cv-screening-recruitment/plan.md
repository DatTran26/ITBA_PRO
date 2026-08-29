---
title: "AI CV Screening & Recruitment"
description: "End-to-end AI-driven recruitment pipeline: CV upload, async AI screening, candidate management, interview scheduling, offer & onboarding"
status: completed
priority: P1
effort: 40h
branch: feat/ai-cv-screening-recruitment
tags: [recruitment, ai, supabase-edge-functions, rls, realtime]
created: 2026-04-19
---

# AI CV Screening & Recruitment — Implementation Plan

## Goal
Deliver an AI-assisted recruitment pipeline inside the existing dashboard: HR uploads CVs, an async Edge Function scores them against a Job Description, recruiters shortlist candidates, interviewers record results, and approved candidates move to offer/onboarding — all gated by a new role hierarchy.

## Locked Decisions
- **Roles:** `super_admin > admin > recruiter > interviewer (NEW) > hr (NEW) > user`. `super_admin` untouchable.
- **Central table:** `job_applications` ties `persons` + `job_descriptions` + `candidate_cvs` with a `pipeline_status` state machine.
- **Async processing:** Supabase Edge Function `cv-processor` (Deno). Upload returns 202; frontend subscribes to Supabase Realtime on `application:{id}`.
- **Spike required (Phase 2):** Validate Deno PDF/DOCX extraction. Fallback A = OpenAI Files API. Fallback B = sync Next.js extraction.
- **AI output:** Vietnamese strings (prompt-enforced), JSON mode, model/temp from `system_settings`, usage logged in `ai_usage`.
- **persons.source:** `test | recruitment | both` (new nullable column). Backfill existing candidates to `test`.
- **Interviewer:** Authenticated system user (no tokenized links).

## Phases

| # | Phase | Status | Effort | File |
|---|-------|--------|--------|------|
| 1 | Database + Auth Foundation | completed | 5h | [phase-01](phase-01-database-auth-foundation.md) |
| 2 | CV Processing Spike + Edge Function | completed | 8h | [phase-02](phase-02-cv-processing-edge-function.md) |
| 3 | Application List + Pipeline Management | completed | 6h | [phase-03](phase-03-application-list-pipeline.md) |
| 4 | Application Detail + Score Override | completed | 5h | [phase-04](phase-04-application-detail-score-override.md) |
| 5 | Interview Scheduling + Result Submission | completed | 5h | [phase-05](phase-05-interview-scheduling-results.md) |
| 6 | Offer + Onboarding Management | completed | 3h | [phase-06](phase-06-offer-onboarding.md) |
| 7 | JD Management + Settings | completed | 4h | [phase-07](phase-07-jd-management-settings.md) |
| 8 | Dashboard Metrics | completed | 4h | [phase-08](phase-08-dashboard-metrics.md) |

## Key Dependencies
- Phase 2 depends on Phase 1 (schema + storage bucket)
- Phase 3–8 depend on Phase 2 (Edge Function must produce screenings)
- Phase 5 depends on Phase 3 (status machine)
- Phase 6 depends on Phase 5 (PASSED → OFFERED)
- Phase 8 depends on all data-producing phases

## Global Success Criteria
- HR can upload CV → within ~30s see AI score and strengths/weaknesses in Vietnamese
- Recruiter can shortlist / reject / bulk-reject from the pipeline board
- Interviewer sees only their scheduled interviews and can submit pass/fail
- Admin/Super Admin retain full access; `hr` and `interviewer` scoped correctly via RLS
- No regression on existing CRM / employee test flows

## Resolved Decisions
- **Max CV file size:** 10 MB; allowed mime: `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- **Auto-reject threshold:** global default 40/100; overridable per JD (`job_descriptions.auto_reject_threshold` nullable int)
- **JD write access:** `interviewer` and `admin`/`super_admin` only. HR = read-only (picker only). `recruiter` = no JD access.
- **Deno PDF library:** decided in Phase 2 spike
