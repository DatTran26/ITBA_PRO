# Phase 7: Dashboard Dual Mode — Recruitment vs Employee Evaluation

## Context Links
- [Phase 4: UI Management Pages](./phase-04-ui-management-pages.md)
- [Phase 5: Test Engine Extension](./phase-05-extend-test-engine.md)
- [Phase 6: Employee Evaluation Flow](./phase-06-employee-evaluation-flow.md)
- [Existing dashboard page](../../src/app/dashboard/page.tsx)
- [Existing dashboard client](../../src/app/dashboard/dashboard-client.tsx)
- [Existing dashboard types](../../src/app/dashboard/types.ts)
- [Existing dashboard components](../../src/components/dashboard/)

## Overview
- **Priority**: P2
- **Status**: Completed
- **Effort**: 3h
- **Dependencies**: Phase 4, 5, 6
- **Description**: Add tab-based mode switching to the main dashboard; compute and display employee-specific KPIs alongside existing recruitment metrics

## Key Insights
- Current dashboard: 6 KPI cards, pipeline stages, monthly chart, assessment grid, attention candidates, AI insights
- All data driven by `tests` + `results` tables; new `target_type` column enables filtering
- Minimal structural change: existing components receive filtered data based on active tab
- Employee mode adds: skill evaluation stats, level distribution, position coverage metrics
- Dashboard server page does the heavy lifting (data fetch + computation); client is display-only
- Tab state can use URL searchParam (`?mode=recruitment|employee`) for shareable links

## Requirements

### Functional
- F1: Tab switcher at top: "Recruitment" (default) | "Employee Evaluation"
- F2: Recruitment tab: existing dashboard view, filtered to `target_type = 'candidate'`
- F3: Employee tab: similar layout but filtered to `target_type = 'employee'` with employee-specific KPIs
- F4: Employee KPIs: total employees evaluated, avg skill score, positions with gaps, pending evaluations
- F5: Employee pipeline: Evaluated -> Skills Assessed -> Level Confirmed
- F6: Skill gap overview: top skills where avg score < required level
- F7: Tab selection persisted in URL searchParams

### Non-Functional
- NF1: No API changes needed; all data computed server-side from existing queries
- NF2: Component reuse: KPI cards, assessment grid, monthly chart work for both modes
- NF3: Loading state handles both modes without layout shift
- NF4: All new files under 200 LOC

## Architecture

### Data Flow
```
Dashboard Server Page (page.tsx):
  1. Read ?mode from searchParams (default: 'recruitment')
  2. Fetch ALL tests + results (same as today)
  3. Split by target_type:
     - candidateTests = tests.filter(t => t.target_type !== 'employee')
     - employeeTests = tests.filter(t => t.target_type === 'employee')
  4. Compute stats for active mode
  5. For employee mode: fetch additional data
     - skill_evaluations aggregate (avg scores per skill)
     - persons with type='employee' count
  6. Pass mode + mode-specific data to client
```

### Component Additions
```
src/components/dashboard/
├── dashboard-mode-tabs.tsx    (NEW — mode switcher)
├── employee-kpi-cards.tsx     (NEW — employee-specific KPIs)
├── skill-gap-overview.tsx     (NEW — skill gaps chart/list)
└── [existing components reused with filtered data]
```

### Employee KPI Definitions

| KPI | Computation |
|-----|------------|
| Employees Evaluated | count of unique person_id in results where test.target_type = 'employee' |
| Avg Skill Score | avg of skill_evaluations.score across all employee results |
| Positions with Gaps | count of positions where any mandatory skill has avg score < required_level |
| Pending Evaluations | count of employee results with no skill_evaluations |
| Evaluation Completion | % of employee results that have skill_evaluations for all required skills |

### Employee Pipeline Stages

| Stage | Count Source |
|-------|------------|
| Test Completed | employee results count |
| Skills Assessed | results with at least 1 skill_evaluation |
| Level Confirmed | persons with current_level != null linked to employee results |

## Related Code Files

