---
title: "2-Phase AI Document Pipeline for Question Bank"
description: "Redesign QB AI Pipeline: Pass 1 extracts structured topics, leader reviews/edits, Pass 2 generates questions from approved topics only"
status: complete
priority: P2
branch: "dev"
tags: ["question-bank", "ai-pipeline", "edge-functions", "supabase"]
blockedBy: [260514-question-bank-rebuild]
blocks: []
created: "2026-05-14T12:25:16.361Z"
createdBy: "ck:plan"
source: skill
---

# 2-Phase AI Document Pipeline for Question Bank

## Overview

Replace the single-pass document→questions pipeline with a 2-pass architecture:
- **Pass 1** (`extract-document-topics`): AI reads the full document and extracts structured topics (title + summary paragraph + key_points[])
- **Gate**: Leader reviews, edits, and approves/rejects each topic on screen
- **Pass 2** (`generate-questions-from-doc` modified): AI generates MCQ questions ONLY from approved topics, grouped by topic in the review screen

Topics are stored permanently in `document_topics` for audit/reuse. The `document_sources.status` state machine is extended to support the new flow.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [DB Migration](./phase-01-db-migration.md) | Complete |
| 2 | [Extract Topics Edge Function](./phase-02-extract-topics-edge-function.md) | Complete |
| 3 | [Generate Questions Edge Function Refactor](./phase-03-generate-questions-edge-function-refactor.md) | Complete |
| 4 | [API Routes for Topics](./phase-04-api-routes-for-topics.md) | Complete |
| 5 | [UI Topic Review Components](./phase-05-ui-topic-review-components.md) | Complete |
| 6 | [AI Pipeline Tab Redesign](./phase-06-ai-pipeline-tab-redesign.md) | Complete |

## Key Constraints

- Supabase Edge Functions run on **Deno** — no Node.js APIs
- Do NOT break existing `bank_questions`, `document_sources` columns, or `question-bank` CRUD routes
- Cap at **15 questions/topic** max to avoid token blowout
- If document text >100K chars: split for topic extraction, merge/dedup results

## Status State Machine

```
pending → extracting_topics → topics_ready → generating_questions → done | failed
```

## Dependencies

- **Blocked by** `260514-question-bank-rebuild` — that plan rebuilds `question-bank-client.tsx` and the AI Pipeline tab component we extend here
