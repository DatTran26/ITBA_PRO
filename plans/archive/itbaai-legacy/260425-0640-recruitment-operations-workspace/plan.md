---
title: "Recruitment Operations Workspace Redesign"
description: "Transform /dashboard/recruitment from dashboard-like view into HR operations workspace for filtering, reviewing, and acting on applications"
status: completed
priority: P1
effort: 10h
branch: main
tags: [recruitment, ui, hr, operations, table, filters]
created: 2026-04-25
blockedBy: []
blocks: []
---

# Recruitment Operations Workspace Redesign Plan

## Context

Brainstorm approved in `plans/reports/brainstorm-260425-0636-recruitment-operations-workspace.md`.

Current `/dashboard/recruitment` is too dashboard-like. User wants this screen to be a multi-use HR operations page, not an analytics dashboard. The page should optimize daily workflows: find candidates, filter pipeline, inspect CV status, schedule interviews, and act on rows quickly.

## Goal

Redesign `src/app/dashboard/recruitment/recruitment-client.tsx` into a compact, operational ATS-style workspace.

Primary outcome:
- Less hero/dashboard visual weight.
- More direct controls.
- Stronger table/list usability.
- Preserve current role permissions and existing data flow.

## Non-Goals

- No database schema changes.
- API changes are allowed in phase 1 for real advanced filters and recruitment CSV export.
- No full analytics dashboard here; reports stay at `/dashboard/recruitment/dashboard`. Schedule page already exists at `/dashboard/recruitment/schedule` and should be linked, not rebuilt.
- No drag/drop Kanban in phase 1.
- No overbuilt component framework.

## Existing Files

| File | Role |
|------|------|
| `src/app/dashboard/recruitment/recruitment-client.tsx` | Main page client UI, filters, actions, table/kanban rendering |
| `src/components/crm/data-table.tsx` | Reusable table component |
| `src/components/crm/kanban-board.tsx` | Existing Kanban view |
| `src/components/crm/view-switcher.tsx` | Table/Kanban switch |
| `src/components/crm/bulk-action-bar.tsx` | Bulk selected actions |
| `src/components/recruitment/cv-upload-dialog.tsx` | Upload CV flow |
| `src/components/recruitment/schedule-interview-dialog.tsx` | Schedule interview action |
| `src/app/api/recruitment/applications/route.ts` | Existing list API |

## Design Direction

Name: **Recruitment Operations Workspace**

Tone:
- ATS operations console.
- Compact, data-forward, action-first.
- Dark theme retained.
- Visual polish from spacing, hierarchy, row states, and micro interactions — not giant dashboard cards.

Recommended layout:

```text
Recruitment
Manage applications, CV analysis, pipeline actions

[Upload CV] [Lên lịch PV] [Báo cáo] [JDs] [Settings] [Table/Kanban]

[Search...] [Status] [JD] [CV Status] [Score] [Date] [Reset]

All 4 | New 2 | Screened 1 | Shortlisted 1 | Interview 0

Candidate | JD | Stage | AI Score | CV | Interview | Created | Actions
```

## Phase 1 — Reframe Header and Actions

**Goal:** Remove dashboard-like hero. Create compact operations header.

### Tasks
- [x] Replace large hero card with compact page header.
- [ ] Keep breadcrumb/back area above header.
- [ ] Title: `Recruitment` or `Recruitment Workspace`.
- [ ] Subtitle: short operational copy, not marketing text.
- [ ] Keep role-aware actions:
  - HR/Admin/Super Admin: Upload CV.
  - Recruiter/Admin/Super Admin: Báo cáo.
  - Interviewer/Admin/Super Admin: JDs.
  - Admin/Super Admin: Cài đặt.
- [ ] Add `Lên lịch PV` quick link to existing `/dashboard/recruitment/schedule` for HR/Admin/Super Admin. Do not rebuild schedule UI here.
- [ ] Keep `ViewSwitcher` visible at far right.

### Acceptance Criteria
- Header height less than current hero.
- No KPI cards in header.
- Primary action `Upload CV` is visually strongest.
- Secondary actions are visible but not dominant.

## Phase 2 — Build Operations Toolbar

**Goal:** Make filtering/search the central control, not dashboard cards.

### Tasks
- [ ] Create sticky or near-sticky toolbar panel under header.
- [ ] Keep text search connected to existing API query `q`.
- [ ] Keep status tabs connected to existing API `status` filter.
- [ ] Show status tab counts from currently loaded data.
- [ ] Add visual-only placeholders for future filters only if clearly disabled or marked coming soon.
Phase 1 filters:
- [x] Search (`q`) via API.
- [x] Pipeline status (`status`) via API.
- [x] JD (`jdId`) via API.
- [x] Score range (`minScore`, `maxScore`) via API.
- [x] CV status (`cvStatus`) via API; add API support because current route returns `candidate_cvs.parse_status` but does not filter it.
- [x] Created date range (`createdFrom`, `createdTo`) via API; add API support.
- [ ] Reset filters button.
- [ ] Avoid fake filters that do nothing. Advanced filters in scope must connect to API.

### Acceptance Criteria
- User can search and filter status as before.
- Reset clears search/status/local filters.
- Counts are readable.
- Toolbar does not take more than ~80px height on desktop.