| File | Action | Purpose |
|------|--------|---------|
| `src/app/dashboard/page.tsx` | MODIFY | Read mode param, split data, compute employee stats |
| `src/app/dashboard/dashboard-client.tsx` | MODIFY | Accept mode prop, conditionally render mode content |
| `src/app/dashboard/types.ts` | MODIFY | Add employee stats types |
| `src/components/dashboard/dashboard-mode-tabs.tsx` | CREATE | Mode tab switcher |
| `src/components/dashboard/employee-kpi-cards.tsx` | CREATE | Employee-specific KPI cards |
| `src/components/dashboard/skill-gap-overview.tsx` | CREATE | Skill gap visualization |

## Implementation Steps

### Step 1: Update dashboard types

**`src/app/dashboard/types.ts`** — add:
```typescript
export type DashboardMode = 'recruitment' | 'employee';

export interface EmployeeStats {
  employeesEvaluated: number;
  avgSkillScore: number | null;
  positionsWithGaps: number;
  pendingEvaluations: number;
  evaluationCompletion: number; // 0-100 percentage
}

export interface EmployeePipelineStage {
  label: string;
  count: number;
  color: string;
  bgColor: string;
}

export interface SkillGapItem {
  skillName: string;
  category: string | null;
  avgScore: number;
  requiredLevel: number;
  gapSize: number; // requiredLevel - avgScore
  evaluationCount: number;
}
```

### Step 2: Create mode tabs component

**`src/components/dashboard/dashboard-mode-tabs.tsx`** (~50 LOC)
```typescript
'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { DashboardMode } from '@/app/dashboard/types';

interface DashboardModeTabsProps {
  activeMode: DashboardMode;
}

export default function DashboardModeTabs({ activeMode }: DashboardModeTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleModeChange(mode: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('mode', mode);
    router.push(`/dashboard?${params.toString()}`);
  }

  return (
    <Tabs value={activeMode} onValueChange={handleModeChange}>
      <TabsList>
        <TabsTrigger value="recruitment">Recruitment</TabsTrigger>
        <TabsTrigger value="employee">Employee Evaluation</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
```

### Step 3: Create employee KPI cards

**`src/components/dashboard/employee-kpi-cards.tsx`** (~90 LOC)
- Same visual pattern as existing `kpi-cards.tsx`
- 5 cards: Employees Evaluated, Avg Skill Score, Positions with Gaps, Pending Evaluations, Completion %
- Icons: Users, BarChart3, AlertTriangle, ClipboardList, CheckCircle
- Color coding: gaps and pending in amber, completion in green

### Step 4: Create skill gap overview

**`src/components/dashboard/skill-gap-overview.tsx`** (~100 LOC)
- Card with title "Skill Gap Overview"
- List of top 10 skills sorted by gap size (descending)
- Each row: skill name | category badge | required vs avg bar | gap indicator
- Visual: horizontal bar showing avgScore vs requiredLevel
- Empty state when no gaps found: "All skills meet requirements"

### Step 5: Update dashboard server page

**`src/app/dashboard/page.tsx`** — modifications:
```typescript
// 1. Read mode from searchParams
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const { mode: modeParam } = await searchParams;
  const mode: DashboardMode = modeParam === 'employee' ? 'employee' : 'recruitment';

  // 2. Existing data fetch (unchanged)
  // ... fetch tests, results

  // 3. Filter by mode
  const modeTests = mode === 'employee'
    ? (rawTests || []).filter(t => t.target_type === 'employee')
    : (rawTests || []).filter(t => t.target_type !== 'employee');

  const modeTestIds = modeTests.map(t => t.id);
  const modeResults = allResults.filter(r => modeTestIds.includes(r.test_id));

  // 4. Compute existing stats using modeResults instead of allResults
  // (same logic, different data source)

  // 5. For employee mode: fetch additional data
  let employeeStats: EmployeeStats | null = null;
  let skillGaps: SkillGapItem[] = [];

  if (mode === 'employee') {
    // Fetch skill evaluations aggregate
    const evalResultIds = modeResults.map(r => r.id);
    const { data: evaluations } = evalResultIds.length > 0
      ? await supabase
          .from("skill_evaluations")
          .select("skill_id, score, skills(name, category)")
          .in("result_id", evalResultIds)
      : { data: [] };

    // Compute employee-specific stats...
    // (aggregation logic for avgSkillScore, positionsWithGaps, etc.)
  }

  // 6. Pass to client
  return (
    <DashboardClient
      mode={mode}
      user={userData}
      tests={tests}
      stats={stats}
      pipeline={pipeline}
      monthlyData={monthlyData}
      attentionCandidates={attentionCandidates}
      pendingAiResults={pendingAiResults}
      employeeStats={employeeStats}     // NEW
      skillGaps={skillGaps}             // NEW
    />
  );
}
```

