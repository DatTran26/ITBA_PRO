---
title: "Phase 7 - Analytics & Scoring Engine"
status: completed
priority: P2
effort: 3h
---

## Context Links

- [Upgrade Spec](../../upgrade.md) - Section 7 (Analytics and Scoring Requirements)
- [Phase 1 - person_skills table](./phase-01-database-schema.md)
- [Existing position_skill_requirements](../../supabase/migrations/20260326000000_talent_assessment_schema.sql)
- [Code Patterns - fire-and-forget](../../docs/code-patterns.md)

## Overview

Build the scoring engine that powers match scores, readiness scores, health scores, and demand/shortage metrics. These are utility functions + API endpoints consumed by all 4 page redesigns.

## Key Insights

- Match score = person vs position: compare person_skills levels against position_skill_requirements levels.
- Readiness score = position metric: average match score of all persons assigned to that position.
- Health score = group metric: composite of role coverage + skill coverage + assessment completion.
- Demand = how many positions require a skill. Shortage = how many persons lack it among those who need it.
- Scores can be computed on-demand (in server components) or cached in DB columns for performance.
- Start with on-demand calculation; add DB caching if performance becomes an issue.

## Requirements

### Functional
- **7.1**: Person-to-position match score (0-100%)
- **7.2**: Group health score (0-100%)
- **7.3**: Position readiness score (0-100%)
- **7.4**: Skill demand and shortage metrics

### Non-Functional
- Pure functions (no side effects) for score calculations
- API endpoints for async computation when needed
- Under 200 LOC per file

## Architecture

### Score Calculation Logic

```
src/lib/crm/scoring/
  match-score.ts        (~60 LOC) - person-to-position match
  readiness-score.ts    (~40 LOC) - position readiness
  health-score.ts       (~60 LOC) - group health
  skill-metrics.ts      (~50 LOC) - demand/shortage per skill
  index.ts              (~10 LOC) - re-exports
```

### API Endpoints

```
GET /api/scoring/person/[id]     — returns match_score for a person
GET /api/scoring/position/[id]   — returns readiness_score for a position
GET /api/scoring/group/[id]      — returns health_score for a group
GET /api/scoring/skills          — returns demand/shortage for all skills
```

### Match Score Algorithm

```
Input:
  person_skills: { skill_id, current_level }[]
  position_skill_requirements: { skill_id, required_level, is_mandatory }[]

Algorithm:
  1. For each required skill in position:
     a. Find matching person_skill
     b. If missing AND mandatory: -20 penalty per missing mandatory
     c. If missing AND optional: -5 penalty per missing optional
     d. If present: skill_score = min(current_level / required_level, 1.0) * weight
     e. Weight: mandatory skills = 2x, optional = 1x
  2. Total = sum(skill_scores) / sum(weights) * 100
  3. Apply penalties (cap at 0 minimum)
  4. Return rounded integer 0-100

Edge cases:
  - No position assigned: return null
  - No skill requirements: return 100 (fully matched)
  - No person skills: return 0 (no data)
```

### Readiness Score Algorithm

```
Input:
  persons assigned to position (persons where position_id = this)

Algorithm:
  1. Compute match_score for each assigned person
  2. readiness = average(match_scores)
  3. If no persons assigned: return null (not "0")
  4. Return rounded integer 0-100
```

### Health Score Algorithm

```
Input:
  group members, their positions, their skills, assessment results

Algorithm:
  1. role_coverage = (members with assigned position) / total_members * 100
  2. skill_coverage = average match_score across all members
  3. assessment_rate = (members with at least 1 completed assessment) / total_members * 100
  4. health = (role_coverage * 0.3) + (skill_coverage * 0.4) + (assessment_rate * 0.3)
  5. If no members: return null
  6. Return rounded integer 0-100
```

### Skill Demand/Shortage

```
demand_score(skill_id) = count of position_skill_requirements where skill_id = this
shortage_score(skill_id) = count of persons in positions requiring this skill who don't have it (or have it below required level)
coverage_rate(skill_id) = (persons with adequate level) / (persons who need it) * 100
```

## Related Code Files

