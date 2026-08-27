---
phase: 2
title: "Skill documents + generation"
status: complete
priority: P1
effort: "1.5d"
dependencies: [1]
---

# Phase 2: Skill documents + generation

## Overview
Add a documents/knowledge area to a skill and run the QB AI generation pipeline scoped to the skill,
saving generated questions with `skill_id`.

## Requirements
- Functional: on `skills/[id]`, a "Knowledge" tab to upload 1+ documents (reuse `DocumentSourceSelector`)
  and run the same pipeline (extract → config → generate → review) scoped to the skill; saved questions
  get `skill_id`. "Tạo thêm" re-runs the pipeline.
- Non-functional: DRY — reuse `QuestionBankAiPipelineTab` engine + `ai-questions-review`; do not fork.

## Architecture
- Generalize the pipeline to accept `context: { scope: "bank" } | { scope: "skill"; skillId }`.
  - Document upload tags `document_sources.skill_id`.
  - Generate API/edge fn associates output `questions.skill_id = skillId` on save.
  - Reuses A's config (per-topic count, level ratio, types).
- Add the skill pipeline entry under a skill tab (new `skill-knowledge-tab.tsx`).

## Related Code Files
- Modify: `src/app/dashboard/question-bank/question-bank-ai-pipeline-tab.tsx` (accept `context`)
- Modify: generate API + save path to persist `skill_id` (depends on A's Phase 3)
- Create: `src/app/dashboard/skills/[id]/skill-knowledge-tab.tsx` (mounts pipeline with skill context)
- Modify: `skill-detail-client.tsx` (add tab)
- Reuse: `DocumentSourceSelector`, `TopicReviewPanel`, `AiQuestionsReview`

## Implementation Steps
1. Add `context` prop to the pipeline; default `{scope:"bank"}` (no behavior change for QB).
2. Thread `skillId` into upload (document_sources.skill_id) + generate/save (questions.skill_id).
3. Create skill "Knowledge" tab mounting the pipeline with `{scope:"skill",skillId}`.
4. `npx tsc --noEmit`.

## Success Criteria
- [x] Upload docs to a skill; generate skill-scoped questions; review/select/edit; "tạo thêm" works.
- [x] Questions saved with correct `skill_id`; global QB pipeline unchanged (`scope:"bank"`).

## Risk Assessment
- Risk: coupling pipeline to two scopes. Mitigation: narrow `context` discriminator (scope + skillId only).
- Risk: depends on A landing. Mitigation: sequence after A (plan blockedBy).
