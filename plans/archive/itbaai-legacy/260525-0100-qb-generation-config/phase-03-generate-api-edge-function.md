---
phase: 3
title: "Generate API + edge function"
status: pending
priority: P1
effort: "1d"
dependencies: [2]
---

# Phase 3: Generate API + edge function

## Overview
Extend the generate-questions API route + edge function to honor per-topic count, level ratio, and
question types, with server-side validation and backward compatibility.

## Requirements
- Functional: accept `{ approvedTopicIds, perTopicCounts, levelRatio, questionTypes }`. Generate
  `perTopicCounts[topic]` questions per topic, split by `levelRatio` (J/M/S), restricted to
  `questionTypes`. Server validates: topicIds⊆approved, counts≥1, ratio sum≈100, types⊆14 valid.
- Non-functional: **backward compatible** — if config absent, current default behavior. Cap total to a
  safe server max (cost guard) independent of client.

## Architecture
- Route: `src/app/api/document-sources/[id]/generate-questions/route.ts` — parse + validate new fields,
  default when omitted, forward to edge function payload.
- Edge fn: `supabase/functions/generate-questions-from-doc/index.ts` — thread config into the prompt:
  per-topic count, per-level split, allowed types. After AI returns, **post-validate**: enforce per-topic
  count (trim extras), aim for level split (tolerance), drop disallowed types. Record shortage if AI
  underproduced a (topic, level) bucket so review step can surface it.
- Persisted questions keep existing columns (`question_type`, `level`/difficulty, `topic`). No schema
  change required for A (skill_id is Sub-project B).

## Related Code Files
- Modify: `src/app/api/document-sources/[id]/generate-questions/route.ts`
- Modify: `supabase/functions/generate-questions-from-doc/index.ts`
- Reference: existing job result shape consumed by `ai-questions-review` (`/job` → `result_json`)

## Implementation Steps
1. Read the route + edge fn to learn current payload + prompt + result shape.
2. Route: zod/manual-validate new optional fields; defaults preserve current behavior; clamp total to server cap.
3. Edge fn: inject config into generation prompt (per-topic count, level split, allowed types).
4. Post-process AI output: enforce counts/types, compute per-(topic,level) shortage, attach to result.
5. Keep `result_json` shape compatible with `ai-questions-review`; add optional `shortage` field.
6. Deploy edge fn (`supabase functions deploy generate-questions-from-doc`) in target env — note for ops.

## Success Criteria
- [ ] Generated set respects per-topic count + types; level split within tolerance.
- [ ] Config omitted → identical to current behavior (no breakage).
- [ ] Total clamped to server cap; shortage surfaced in result when AI underproduces.

## Risk Assessment
- Risk: AI ignores count/level constraints. Mitigation: server post-validate (trim) + shortage signal.
- Risk: edge fn deploy drift between envs. Mitigation: document deploy step; verify in staging.
- Risk: prompt token cost with large totals. Mitigation: server cap + per-topic batching if needed.
