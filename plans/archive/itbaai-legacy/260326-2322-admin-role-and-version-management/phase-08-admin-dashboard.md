# Phase 8: Admin Dashboard Mode

## Context Links

- [Brainstorm Report](../reports/brainstorm-260326-2322-admin-role-and-version-management.md)
- [Dashboard Types](../../src/app/dashboard/types.ts)
- [Dashboard Page](../../src/app/dashboard/page.tsx)
- [Dashboard Client](../../src/app/dashboard/dashboard-client.tsx)
- [Mode Tabs](../../src/components/dashboard/dashboard-mode-tabs.tsx)
- Phase 2 (Settings), Phase 4 (Token Monitoring)

## Overview

- **Priority**: P2
- **Status**: pending
- **Effort**: 5h

Add a third "Admin" mode to the existing dashboard segmented toggle. Hidden from recruiter users. Shows platform health KPIs: total users, assessments, token usage chart, cost estimate, feature breakdown, most active recruiters, and latest version.

## Key Insights

- `DashboardMode` type is currently `"recruitment" | "employee"` — extend to include `"admin"`
- `DashboardModeTabs` renders from a `modes` array — add admin entry conditionally
- Dashboard `page.tsx` (server) already checks role (`userData?.role !== "admin"`) — reuse for admin mode data
- Mode selection via `?mode=` searchParam — admin mode is `?mode=admin`
- Admin dashboard data comes from:
  - `users` table: total, by role
  - `tests` table: total, by target_type
  - `results` table: total, by status
  - `ai_usage` table: aggregated token stats (from Phase 4)
  - `versions` table: latest published
- Server component must NOT send admin data to non-admin clients

## Requirements

### Functional
- Add `"admin"` to DashboardMode type
- "Admin" tab in mode toggle, visible only when user role is admin
- Admin KPI cards: Total Users, Total Assessments, Total Submissions, Token Usage, Est. Cost
- Token usage chart (by day, last 30 days)
- Feature breakdown (pie/bar: tokens by feature)
- Most active recruiters (top 5 by tests created)
- Latest published version card
- Quick links: Settings, Templates, Export, User Management

### Non-functional
- Server-side role gate: if mode=admin but user is recruiter → fallback to recruitment mode
- Charts rendered client-side (lightweight — use CSS bars or simple SVG, avoid heavy chart libs)
- Data fetched server-side, passed as props

## Architecture

### Component Tree

```
DashboardPage (Server)
├── if mode === "admin" && isAdmin:
│   ├── Fetch admin stats (users, tests, results, ai_usage, versions)
│   └── Pass to DashboardClient with adminStats prop
│
DashboardClient
├── DashboardModeTabs (now 3 modes if admin)
├── if mode === "admin":
│   ├── AdminKpiCards (users, assessments, tokens, cost)
│   ├── TokenUsageChart (bar chart, last 30 days)
│   ├── FeatureBreakdown (horizontal bars by feature)
│   ├── ActiveRecruiters (top 5 table)
│   ├── LatestVersion (card)
│   └── AdminQuickLinks (Settings, Templates, Export, Users)
```

### New Types

```typescript
// Add to src/app/dashboard/types.ts

export type DashboardMode = "recruitment" | "employee" | "admin";

export interface AdminStats {
  totalUsers: number;
  totalAdmins: number;
  totalRecruiters: number;
  totalAssessments: number;
  totalSubmissions: number;
  totalTokensIn: number;
  totalTokensOut: number;
  totalCost: number;
  tokensByFeature: { feature: string; tokens: number; cost: number }[];
  tokensByDay: { date: string; tokens: number; cost: number }[];
  topRecruiters: { name: string; email: string; testCount: number }[];
  latestVersion: { version_number: string; title: string; status: string; created_at: string } | null;
}
```

## Related Code Files

### Files to Create
- `D:\Projects\Git Private\ITBAAI\src\components\dashboard\admin-kpi-cards.tsx`
- `D:\Projects\Git Private\ITBAAI\src\components\dashboard\token-usage-chart.tsx`
- `D:\Projects\Git Private\ITBAAI\src\components\dashboard\feature-breakdown.tsx`
- `D:\Projects\Git Private\ITBAAI\src\components\dashboard\active-recruiters.tsx`
- `D:\Projects\Git Private\ITBAAI\src\components\dashboard\admin-quick-links.tsx`

### Files to Modify
- `D:\Projects\Git Private\ITBAAI\src\app\dashboard\types.ts` — extend DashboardMode, add AdminStats
- `D:\Projects\Git Private\ITBAAI\src\app\dashboard\page.tsx` — add admin mode data fetching
- `D:\Projects\Git Private\ITBAAI\src\app\dashboard\dashboard-client.tsx` — add admin mode layout
- `D:\Projects\Git Private\ITBAAI\src\components\dashboard\dashboard-mode-tabs.tsx` — add admin tab (conditional)

## Implementation Steps

### Step 1: Extend types

Modify `src/app/dashboard/types.ts`:
- Change `DashboardMode` to include `"admin"`
- Add `AdminStats` interface

### Step 2: Update mode tabs

Modify `src/components/dashboard/dashboard-mode-tabs.tsx`:
- Accept `isAdmin` prop
- Add admin mode entry with `ShieldCheck` icon, only when `isAdmin` is true

