---
phase: 2
title: "Topic-review config UI"
status: pending
priority: P1
effort: "1d"
dependencies: [1]
---

# Phase 2: Topic-review config UI

## Overview
Enhance the topic-review step so the user sets per-topic count + global level ratio + question types
before generating, and the Generate action passes that config up.

## Requirements
- Functional: per approved topic → a count number input (default 5, min 1, soft max e.g. 20).
  Global config bar: `LevelRatio` (J/M/S) + `QuestionTypePicker` (≥1 required). Live summary: total
  questions (Σ counts) + per-level breakdown (total × ratio). Generate disabled until ≥1 topic approved
  + ratio sum=100 + ≥1 type + total ≤ soft cap.
- Non-functional: token-based; keep existing edit/approve/remove topic behavior intact.

## Architecture
- `topic-review-panel.tsx` holds `topics: DocumentTopic[]`, `approvedIds`, calls `onGenerateQuestions(approvedIds)`.
- Add local state: `counts: Record<topicId, number>` (default 5), `levelRatio` ({junior:40,middle:40,senior:20} default), `types: QuestionType[]` (sensible default set).
- Render count input only for approved topics (or all, disabled until approved — pick simplest).
- Change callback signature: `onGenerateQuestions(config: { approvedTopicIds, perTopicCounts, levelRatio, questionTypes })`.
- Update caller `question-bank-ai-pipeline-tab.tsx` `handleGenerateQuestions` to accept the config object and forward it in the POST body (Phase 3).
- Compose `QuestionTypePicker` + `LevelRatio` (Phase 1 atoms).

## Related Code Files
- Modify: `src/components/question-bank/topic-review-panel.tsx` (config UI + new callback shape)
- Modify: `src/app/dashboard/question-bank/question-bank-ai-pipeline-tab.tsx` (`handleGenerateQuestions` signature + body)
- Use: `question-type-picker.tsx`, `level-ratio.tsx` (Phase 1); `question-bank-types.ts`

## Implementation Steps
1. Read `topic-review-panel.tsx` fully; note `DocumentTopic` shape + render loop.
2. Add `counts`/`levelRatio`/`types` state + defaults; per-topic count input bound to `counts[topic.id]`.
3. Add config bar (LevelRatio + QuestionTypePicker) + live summary (total + per-level).
4. Compute `canGenerate` (approved≥1 && ratio sum=100 && types≥1 && total≤cap); gate button.
5. Change `onGenerateQuestions` to pass `{ approvedTopicIds, perTopicCounts, levelRatio, questionTypes }`.
6. Update `question-bank-ai-pipeline-tab.tsx` caller signature accordingly (body wiring in Phase 3).
7. `npx tsc --noEmit`.

## Success Criteria
- [ ] Per-topic count + global ratio + types selectable at topic-review; live total + per-level shown.
- [ ] Generate blocked until valid; passes full config object.
- [ ] Topic edit/approve/remove unaffected.

## Risk Assessment
- Risk: callback signature change breaks the caller. Mitigation: update both in same phase; tsc gate.
- Risk: count UI clutter on many topics. Mitigation: compact inline input; soft cap + total warning.