### Step 6: Update dashboard client

**`src/app/dashboard/dashboard-client.tsx`** — modifications:
1. Accept new props: `mode`, `employeeStats`, `skillGaps`
2. Add `DashboardModeTabs` at top of page (below header)
3. Conditional rendering based on mode:

```tsx
<DashboardModeTabs activeMode={mode} />

{mode === 'recruitment' ? (
  <>
    <KpiCards stats={stats} />
    <PipelineOverview pipeline={pipeline} />
    <MonthlyChart data={monthlyData} />
    <AssessmentGrid tests={localTests} ... />
    <CandidatesAttention candidates={attentionCandidates} />
    <AiInsights ... />
  </>
) : (
  <>
    <EmployeeKpiCards stats={employeeStats} />
    <PipelineOverview pipeline={pipeline} />  {/* reused with employee data */}
    <MonthlyChart data={monthlyData} />       {/* reused with employee data */}
    <SkillGapOverview gaps={skillGaps} />
    <AssessmentGrid tests={localTests} ... /> {/* reused, shows employee tests */}
  </>
)}
```

### Step 7: Verify compilation and visual QA
- `npm run build`
- Test recruitment mode (default) — identical to current dashboard
- Test employee mode — new KPIs, skill gaps
- Test tab switching preserves other URL state
- Test with no employee data (empty states)

## Todo List
- [ ] Update `src/app/dashboard/types.ts` with employee types
- [ ] Create `src/components/dashboard/dashboard-mode-tabs.tsx`
- [ ] Create `src/components/dashboard/employee-kpi-cards.tsx`
- [ ] Create `src/components/dashboard/skill-gap-overview.tsx`
- [ ] Modify `src/app/dashboard/page.tsx` — mode filtering + employee stats
- [ ] Modify `src/app/dashboard/dashboard-client.tsx` — mode-conditional rendering
- [ ] Verify compilation (`npm run build`)
- [ ] Test recruitment mode unchanged
- [ ] Test employee mode with and without data
- [ ] Test tab switching + URL persistence
- [ ] Visual QA in dark/light mode

## Success Criteria
- Mode tabs appear on dashboard; default is "Recruitment"
- Recruitment mode shows identical content to current dashboard
- Employee mode shows employee-specific KPIs and skill gap overview
- Assessment grid in employee mode only shows employee-type tests
- Pipeline stages appropriate for each mode
- Tab selection reflected in URL (?mode=employee)
- Empty states when no employee data exists
- All new files under 200 LOC
- No regressions on existing dashboard functionality

## Risk Assessment
| Risk | Impact | Mitigation |
|------|--------|------------|
| Dashboard page.tsx grows with dual computation | MEDIUM | Extract employee stats computation into helper function in separate file |
| Skill gap aggregation query slow with many evaluations | LOW | Indexed on result_id; limited to current user's data |
| Tab flicker on mode switch (server re-render) | LOW | Use loading.tsx skeleton; consider client-side filtering if UX is poor |
| Existing dashboard tests break | HIGH | Recruitment mode filter includes null/undefined target_type (backward compat) |

## Security Considerations
- Mode parameter is validated server-side (only 'recruitment' or 'employee')
- Employee stats computed from same RLS-protected queries
- No additional API endpoints needed
- URL searchParam is not sensitive data

## Next Steps
- Phase 8: Data migration (existing candidates to persons table)
