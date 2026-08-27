# Phase 2 — Migrate Features to Canonical Components

**Priority:** After Phase 1 · **Risk:** Medium · **Status:** Pending

## Overview
Replace per-feature duplicates with the canonical components. **Incremental, one feature dir per PR**, verify build + visual parity each step. Order by traffic: dashboard → crm → recruitment → question-bank → management/evaluation.

## ⚠️ Strategy: CONSERVATIVE (decided 2026-05-24)
Keep existing bespoke visuals (e.g. dashboard hero KPIs with accent-colored values/glow — NOT forced onto generic `ui/kpi-card`). Only migrate genuinely plain/duplicated cases; fix off-theme; enforce canonical for NEW code via §7.0. This **supersedes the earlier "B" choice** for SharedDashboardButton → use retheme-in-place (A) to avoid layout changes.

### Done this pass
- ✅ `#FFB86C` → sanctioned token `--accent-orange` (globals.css + guidelines §4.1/§4.5). Color unchanged; 172 hardcoded usages migrate opportunistically (no blanket codemod).
- ✅ `SharedDashboardButton` (137 uses) **rethemed in place** to tokens (light `#056DFF` → `bg-primary`, etc.); sizes/shape kept → 0 layout change, off-theme fixed. (Option A, not B.)
- ✅ `SharedStatusChip` rethemed to dark tints (§4.2).
- `SharedDashboardPageHeader` left as-is (already dark-palette `#ECF0F7`/`#5A6882`).

### Deferred under conservative
- Dashboard hero KPIs (kpi-cards/employee/admin): **keep bespoke** — do NOT force onto `ui/kpi-card`.
- ✅ `crm/status-badge` (14 consumers): rewritten as a thin adapter over `ui/status-chip` — tone from `lib/ui/status-tone` (extended with CRM statuses), `config` supplies label. All 14 consumers now render the canonical chip with 0 call-site edits; duplicate chip markup removed. (Full call-site inlining + file deletion deferred — opportunistic.)

## Legacy `shares/*` trio (light palette → tokens; do before deleting shares/)
- **`SharedDashboardButton`** — 23 files, 137 usages, off-theme (`#056DFF`/white). **DECISION: B — migrate to `ui/Button`.** Variant map: primary/default→`default`, outline/secondary→`outline`, tertiary→`ghost`(primary text)/`link`, ghost→`ghost`; size md/default→`default`(h-8) [accept compact shrink], lg→`lg`, sm→`sm`, icon→`icon`; `leadingIcon`/`trailingIcon`→inline children; `fullWidth`→`className="w-full"`. Per-page visual review (heights shrink h-11→h-8).
- **`SharedDashboardPageHeader`** (2 files) → `ui/page-header`.
- **`SharedStatusChip`** (1 file: question-bank/document-library-card) → `ui/status-chip`.
- After all three migrated/rethemed → delete `shares/` + barrel.

## Migration map (consumers verified)

### Dashboard
- `dashboard-client.tsx` imports all 3 KPI components (`admin-kpi-cards`, `employee-kpi-cards`, `kpi-cards`) → rebuild on `ui/kpi-card` + `ui/kpi-card-grid` driven by stats data. Delete the 3 once replaced.
- `dashboard-header.tsx` → adopt `ui/page-header`.
- Fix `#FFB86C` (×64) → amber `#FBBF24` token during this pass.

### CRM
- `crm/status-badge` (14 consumers) → `ui/status-chip` + `lib/ui/status-tone`. Consumers:
  groups/{groups-card-view, groups-table-view, [id]/group-header, [id]/group-overview-tab},
  persons/{persons-card-view, persons-table-view, [id]/person-profile-header},
  positions/{positions-card-view, positions-table-view, [id]/position-header, [id]/position-persons-tab},
  recruitment/[id]/{application-detail-client, cv-analyze/cv-analyze-client},
  `components/recruitment/status-timeline`.
- `crm/kpi-card` + `crm/kpi-card-grid` → `ui/kpi-card`. `crm/data-table` → `ui/data-table` (or becomes thin re-export during transition).
- `crm/filter-bar` → keep or promote to `ui/filter-bar` (evaluate; low priority).

### Recruitment / Question-bank
- `recruitment/custom-select-dropdown` + management selectors → evaluate vs `ui/select` (only migrate if behavior-equivalent).
- `question-bank/question-bank-table` → `ui/data-table`; `question-bank-stat-strip` → `ui/kpi-card` variants.

### Inline cleanups (across `src/app`)
- Inline `<table>`: `emails/logs/logs-client`, `skills/skills-matrix-view`, `skills/[id]/skill-positions-tab` → `ui/data-table` (skip `login/page.tsx` — decorative).
- 36 inline empty-state blocks → `ui/empty-state` (opportunistic, per file touched).
- 20 inline status defs + 29 ad-hoc color files → `ui/status-chip`.

## Steps (per feature, repeat)
1. Swap imports to canonical component.
2. Adapt data shape (write small mappers in feature, not new components).
3. Delete now-orphaned feature component.
4. Visual check (run app, compare page) + `npm run build`.

## Todo
- [ ] Dashboard KPIs + header + `#FFB86C` fix
- [ ] CRM status-chip migration (14 files)
- [ ] CRM kpi-card / data-table
- [ ] Recruitment + question-bank tables/stats
- [ ] Inline table + empty-state + status cleanups
- [ ] Each step: build green + visual parity

## Success criteria
- Deleted: dashboard ×3 KPI, `crm/status-badge`, `crm/kpi-card(+grid)`, `management/entity-empty-state`, `question-bank-table`.
- 0 `#FFB86C`; status colors only via `status-tone`.

## Risk
- Medium — visual regressions. Mitigate: one feature per PR, run app, diff screenshots on dashboard/crm.
- Data-shape mismatch → handle via per-feature mappers, NOT by widening canonical API excessively (avoid over-abstraction).
