# Phase 0 — Remove Dead Code (CORRECTED)

**Priority:** First · **Risk:** None (for the 7 dead) · **Status:** In progress

## ⚠️ Correction to earlier audit
`shares/*` is consumed via the **barrel `@/components/shares`** (not direct `shares/shared-*` paths), so the first grep wrongly reported "all 10 dead." Re-verified actual external usage:

| Shared component | External consumers | Verdict |
|---|---|---|
| `SharedDashboardButton` | **23 files / 137 usages** | **LIVE — migrate first** (off-theme light palette `#056DFF`) |
| `SharedDashboardPageHeader` | 2 files | LIVE — migrate (→ `ui/page-header`) |
| `SharedStatusChip` | 1 file | LIVE — migrate (→ `ui/status-chip`) |
| `SharedKpiCard` | 0 | **DEAD — delete** |
| `SharedIconButton` | 0 | **DEAD — delete** |
| `SharedFilterBar` | 0 | **DEAD — delete** |
| `SharedEmptyState` | 0 | **DEAD — delete** |
| `SharedDataTableShell` | 0 | **DEAD — delete** |
| `SharedDashboardTabs` | 0 | **DEAD — delete** |
| `SharedDashboardCard` (+Body/Header) | 0 | **DEAD — delete** |

## Phase 0 scope (safe, now)
Delete the **7 dead** files + trim barrel to the 3 live exports. The 3 live ones move to Phase 2 migration.

### Steps
1. Delete: `shared-kpi-card.tsx`, `shared-icon-button.tsx`, `shared-filter-bar.tsx`, `shared-empty-state.tsx`, `shared-data-table-shell.tsx`, `shared-dashboard-tabs.tsx`, `shared-dashboard-card.tsx`.
2. Trim `shares/index.ts` to export only `SharedDashboardButton`, `SharedDashboardPageHeader`, `SharedStatusChip`.
3. `npx tsc --noEmit` + `npm run build` → exit 0.

## Todo
- [ ] Delete 7 dead files
- [ ] Trim barrel
- [ ] Build green

## Success criteria
- 7 dead files gone; barrel exports 3; build exit 0; no broken imports.

## Risk
- None — the 7 have 0 external consumers (verified per-symbol). Live trio untouched.
