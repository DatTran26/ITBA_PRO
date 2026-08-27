---
title: "Phase 4: Question Bank & AI Document Pipeline"
status: completed
created: 2026-05-13
completed: 2026-05-13
blockedBy: []
blocks: []
---

# Phase 4: Question Bank & AI Document Pipeline

## Context
- Brainstorm report: `plans/reports/brainstorm-260513-phase4-question-bank.md`
- Role system reference: `plans/260421-1241-role-permissions/`
- Stack: Next.js 15, React 19, Supabase, OpenAI GPT-4o

## Goal
Reduce test creation time by 70% via reusable Question Bank + AI document ingestion pipeline + level-based test composition.

## Phases

| # | Phase | Status | Est |
|---|-------|--------|-----|
| 1 | [Foundation: Leader role, DB schema, Storage](./phase-01-foundation.md) | ✅ completed | 1–2d |
| 2 | [Manual Input: CRUD, bulk import, dedup](./phase-02-manual-input.md) | ✅ completed | 2–3d |
| 3 | [AI Pipeline: Upload, extract, Edge Fn, poll](./phase-03-ai-pipeline.md) | ✅ completed | 5–7d |
| 4 | [Level Composition: wizard, auto-pull, swap, send](./phase-04-level-composition.md) | ✅ completed | 3–4d |

**Total: ~11–16 days**

## Key Dependencies
- Phase 2, 3, 4 all depend on Phase 1 (DB schema + leader role)
- Phase 4 depends on Phase 2 (questions must exist in bank)
- Phase 3 can run in parallel with Phase 2 after Phase 1 completes

## New Tables
- `question_bank` — reusable questions, separate from per-test `questions` table
- `document_sources` — uploaded files/URLs for AI ingestion
- `document_jobs` — async job tracking for AI processing

## New Role
`leader` = recruiter permissions + question bank management + team test creation
