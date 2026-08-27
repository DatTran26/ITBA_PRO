---
phase: 6
title: QA matrix + rollout + docs
status: pending
effort: 1 day
branch: feat/sidebar-nav-redesign/phase-06-qa
depends_on: [phase-05]
---

# Phase 6 — QA + Rollout

## Context Links
- Plan: [plan.md](plan.md)
- Brainstorm: [../reports/brainstorm-260501-1627-sidebar-nav-redesign.md](../reports/brainstorm-260501-1627-sidebar-nav-redesign.md)

## Overview

**Priority:** P0 (gates merge)
**Status:** pending
**Description:** Comprehensive QA across 5 roles × 2 layouts (10 paths), mobile smoke, live update verification, fix any audit issues from Phase 5 (e.g., per-page `pt-20`), update CHANGELOG + docs, prepare rollout plan.

## Requirements

**Functional verification:**
- All 5 roles see correct nav items in BOTH layouts
- All renamed labels visible (People & Roles, System)
- Live update works end-to-end across multiple sessions
- Sidebar collapse state persists across reloads
- Mobile drawer behavior correct

**Non-functional:**
- No console errors in any role × layout combo
- Build green
- TS strict passes
- No accessibility regression (focus order, ARIA labels, keyboard nav)

## QA Matrix (5 roles × 2 layouts = 10 paths)

| # | Role | Layout | Nav items expected | Tested |
|---|------|--------|---------------------|--------|
| 1 | super_admin | topnav | People & Roles + Recruitment + Interviews + System + Versions standalone (no — already in System) | [ ] |
| 2 | super_admin | sidebar | All 4 sections expanded, all links visible | [ ] |
| 3 | admin | topnav | People & Roles + Recruitment + Interviews + System | [ ] |
| 4 | admin | sidebar | Same 4 sections | [ ] |
| 5 | recruiter | topnav | People & Roles + Versions standalone | [ ] |
| 6 | recruiter | sidebar | People & Roles + Versions standalone | [ ] |
| 7 | hr | topnav | Recruitment + Versions standalone | [ ] |
| 8 | hr | sidebar | Recruitment + Versions standalone | [ ] |
| 9 | interviewer | topnav | Recruitment + Interviews + Versions standalone | [ ] |
| 10 | interviewer | sidebar | Recruitment + Interviews + Versions standalone | [ ] |

For EACH row, verify:
- Correct sections rendered
- Active state highlights correct link when navigating
- Click each link → correct page loads
- No console errors
- No broken images / missing icons

## Live update verification

1. Open 2 browser windows logged in as different roles (super_admin in window A, hr in window B)
2. Window A: Settings → flip layout → confirm
3. Window B: should show toast "Navigation layout updated..." within 2s
4. Window B: page refreshes within 2s after toast
5. Window B: new layout active, hr-specific nav items still visible in new layout

Repeat for: super_admin → super_admin (self), super_admin → admin, super_admin → recruiter.

## Mobile smoke

| Viewport | Test | Status |
|----------|------|--------|
| 375px | Sidebar layout: hamburger visible, drawer opens | [ ] |
| 375px | Drawer closes on link click | [ ] |
| 375px | Drawer closes on backdrop click | [ ] |
| 375px | Drawer closes on ESC | [ ] |
| 375px | Topnav layout: existing mobile behavior unchanged | [ ] |
| 768px | Boundary: sidebar visible, mobile drawer hidden | [ ] |
| 1024px | Sidebar expanded by default for new users (cookie absent) | [ ] |
| 1440px | Layout looks balanced, no horizontal scroll | [ ] |

## Audit fix list (from Phase 5)

Address any `pt-20` / hardcoded top-offset issues found during Phase 5 audit. Likely fixes:
- Replace fixed page-level `pt-20` with `pt-0` and let NavShell handle main padding
- OR: keep page-level padding for topnav, conditionally remove for sidebar via NavShell `<main className="...">` wrapper

## Documentation updates

- `CHANGELOG.md`: add entry under Unreleased
  ```markdown
  ### Added
  - Sidebar navigation layout option (super_admin can toggle globally via Settings)
  - Real-time layout updates across all sessions

  ### Changed
  - Renamed nav sections: "Management" → "People & Roles", "Admin" → "System"
  - Centralized nav config in `src/components/ui/nav-config.ts`
  ```
- `docs/system-architecture.md`: add subsection under "UI Architecture" describing NavShell + nav-config + ui_layout setting
- Verify nothing in `docs/` references old "Management"/"Admin" labels (search & update if found)

## Implementation Steps

1. Create branch from phase-05: `git checkout -b feat/sidebar-nav-redesign/phase-06-qa`
2. Run full QA matrix (10 paths) — log results in this file's checklist
3. Run mobile smoke
4. Run live update verification
5. Address audit issues from Phase 5 (pt-20 etc.)
6. Update CHANGELOG.md
7. Update docs/system-architecture.md
8. Search docs for old labels, replace
9. Final `npm run build` — must pass
10. Final `npm run lint` — must pass (or document acceptable warnings)
11. Commit + push

## Todo List

- [ ] Create branch from phase-05
- [ ] Run QA matrix all 10 rows
- [ ] Run mobile smoke 8 cases
- [ ] Run live update 2-window test
- [ ] Audit fix: pt-20 / page-level top offsets (if needed)
- [ ] Update CHANGELOG.md
- [ ] Update docs/system-architecture.md
- [ ] Update any docs referencing old "Management" / "Admin" labels
- [ ] Final build green
- [ ] Final lint pass (or document warnings)
- [ ] Commit + push

## Post-merge rollout (after all phase branches merged to dev)

1. Default value `ui_layout='topnav'` — zero impact for existing users
2. Internal QA round on staging — super_admin flips to sidebar, validates 1 day
3. After validation, super_admin flips production to sidebar
4. Monitor for issues 1 week
5. **Deprecation milestone (separate plan):** when stable, delete `app-navbar.tsx` + `topnav` branch in NavShell, remove `ui_layout` setting (or repurpose)

## Rollback procedure

Instant rollback (no deploy):
```sql
UPDATE system_settings SET value = '"topnav"'::jsonb WHERE key = 'ui_layout';
```
Realtime broadcast triggers refresh on all clients within 2s.

If sidebar code itself is broken (not just layout choice):
- Revert phase-XX branch merges in reverse order
- OR: feature-flag the entire NavShell to fallback to topnav unconditionally

## Success Criteria

- All 10 QA matrix rows: pass
- All 8 mobile smoke cases: pass
- Live update verified across 2 sessions
- CHANGELOG + docs updated
- Build + lint green
- All phase branches merged into dev (with user approval)

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| QA finds critical regression in 1 role | M | H | Defer merge until fixed; phase branches stay isolated |
| Audit reveals many hardcoded top-offsets across 20+ pages | M | M | Centralize fix in NavShell main wrapper; bulk find-replace if simple |
| Production user encounters layout flip mid-form-submission | L | M | Rollback path documented; toast gives 2s warning; user can ctrl+z form data |
| Old labels referenced in non-doc files (e.g., test fixtures, admin scripts) | L | L | Grep before commit |

## Security Considerations

- Final RLS verification: super_admin + admin only can write `ui_layout`
- No PII exposure in nav-config or ui_layout

## Next Steps (post-plan)

After all 6 phases merged:
1. Schedule background agent in 2 weeks to evaluate sidebar adoption + propose top-nav code removal PR (deprecation milestone)
2. Tag release with version bump (per `versioning-standard.md`)
