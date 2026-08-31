---
type: qa-checklist
phase: 6
date: 2026-05-01
status: pending-manual-execution
---

# QA Checklist — Sidebar Nav Redesign

Manual verification required before merging phase branches into `dev`. Automated checks (TypeScript) already passed.

## Pre-test setup

1. Apply migration: `supabase db push` (or run `supabase/migrations/20260501000000_ui_layout_setting.sql` manually).
2. Verify `system_settings.ui_layout` row exists with default `"topnav"`.
3. Start dev server: `npm run dev`.

## QA matrix (5 roles × 2 layouts = 10 paths)

For each row: log in as the role, set `ui_layout` to the target value (toggle in Settings if super_admin, or SQL update otherwise), reload, then verify nav items match expected.

| # | Role | Layout | Expected sections / links | Pass |
|---|------|--------|---------------------------|------|
| 1 | super_admin | topnav | People & Roles + Recruitment + Interviews + System dropdowns | [ ] |
| 2 | super_admin | sidebar | All 4 sections expanded with section headers + indigo active bar | [ ] |
| 3 | admin | topnav | Same 4 dropdowns as super_admin | [ ] |
| 4 | admin | sidebar | All 4 sections | [ ] |
| 5 | recruiter | topnav | People & Roles dropdown + Versions standalone link | [ ] |
| 6 | recruiter | sidebar | People & Roles section + Versions standalone | [ ] |
| 7 | hr | topnav | Recruitment dropdown + Versions standalone | [ ] |
| 8 | hr | sidebar | Recruitment section + Versions standalone | [ ] |
| 9 | interviewer | topnav | Recruitment dropdown + Interviews link + Versions standalone | [ ] |
| 10 | interviewer | sidebar | Recruitment + Interviews + Versions standalone | [ ] |

For EACH row also verify:
- Click each link → correct page loads
- Active state highlights correct link
- No console errors
- No broken icons / missing components

## Mobile smoke (8 cases)

Use DevTools responsive viewport.

| Viewport | Test | Pass |
|----------|------|------|
| 375px | Sidebar layout: hamburger visible, drawer opens | [ ] |
| 375px | Drawer closes on link click | [ ] |
| 375px | Drawer closes on backdrop click | [ ] |
| 375px | Drawer closes on ESC | [ ] |
| 375px | Topnav layout: existing mobile chrome unchanged | [ ] |
| 768px | Boundary: sidebar visible, mobile drawer not triggered | [ ] |
| 1024px | Sidebar expanded by default for new users (no cookie) | [ ] |
| 1440px | Layout balanced, no horizontal scroll | [ ] |

## Live update verification

1. Open 2 browser windows: A logged in as super_admin, B logged in as hr.
2. Window A: Settings → Appearance → click target layout → confirm.
3. Window B: should show toast "Navigation layout updated by admin. Refreshing in 2s..." within ~2s.
4. Window B: page refreshes, new layout active, hr-specific items still visible.

Repeat 3 times alternating direction.

| Test | Pass |
|------|------|
| Toast appears in window B | [ ] |
| router.refresh fires after 2s | [ ] |
| Window B shows new layout | [ ] |
| hr nav items still correct in new layout | [ ] |
| Self-toast in window A confirms write | [ ] |

## Audit fixes verified

- [ ] `pt-20` replaced with `pt-[var(--page-top)]` in 8 files (recruitment + interviews)
- [ ] `PageContainer` uses `pt-6` in sidebar mode (verified for settings, dashboard, etc.)
- [ ] No double padding on any page in sidebar mode

## Sidebar UX

- [ ] Collapse toggle (chevron) works
- [ ] Width transitions smoothly (200ms)
- [ ] Cookie `sidebar_collapsed` persists across reload
- [ ] Section header colors visible: indigo (People & Roles, Recruitment) / amber (Interviews) / purple (System)
- [ ] Active link: bg-fill + 3px left bar
- [ ] User dropdown bottom — full card expanded; avatar-only collapsed; opens UPWARD when expanded
- [ ] Tooltips (title attr) on hover when collapsed

## Rollback

After all tests pass and merged:

```sql
-- Revert globally if needed (no deploy):
UPDATE system_settings SET value = '"topnav"'::jsonb WHERE key = 'ui_layout';
```

Realtime broadcast triggers refresh on all clients within 2s.

## Known limitations / out of scope

- Search input in content-header is visual only (not functional) — same as topnav
- ESLint config has pre-existing circular-JSON bug; doesn't block build
- Color theming (light mode etc.) NOT implemented — only layout switch

## Unresolved questions

- None blocking. After QA passes, evaluate whether to schedule a follow-up cleanup PR (~2 weeks) to delete top-nav code once sidebar is confirmed stable.
