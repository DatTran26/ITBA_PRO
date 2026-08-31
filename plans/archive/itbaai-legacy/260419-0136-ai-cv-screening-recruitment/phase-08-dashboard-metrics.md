# Phase 8 — Dashboard Metrics

## Context Links
- `src/components/crm/kpi-card-grid.tsx`
- All prior phases (data source)

## Overview
- **Priority:** P3
- **Status:** pending
- **Description:** Recruitment analytics page with KPIs and stage funnel.

## Key Insights
- Aggregate with a single SQL function or view (keep DB round-trips minimal)
- Metrics over configurable range (default last 30 days)

## Requirements
**Functional**
- GET `/api/recruitment/dashboard?from=...&to=...&jd_id=...`
- Metrics:
  - total_cvs_uploaded
  - total_applications_by_status (map)
  - avg_ai_score
  - pass_rate = PASSED / INTERVIEWED
  - offer_acceptance_rate = ACCEPTED / OFFERED
  - stage_conversion funnel (NEW→SCREENED→SHORTLISTED→INTERVIEWED→PASSED→OFFERED→ONBOARDED)
  - processing_queue_count (parse_status in pending/processing)
- Page `/dashboard/recruitment/dashboard`
- Role: recruiter/admin/super_admin

## Architecture
```ts
interface RecruitmentDashboard {
  range: { from: string; to: string };
  totals: { cvsUploaded: number; byStatus: Record<PipelineStatus, number> };
  averages: { aiScore: number };
  rates: { passRate: number; offerAcceptanceRate: number };
  funnel: Array<{ stage: string; count: number }>;
  processingQueue: number;
}
```

## Related Code Files
**Create**
- `src/app/api/recruitment/dashboard/route.ts`
- `src/app/dashboard/recruitment/dashboard/page.tsx`
- `src/app/dashboard/recruitment/dashboard/dashboard-client.tsx`
- `src/components/recruitment/stage-funnel.tsx`
- `supabase/migrations/<NN>_recruitment_dashboard_view.sql` (optional materialized view)

## Implementation Steps
1. Decide: single RPC function vs multiple queries — prefer one SQL RPC returning JSON
2. Create RPC `recruitment_dashboard(from,to,jd_id)` returning jsonb
3. API route calls RPC, role-guards, returns shape
4. Dashboard page: KPI cards (reuse `kpi-card-grid`) + stage funnel
5. Date-range picker (default last 30 days)
6. JD filter dropdown (from Phase 7)

## Todo
- [ ] RPC function
- [ ] API route
- [ ] KPI grid
- [ ] Stage funnel component
- [ ] Date-range + JD filter
- [ ] Page composition

## Success Criteria
- Dashboard renders in <1s with realistic data (1k applications)
- Numbers reconcile with list views
- JD filter narrows all metrics consistently

## Risk Assessment
- **Risk:** Slow aggregates at scale → add indexes and/or nightly materialized view
- **Risk:** Division by zero in rates → return 0 when denominator 0

## Security Considerations
- Role guard — hr cannot see aggregate metrics
- RPC uses `security definer` carefully — filter by auth uid if needed

## Next Steps
- Post-launch: email digests, per-JD benchmarking