### Files to Create
- `src/lib/crm/scoring/match-score.ts`
- `src/lib/crm/scoring/readiness-score.ts`
- `src/lib/crm/scoring/health-score.ts`
- `src/lib/crm/scoring/skill-metrics.ts`
- `src/lib/crm/scoring/index.ts`
- `src/app/api/scoring/person/[id]/route.ts`
- `src/app/api/scoring/position/[id]/route.ts`
- `src/app/api/scoring/group/[id]/route.ts`
- `src/app/api/scoring/skills/route.ts`

### Files Modified by Consumers (not in this phase)
- Phases 3-6 pages use these scoring functions in their server components

## Implementation Steps

1. Create `src/lib/crm/scoring/match-score.ts`:
   - `calculateMatchScore(personSkills, positionRequirements)` pure function
   - Takes arrays of `{ skill_id, current_level }` and `{ skill_id, required_level, is_mandatory }`
   - Returns `number | null`

2. Create `src/lib/crm/scoring/readiness-score.ts`:
   - `calculateReadinessScore(personMatchScores: (number | null)[])` pure function
   - Filters nulls, computes average
   - Returns `number | null`

3. Create `src/lib/crm/scoring/health-score.ts`:
   - `calculateHealthScore({ roleCoverage, skillCoverage, assessmentRate })` pure function
   - Takes pre-computed sub-scores (each 0-100)
   - Returns `number | null`

4. Create `src/lib/crm/scoring/skill-metrics.ts`:
   - `calculateSkillDemand(positionRequirements)` — count
   - `calculateSkillShortage(personSkills, positionRequirements, assignedPersons)` — count of gaps
   - `calculateSkillCoverage(personSkills, positionRequirements, assignedPersons)` — percentage

5. Create `src/lib/crm/scoring/index.ts`: re-export all functions.

6. Create `src/app/api/scoring/person/[id]/route.ts`:
   - GET: fetch person's skills + assigned position's requirements
   - Call calculateMatchScore
   - Return `{ match_score, missing_skills: [], overqualified_skills: [] }`

7. Create `src/app/api/scoring/position/[id]/route.ts`:
   - GET: fetch all persons with this position_id
   - Compute match_score for each
   - Call calculateReadinessScore
   - Return `{ readiness_score, person_scores: [] }`

8. Create `src/app/api/scoring/group/[id]/route.ts`:
   - GET: fetch group members, their positions/skills, assessment counts
   - Compute sub-scores, call calculateHealthScore
   - Return `{ health_score, role_coverage, skill_coverage, assessment_rate }`

9. Create `src/app/api/scoring/skills/route.ts`:
   - GET: compute demand + shortage for all skills
   - Return `{ skills: [{ id, name, demand, shortage, coverage }] }`

## Todo

- [x] Create match-score.ts with calculateMatchScore
- [x] Create readiness-score.ts with calculateReadinessScore
- [x] Create health-score.ts with calculateHealthScore
- [x] Create skill-metrics.ts with demand/shortage/coverage functions
- [x] Create index.ts re-exports
- [x] Create person scoring API endpoint
- [x] Create position scoring API endpoint
- [x] Create group scoring API endpoint
- [x] Create skills scoring API endpoint
- [x] Write unit tests for scoring functions

## Success Criteria

- Match score correctly handles: all skills matched, missing mandatory, missing optional, no skills, no position
- Readiness score averages correctly across multiple persons
- Health score weighs role coverage (30%), skill coverage (40%), assessment rate (30%)
- Skill demand counts positions requiring each skill
- Shortage counts gaps accurately
- API endpoints return scores with auth check
- Pure functions are testable without DB
- All files under 200 LOC

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| On-demand scoring too slow for list pages | Medium | Compute in server component; if slow, add cached score columns |
| Scoring edge cases (empty data) return unexpected values | Medium | Return null for "not calculable" vs 0 for "actually zero" |
| Score algorithm changes later | Low | Pure functions make algorithm swaps easy |

## Security Considerations

- Scoring endpoints require authentication
- Scores derived from user's own data (RLS-scoped queries)
- No write operations in scoring (read-only)

## Next Steps

- After scoring engine complete, Phases 3-6 can display real scores
- Future: cache scores in DB columns, triggered by data changes
- Future: AI-powered recommendations based on scores
