# Component Consolidation & Reuse — Reflactor Plan

> Goal: kill component duplication, establish a discoverable canonical layer in `src/components/ui/`,
> and add governance so new features compose existing components instead of re-creating them.
> Composite components live **flat in `ui/`** (decided). Token system already reconciled (see `docs/design-guidelines.md`).

**Branch:** feat/component-consolidation · **Created:** 2026-05-24 · **Status:** Phase 0 ✅ + Phase 1 ✅ done (uncommitted)

## Problem (audited)
- **KPI/stat card** re-implemented 6+× (dashboard ×3, crm ×2, question-bank ×1) + dead `shares/shared-kpi-card`.
- **Status chip** tone-mapping re-derived: `crm/status-badge` (14 consumers) + 20 inline defs + 29 ad-hoc color files.
- **Empty state** ×38 (1 component + 1 dead + 36 inline).
- **Data table** 3 components + 6 inline `<table>`.
- **Page header / tabs / select / score** scattered; `ui/page-header` exists but 0 uses.
- **`shares/*` (light-palette, off-theme):** consumed via barrel `@/components/shares`. 7/10 dead (removed in Phase 0); **3 live: `SharedDashboardButton` (23 files/137 uses), `SharedDashboardPageHeader` (2), `SharedStatusChip` (1)** — render the deprecated light palette `#056DFF`/white inside the dark shell → migrate in Phase 2.
- **Color drift:** `#FFB86C` ×64 (not in palette — should be amber `#FBBF24`).
- **Monoliths** >200 LOC hide more dupes: `tests/create-test-workbench` (80KB), `recruitment/cv-upload-dialog` (37KB), `dashboard/assessment-grid` (35.6KB), `management/level-config-step` (26.6KB), `dashboard/assessment-card` (19.5KB).
- **Missing foundational ATOMS** (reimplemented inline): no `ui/table` (6 raw `<table>`), no `ui/skeleton` (24 inline `animate-pulse`), no `ui/status-dot` (22 inline), no `ui/score-bar` (33 inline), no `ui/field` form wrapper (24 inline `<label>`), no `ui/segmented` (dashboard-mode-tabs). §7.7b/§7.7d describe these but no component exists.

## Root cause
Two gaps: (1) missing **atom** layer — molecules get hand-rolled because base primitives (table, skeleton, status-dot, score-bar, field) don't exist; (2) no **composite** layer + no reuse-first catalog/guard. `shares/*` was an abandoned (light-theme) attempt.

## Phases
| Phase | File | Scope | Risk |
|---|---|---|---|
| 0 ✅ | [phase-00-remove-dead-code.md](phase-00-remove-dead-code.md) | Deleted 7 dead `shares/*`; trimmed barrel to live trio | None |
| 1 ✅ | [phase-01-canonical-components.md](phase-01-canonical-components.md) | Built 6 atoms (`table`,`skeleton`,`status-dot`,`score-bar`,`field`,`segmented`) + 5 molecules (`status-chip`,`kpi-card`,`kpi-card-grid`,`empty-state`,`data-table`) + `lib/ui/status-tone`; tokenized `page-header`. Build green | Low |
| 2 | [phase-02-migrate-features.md](phase-02-migrate-features.md) | Migrate dashboard → crm → recruitment → question-bank; fix `#FFB86C` drift | Medium |
| 3 🔄 | [phase-03-split-monoliths.md](phase-03-split-monoliths.md) | assessment-card ✅, level-config-step ✅, assessment-grid ✅, cv-upload-dialog ✅ split. create-test-workbench: matrix logic extracted ✅, full JSX decomposition deferred (dedicated session) | Medium-High |
| 4 ✅ | [phase-04-governance.md](phase-04-governance.md) | Created `docs/component-index.md` (reuse-first catalog + PR checklist); CLAUDE.md §5 reuse-first mandate; design-guidelines §7.0. Lint = checklist (Option A) | None |

## Strategy
**Incremental, not big-bang.** Each phase ships independently; phase 2 is per-feature small PRs. Verify `npx tsc --noEmit` + `npm run build` (exit 0) after every phase. No behavior change — visual/structural parity only.

## Dependencies
- Phase 1 before 2 (need canonical components to migrate to).
- Phase 2 before 3 (monolith extraction reuses canonical layer).
- Phase 4 anytime after 1 (catalog the canonical set).

## Success criteria
- 0 files import `shares/*`; dir deleted.
- 1 KPI card, 1 status chip + 1 tone-map util, 1 empty state, 1 table shell used across features.
- 0 occurrences `#FFB86C`; status colors only via `lib/ui/status-tone`.
- `docs/component-index.md` exists; CLAUDE.md mandates reuse-first check.
- All builds green; no visual regressions on dashboard/crm/recruitment.

## Unresolved questions
- KPI card: confirm single generic (data-prop) vs 2-3 variants — plan assumes single generic.
- Monolith split (phase 3): scope per file unknown until opened; may spawn sub-tasks.
- Lint enforcement (phase 4): custom ESLint rule vs review-checklist convention — TBD.
