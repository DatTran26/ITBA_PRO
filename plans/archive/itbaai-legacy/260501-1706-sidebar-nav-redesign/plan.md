---
slug: sidebar-nav-redesign
created: 2026-05-01
status: code-complete-pending-qa
estimated_effort: 4-5 senior dev-days
brainstorm: ../reports/brainstorm-260501-1627-sidebar-nav-redesign.md
base_branch: dev
---

# Plan — Sidebar Navigation Redesign w/ Global Layout Switcher

## Goal

Port current top-nav to vertical left sidebar (logo top / nav stack / user bottom). Expose layout choice as global Super_Admin setting via existing `system_settings` table. Live update via Supabase Realtime. Long-term: sidebar replaces top-nav after staged rollout.

## Source of truth for decisions

All 17 locked decisions in `../reports/brainstorm-260501-1627-sidebar-nav-redesign.md`. Phases below reference brainstorm by decision number where relevant.

## Phases

| # | Phase | Effort | Status | Branch |
|---|-------|--------|--------|--------|
| 1 | [Nav config extraction + label rename](phase-01-nav-config-extraction.md) | 0.5d | ✅ completed | `feat/sidebar-nav-redesign/phase-01-nav-config` |
| 2 | [App sidebar build (desktop + mobile drawer)](phase-02-app-sidebar-build.md) | 1.5d | ✅ completed | `feat/sidebar-nav-redesign/phase-02-sidebar` |
| 3 | [Content-area header (search/bell/help strip)](phase-03-content-area-header.md) | 0.5d | ✅ completed | `feat/sidebar-nav-redesign/phase-03-content-header` |
| 4 | [ui_layout setting + Settings UI + Realtime](phase-04-ui-layout-setting.md) | 1d | ✅ completed | `feat/sidebar-nav-redesign/phase-04-layout-setting` |
| 5 | [NavShell integration + collapse persistence](phase-05-nav-shell-integration.md) | 0.5d | ✅ completed | `feat/sidebar-nav-redesign/phase-05-nav-shell` |
| 6 | [QA matrix + rollout](phase-06-qa-and-rollout.md) | 1d | 🟡 code-done-pending-manual-qa | `feat/sidebar-nav-redesign/phase-06-qa` |

## Dependencies (must execute sequentially)

```
Phase 1 (nav-config)
   └─→ Phase 2 (sidebar consumes nav-config)
        └─→ Phase 3 (content-header)
             └─→ Phase 4 (Settings UI + Realtime)
                  └─→ Phase 5 (NavShell integration ties everything)
                       └─→ Phase 6 (QA + rollout)
```

Phase 2 and 3 could run parallel after Phase 1 in theory, but Phase 3 references components in Phase 2 — keep sequential for KISS.

## Branch strategy

- Each phase = own branch from previous phase branch (carry forward)
- `feat/sidebar-nav-redesign/phase-01-nav-config` from `dev`
- `feat/sidebar-nav-redesign/phase-02-sidebar` from `phase-01`
- ... etc
- After all phases complete: confirm with user → merge sequentially into `dev`

## Risk summary

See brainstorm Risk Assessment table. Top-3:
1. Nav config drift during dual-existence — mitigated by Phase 1 extraction FIRST
2. Super_admin RLS policy on `system_settings` currently `role='admin'` only — verify in Phase 4
3. Role regression during refactor — mitigated by Phase 6 5×2 smoke matrix

## Success criteria

- All 5 roles see correct nav items in BOTH layouts
- Super_admin toggle changes layout for all online users within ~2s (live update)
- Sidebar collapse state persists across reloads (cookie)
- Mobile drawer opens/closes cleanly, auto-closes on route change
- Build passes, no TS errors, no console errors
- Single source-of-truth: nav-config.ts owns links + role gating

## Rollback path

`UPDATE system_settings SET value='"topnav"' WHERE key='ui_layout';` — instant revert via SQL, no deploy needed.

## Out of scope

- Color-theme switching (separate epic if requested)
- Cmd+K command palette (rejected as YAGNI in brainstorm)
- Per-user layout preference (locked: global only)
- Bottom tab bar mobile (rejected)