```typescript
const modes: { value: DashboardMode; label: string; icon: typeof Briefcase; adminOnly?: boolean }[] = [
  { value: "recruitment", label: "Recruitment", icon: Briefcase },
  { value: "employee", label: "Employee Evaluation", icon: Users },
  { value: "admin", label: "Admin", icon: ShieldCheck, adminOnly: true },
];

// Filter: modes.filter(m => !m.adminOnly || isAdmin)
```

### Step 3: Add admin data fetching in server page

Modify `src/app/dashboard/page.tsx`:

```typescript
// Extend mode resolution
const mode: DashboardMode =
  modeParam === "admin" && userData?.role === "admin" ? "admin"
  : modeParam === "employee" ? "employee"
  : "recruitment";

// If mode === "admin", fetch:
let adminStats: AdminStats | null = null;
if (mode === "admin") {
  // Use admin supabase client or service role for cross-user aggregation
  const adminDb = createAdminClient();

  // Total users by role
  const { data: users } = await adminDb.from("users").select("role");
  // Total tests, results
  const { count: testCount } = await adminDb.from("tests").select("*", { count: "exact", head: true });
  const { count: resultCount } = await adminDb.from("results").select("*", { count: "exact", head: true });

  // Token usage aggregation
  const { data: usageData } = await adminDb
    .from("ai_usage")
    .select("feature, tokens_in, tokens_out, cost_estimate, created_at")
    .gte("created_at", thirtyDaysAgo);

  // Top recruiters
  const { data: recruiterTests } = await adminDb
    .from("tests")
    .select("recruiter_id, users(name, email)")
    .order("created_at", { ascending: false });

  // Latest version
  const { data: latestVer } = await adminDb
    .from("versions")
    .select("version_number, title, status, created_at")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // Assemble adminStats...
}
```

### Step 4: Create admin dashboard components

**`admin-kpi-cards.tsx`**: Grid of 5 KPI cards
- Total Users (admin/recruiter breakdown)
- Total Assessments
- Total Submissions
- Token Usage (input + output combined)
- Estimated Cost (formatted USD)

**`token-usage-chart.tsx`**: Horizontal bar chart (CSS-based, no chart library)
- Last 30 days, one bar per day
- Bar height proportional to token count
- Tooltip on hover with exact count + cost
- Color gradient: low usage = blue, high = purple

**`feature-breakdown.tsx`**: Horizontal bars
- One bar per feature (generate, analyze, etc.)
- Width proportional to token usage
- Label + percentage + count

**`active-recruiters.tsx`**: Simple table
- Top 5 recruiters by test count
- Columns: Name, Email, Tests Created

**`admin-quick-links.tsx`**: Grid of link cards
- Settings, Templates, Export, Users, Versions
- Each with icon + label + description

### Step 5: Wire admin mode in dashboard client

Modify `src/app/dashboard/dashboard-client.tsx`:
- Accept `adminStats` prop (optional)
- Accept `isAdmin` prop
- Pass `isAdmin` to `DashboardModeTabs`
- Add `mode === "admin"` rendering branch with admin components

## Todo List

- [ ] Extend `DashboardMode` type to include `"admin"`
- [ ] Add `AdminStats` interface to types.ts
- [ ] Update `dashboard-mode-tabs.tsx` with conditional admin tab
- [ ] Add admin mode data fetching in `page.tsx`
- [ ] Create `admin-kpi-cards.tsx`
- [ ] Create `token-usage-chart.tsx` (CSS-based bar chart)
- [ ] Create `feature-breakdown.tsx`
- [ ] Create `active-recruiters.tsx`
- [ ] Create `admin-quick-links.tsx`
- [ ] Wire admin components in `dashboard-client.tsx`
- [ ] Test: admin sees 3-mode toggle, recruiter sees 2-mode toggle
- [ ] Test: mode=admin in URL for recruiter falls back to recruitment
- [ ] Test: admin KPI cards show correct aggregated data
- [ ] Test: token chart renders with data from ai_usage table

## Success Criteria

- Admin users see 3-tab mode toggle (Recruitment / Employee / Admin)
- Recruiter users see only 2 tabs (no Admin option)
- Admin dashboard shows platform-wide KPIs
- Token usage chart visualizes last 30 days
- Feature breakdown shows per-feature token distribution
- Top recruiters table shows most active users
- Quick links navigate to admin pages
- URL `?mode=admin` for non-admin silently falls back to recruitment

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Admin data queries are expensive (cross-user) | Medium | Use admin client with service role; cache for page load; limit date ranges |
| Token chart empty if Phase 4 not implemented | Low | Show "No data yet" state; chart components handle empty arrays |
| DashboardMode type change breaks existing code | Low | Additive change; existing "recruitment"/"employee" branches untouched |

## Security Considerations

- Server page guards: if not admin but mode=admin → fallback to recruitment
- Admin stats fetched via service-role client (bypasses RLS) — only on server side
- Admin data never sent to client if user is not admin
- `DashboardModeTabs` checks `isAdmin` prop — but true security is server-side mode resolution

## Next Steps

- Phase 9 (Navigation) ensures admin pages are discoverable
- Future: add real-time refresh for admin dashboard stats
