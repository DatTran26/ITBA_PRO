# HR Dashboard Design Spec
Date: 2026-04-20

## Goal
Give HR role a dedicated dashboard at `/dashboard` with recruitment stats, Upload CV CTA, and pipeline visibility — without modifying the existing `DashboardClient` used by other roles.

## Routing & Access

- HR visits `/dashboard` → renders `<HrDashboardClient>` (new component)
- All other roles → unchanged `<DashboardClient>`
- Middleware: remove redirect `/dashboard` → `/dashboard/recruitment` for HR
- Middleware: keep blocking HR from all other non-recruitment paths (`/dashboard/create`, `/dashboard/skills`, `/dashboard/persons`, etc.)
- After login: HR redirected to `/dashboard` (not `/dashboard/recruitment`)

## Layout

```
AppNavbar (Recruitment link only, no Management dropdown)
PageContainer
  ├── Header row
  │     left:  "Dashboard" title + "HR" badge
  │     right: [Upload CV] button (opens CvUploadDialog)
  ├── KPI cards (2 rows × 3)
  │     CVs Uploaded | Processing Queue | Avg AI Score
  │     Pass Rate    | Offers Sent      | Acceptance Rate
  ├── Charts row (lg: 3/4 + 1/4)
  │     MonthlyChart (applications over time)
  │     StageFunnel  (pipeline stage counts)
  └── Recent Applications table (last 20, click → /dashboard/recruitment/:id)
```

## Component Architecture

**New files:**
- `src/app/dashboard/hr-dashboard-client.tsx` — HR dashboard client component

**Modified files:**
- `src/app/dashboard/page.tsx` — branch on `isHr` to render `HrDashboardClient`
- `src/middleware.ts` — remove `/dashboard` redirect for HR; keep all other HR blocks

**Reused components (no changes):**
- `CvUploadDialog` (`src/components/recruitment/cv-upload-dialog.tsx`)
- `StageFunnel` (`src/components/recruitment/stage-funnel.tsx`)
- `MonthlyChart` (`src/components/dashboard/monthly-chart.tsx`) — reuse with recruitment data
- `KpiCardGrid` (`src/components/crm/kpi-card-grid.tsx`)
- `DataTable` (`src/components/crm/data-table.tsx`)
- `AppNavbar`, `PageContainer`

## Data Fetching

`HrDashboardClient` fetches on mount:
1. `GET /api/recruitment/dashboard` → KPI stats + funnel data
2. `GET /api/recruitment/applications?limit=20` → recent applications table

No server-side data passing needed — all client-side fetches (consistent with `RecruitmentDashboardClient` pattern).

## States

- **Loading:** skeleton cards
- **Empty:** "No applications yet — upload the first CV" with Upload CV CTA centered
- **Error:** toast + retry button

## Out of Scope
- Email collection / email status features (separate future feature)
- Bulk actions on HR dashboard (available on `/dashboard/recruitment`)
- HR-specific analytics filters (date range, JD filter available at `/dashboard/recruitment/dashboard`)