## Phase 3 — Improve Table as Primary Workspace

**Goal:** Make table more actionable and readable.

### Tasks
- [ ] Keep `DataTable` unless limitations require minimal local wrapper.
- [ ] Improve columns:
  - Candidate: name, email, avatar/initials optional.
  - JD Title: position text, fallback `—`.
  - Pipeline Status: pill.
  - AI Score: color + optional mini bar.
  - CV Status: pill/text.
  - Created At: compact date.
  - Actions: view, schedule PV for shortlisted, more menu placeholder if needed.
- [ ] Ensure row hover clearly indicates clickability.
- [ ] Ensure row action buttons stop propagation where needed.
- [ ] Keep bulk reject behavior.
- [ ] Empty state: message with Upload CV CTA if no applications.

### Acceptance Criteria
- Table remains readable with 4 rows and 100+ rows.
- Row actions are discoverable.
- No broken navigation.
- Existing bulk selection works.

## Phase 4 — Keep Kanban as Alternate View

**Goal:** Preserve Kanban but make it subordinate to table.

### Tasks
- [ ] Keep current `KanbanBoard` integration.
- [ ] Polish card info density:
  - Candidate name.
  - JD title.
  - AI score if exists.
- [ ] CV status.
  - Created date.
- [ ] Keep click-to-detail.
- [ ] Do not add drag/drop in phase 1.

### Acceptance Criteria
- View switch table/kanban works.
- Kanban cards look consistent with new UI.
- No new state bugs.

## Phase 5 — Optional Preview Drawer (Phase 2 Feature)

**Goal:** Reduce detail-page clicks with side preview.

### Tasks
- [ ] Add selected application state.
- [ ] Click row opens right drawer instead of direct navigation only if UX approved.
- [ ] Drawer sections:
  - Candidate identity.
  - JD and pipeline status.
  - AI/CV score summary.
  - Quick actions: View full profile, Analyze CV, Schedule PV, Reject.
- [ ] Keep full detail page navigation available.

### Acceptance Criteria
- Drawer is optional, not blocking phase 1.
- Mobile fallback uses full-screen drawer or route navigation.
- No API expansion for preview drawer unless existing row payload is insufficient.

## Phase 6 — Recruitment CSV Export

**Goal:** Add CSV export directly from `/dashboard/recruitment` with current filters.

### Tasks
- [x] Add export action button in recruitment toolbar/header.
- [x] Prefer new route `GET /api/recruitment/applications/export` or extend existing export route with `type=recruitment-applications`.
- [x] Export should respect current filters: `q`, `status`, `jdId`, `minScore`, `maxScore`, `cvStatus`, `createdFrom`, `createdTo`.
- [ ] CSV columns: Candidate Name, Email, JD Title, Department, Pipeline Status, AI Score, Final Score, CV Status, Created At.
- [x] Permission: HR, interviewer, admin/super_admin consistent with applications list access.
- [x] Use existing `generateCsv` helper from `src/lib/export/csv-export.ts`.

### Acceptance Criteria
- Export downloads `.csv`.
- Exported rows match active filters.
- No admin-only limitation unless explicitly intended.
- Handles empty export with header-only CSV.

## Phase 7 — Validation

### Tasks
- [x] Run `npx.cmd tsc --noEmit --pretty false`.
- [ ] If lint config is still broken, note existing ESLint config issue instead of fixing unrelated config.
- [ ] Manual UI checks:
  - HR sees Upload CV and schedule workflow.
  - Admin sees all actions.
  - Search/status filter still fetches data.
  - Row detail navigation works.
  - Schedule button works for `SHORTLISTED` rows.
  - Bulk reject bar appears after selecting rows.

## Implementation Notes

- Keep changes focused mostly in `src/app/dashboard/recruitment/recruitment-client.tsx`.
- Avoid new dependencies.
- Do not touch API unless needed.
- Do not build fake controls with no behavior unless disabled and labeled.
- Use Vietnamese labels where existing page already uses Vietnamese.
- Use existing colors and UI language from dashboard/recruitment pages.
- Fix mojibake only if touching nearby strings; avoid broad encoding rewrite.

## Risks

| Risk | Mitigation |
|------|------------|
| Over-designing again | Compact operations layout, no giant hero/cards |
| Fake filters confuse users | Only implement working filters or disabled placeholders |
| DataTable limits action layout | Keep minimal, only wrap/polish first |
| Preview drawer scope creep | Phase 2 only |
| Role permission regression | Preserve existing conditionals |

## Success Metrics

- HR can identify next actionable candidate in under 5 seconds.
- HR can schedule interview from list in 1 click for shortlisted candidate.
- Header + toolbar consume less vertical space than current dashboard-like redesign.
- Table remains the clear primary content.
- Typecheck passes.

## Suggested Execution Order

1. Header/action refactor, including existing schedule link.
2. API filter expansion for CV status and date range.
3. Toolbar/status/JD/score/CV/date filters wired to API.
4. Recruitment CSV export endpoint and button.
5. Table visual/action polish.
6. Kanban card polish.
7. Validate.
8. Ask user whether to add preview drawer.

## Cook Command

```bash
/ck:cook plans/260425-0640-recruitment-operations-workspace
```

## Unresolved Questions

- Preview drawer deferred until after visual approval.


