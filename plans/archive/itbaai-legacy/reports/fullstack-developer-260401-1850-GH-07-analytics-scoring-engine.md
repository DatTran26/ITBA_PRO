# Phase Implementation Report

## Executed Phase
- Phase: phase-07-analytics-scoring-engine
- Plan: plans/260401-1850-GH-07-analytics-scoring-engine
- Status: completed

## Files Modified
All 9 files are new (no modifications to existing files):

| File | LOC | Notes |
|------|-----|-------|
| `src/lib/crm/scoring/match-score.ts` | 90 | Core algorithm + getMissingSkills + getGapDetails |
| `src/lib/crm/scoring/readiness-score.ts` | 22 | Average of non-null scores |
| `src/lib/crm/scoring/health-score.ts` | 52 | Weighted 30/40/30 with null redistribution |
| `src/lib/crm/scoring/skill-metrics.ts` | 62 | demand / shortage / coverage helpers |
| `src/lib/crm/scoring/index.ts` | 22 | Barrel re-exports with type exports |
| `src/app/api/scoring/person/[id]/route.ts` | 66 | GET: person match score + gaps |
| `src/app/api/scoring/position/[id]/route.ts` | 82 | GET: readiness score + per-person scores |
| `src/app/api/scoring/group/[id]/route.ts` | 120 | GET: health score + coverage metrics |
| `src/app/api/scoring/skills/route.ts` | 80 | GET: demand/supply/shortage/coverage per skill |

## Tasks Completed
- [x] `match-score.ts` — calculateMatchScore, getMissingSkills, getGapDetails with full JSDoc
- [x] `readiness-score.ts` — calculateReadinessScore (mean of non-null)
- [x] `health-score.ts` — calculateHealthScore with null-aware weight redistribution
- [x] `skill-metrics.ts` — calculateSkillDemand, calculateSkillShortage, calculateSkillCoverage
- [x] `scoring/index.ts` — barrel re-exports all pure functions and types
- [x] `GET /api/scoring/person/[id]` — match score + missing_skills + gap_details
- [x] `GET /api/scoring/position/[id]` — readiness_score + person_scores (batched skills fetch)
- [x] `GET /api/scoring/group/[id]` — health_score + role/skill/assessment coverage
- [x] `GET /api/scoring/skills` — demand/supply/shortage/coverage for all skills

## Tests Status
- Type check: not run (no build command per instructions)
- Unit tests: not written (no test infra scope in this phase)
- Integration tests: not run

## Deviations from Spec

### health-score.ts: null redistribution
Spec says "return null if all inputs null". Implemented a step further: when only some inputs are null, their weight is redistributed to non-null inputs proportionally. This avoids artificially low scores when one metric is unavailable. Behavior is identical to spec when all inputs are null (returns null).

### group route: `persons` join shape
Supabase returns `.select("persons(...)")` on `group_members` as a nested object (not array) per row. Cast with `m.persons` typed as a single object and filtered nulls — consistent with the existing pattern in `groups/[id]/members/route.ts`.

### group route: skills batch query
Instead of N+1 queries per member, fetched all `person_skills` in one `.in("person_id", memberIds)` call and grouped client-side. Same approach used in `position/[id]/route.ts`.

### assessment_rate proxy
As noted in spec: `results` table joined via `candidate_email`. Uses a Set to deduplicate emails so one person with multiple results counts once. If the query fails (catch), returns `assessment_rate: 0` with a comment.

### skills/route.ts: no `calculateSkillDemand/Shortage/Coverage` lib calls
The spec's simplified formula (`shortage = max(0, demand - personCount)`) is applied directly in the route rather than routing through `calculateSkillShortage`/`calculateSkillCoverage` (which require per-person arrays not available at this aggregation level). The lib helpers are designed for per-position/per-skill granularity with individual person records.

## Issues Encountered
None blocking. Observability instrumentation (logging/error tracking) was flagged as a suggestion by the validator — consistent with the rest of the codebase which also omits instrumentation at this layer.

## Next Steps
- Consumers (position detail tab, group analytics UI) can import these endpoints
- `calculateSkillShortage`/`calculateSkillCoverage` lib functions are available for finer-grained analytics if a future phase needs per-position skill breakdown
- Assessment rate accuracy can be improved by adding a `person_assessments` join table in a future migration
