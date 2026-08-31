---
type: brainstorm
date: 2026-05-01
slug: sidebar-nav-redesign
status: ready-for-plan
---

# Brainstorm — Sidebar Nav Redesign w/ Layout Switcher

## Executive Summary

Port current top-nav to a vertical left sidebar (logo top / nav stack / user bottom) while keeping existing dark-glass aesthetic. Expose layout choice as global Super_Admin setting via existing `system_settings` table — zero schema migration. Long-term plan: sidebar replaces top-nav after staged rollout. Estimated **4 senior dev-days** including refactor, mobile drawer, and 5-role QA. Critical risk: dual-rendering during transition causes drift unless we extract a single nav-config source-of-truth FIRST.

## Decisions Locked (from discovery)

| # | Decision | Choice |
|---|----------|--------|
| 1 | Theme scope | Global app-wide (Super_Admin sets for everyone) |
| 2 | Long-term intent | Sidebar replaces top-nav over time (dual is transitional) |
| 3 | Desktop UX | Expanded 260px ⇄ collapsible 64px icon-only, persisted |
| 4 | Mobile UX | Drawer overlay triggered by hamburger |
| 5 | DB key (system_settings) | `ui_layout` — value `"topnav"` or `"sidebar"` |
| 6 | UI label (Super_Admin Settings) | **"Navigation Layout"** |
| 7 | File naming | `app-sidebar.tsx` (new) + `app-navbar.tsx` (existing, refactor only) |
| 8 | Group structure (expanded) | Section headers + always expanded (no collapse interaction) |
| 9 | Section labels | **People & Roles** / **Recruitment** / **Interviews** / **System** (renamed from Management/Admin for clarity) |
| 10 | Collapsed mode (64px) | Icons stacked + thin 1px divider between groups, hover tooltip shows label |
| 11 | Search + bell + help placement | **Thin content-area header (~48px)** above main content. Sidebar = nav only. Pattern: Linear/Vercel/Notion. Independent of sidebar collapse state. |
| 12 | Live update transport | **Supabase Realtime postgres_changes** subscribe to `system_settings` filter `key=ui_layout`. Existing infra, zero new deps. |
| 13 | Live update UX | **Toast** "Admin updated layout. Refreshing in 2s..." → `router.refresh()` after 2000ms. Buffer prevents jarring mid-action snap. |
| 14 | Super_admin toggle confirm | **Confirm dialog** "This will change navigation for ALL users immediately. Continue?" before applying. Protects blast radius from accidental click. |
| 15 | User dropdown trigger (sidebar bottom) | **Full card horizontal** — avatar 32px + green online dot + name + role uppercase + caret. Whole row clickable, opens dropdown UPWARD. Collapsed mode: avatar only, centered. Dropdown content unchanged (My Profile / Manage Users for admin / Logout). |
| 16 | Active state color scheme | **Hybrid** — unified indigo `#7C8FFF` for ALL active links; per-group section header label keeps subtle accent color for category encoding. |
| 17 | Active state decoration | **Background fill + left vertical bar 3px** — `bg-[#7C8FFF]/15` + 3px solid indigo bar on left edge of item. Double-encoded (color + position). |

### Section header color tokens (subtle accent on label only)

| Section | Label color | Rationale |
|---------|-------------|-----------|
| People & Roles | `#7C8FFF` (indigo) | Match current Management accent |
| Recruitment | `#7C8FFF` (indigo) | Match current Recruitment accent |
| Interviews | `#F59E0B` (amber) | Match current Interviews accent |
| System | `#B48EFF` (purple) | Match current Admin accent |

> Section labels render as `text-[10px] uppercase tracking-wider font-medium` in their accent color at ~70% opacity. Active link items always use indigo regardless of which section they belong to.

### Active item CSS spec

```tsx
// Active variant
className="relative flex items-center gap-2.5 px-3 py-2 rounded-lg
           bg-[#7C8FFF]/15 text-[#7C8FFF] font-medium
           before:absolute before:left-0 before:top-1.5 before:bottom-1.5
           before:w-[3px] before:rounded-r-full before:bg-[#7C8FFF]"

// Default variant
className="flex items-center gap-2.5 px-3 py-2 rounded-lg
           text-[#8B99B0] hover:text-[#B6C2FF] hover:bg-[#1A2236]
           transition-colors"
```

## Final decision count: **17**

### User dropdown spec details

- Trigger row height: 56px expanded; 56px collapsed (avatar centered, no text)
- Hover state: subtle `bg-[#1E2840]/60` (matches existing trigger)
- Dropdown popout: `align="start"` `side="top"` `sideOffset={8}` — opens upward to avoid going off-screen at viewport bottom
- Reuse existing `<NavbarUserDropdown>` component with prop `variant: "topnav" | "sidebar-bottom"` controlling trigger orientation. Dropdown content (menu items) shared.
- Online indicator green dot positioned `-bottom-0.5 -right-0.5` on avatar (existing pattern preserved)

### Live update flow

```
1. super_admin clicks toggle in Settings → confirm dialog
2. Confirm → PATCH/UPSERT system_settings.ui_layout via Supabase client
3. Postgres UPDATE → Supabase Realtime emits postgres_changes event
4. ALL connected clients (subscribed in dashboard layout client wrapper):
   - Receive event payload { new: { value: 'sidebar' } }
   - Show toast (sonner or existing toast component)
   - setTimeout(() => router.refresh(), 2000)
   - router.refresh() invalidates RSC cache → server re-renders
     dashboard/layout.tsx with new ui_layout → <NavShell> swaps component
5. User sees new layout without manual reload
```

### Realtime subscription scope

- Subscribed once in client wrapper inside `dashboard/layout.tsx` (server component fetches initial value, passes to client provider that owns subscription)
- Channel: `system_settings:ui_layout`
- Cleanup on unmount (logout, navigation away from /dashboard)
- RLS: existing `settings_select_all` policy already permits read for all authenticated users → no policy changes needed

### Edge cases handled

- **Toggle to same value** (idempotent) — postgres UPDATE still fires; toast suppressed if `new.value === current.value`
- **Network disconnect** — websocket auto-reconnects via Supabase client; on reconnect, refetch current setting via server component on next nav
- **Super_admin self-update** — they triggered it, also receive event; toast can be suppressed for the actor (compare `auth.uid()` against last writer; OR simpler: toast for everyone including writer — confirms write succeeded)

### New component: `app-content-header.tsx`

- Height: 48px, sits above main content (right of sidebar, not full-width)
- Layout: `[breadcrumbs/page title]  [search center, max-w-md]  [help] [notification-bell]`
- Reuse existing `<NotificationBell>` component as-is
- Mobile (`<768px`): hamburger (left, opens sidebar drawer) + page title + bell (right); search collapses to icon → opens modal
- ONLY renders when `ui_layout === 'sidebar'`. Top-nav layout keeps current `app-navbar.tsx` unchanged.

### Updated file list

```
src/components/ui/
├── nav-config.ts            NEW
├── nav-shell.tsx            NEW (chooses topnav vs sidebar+contentHeader)
├── app-navbar.tsx           REFACTOR (consume nav-config)
├── app-sidebar.tsx          NEW
├── app-content-header.tsx   NEW (sidebar layout's top utility strip)
└── sidebar-collapse-cookie.ts  NEW
```

### Section label mapping (rename ripple — applies to BOTH top-nav and sidebar via shared nav-config)

| Old (current top-nav) | New (shared nav-config) |
|----------------------|--------------------------|
| Management | **People & Roles** |
| Recruitment | Recruitment (unchanged) |
| Interviews | Interviews (unchanged) |
| Admin | **System** |

## Risk Assessment

| Risk | L | I | Mitigation |
|------|---|---|------------|
| Nav config drift during dual-existence (links added to one but not other) | H | H | **Extract `nav-config.ts` BEFORE building sidebar** — single source for links + role gating; both renderers consume it |
| Super_Admin global toggle = blast radius for all users | M | H | Default to `topnav` initially; document DB-level rollback (`UPDATE system_settings SET value='"topnav"' WHERE key='ui_layout'`); feature-flag rollout |
| SSR/CSR layout flash (FOUC) when reading client-side | M | M | Read setting in server component (`dashboard/layout.tsx`), pass as prop; persist collapse state via cookie (server-readable) not localStorage |
| Scope creep into real theming (color schemes) | M | M | Name it `ui_layout` NOT `theme` — strict naming discipline; reject color-theme requests as separate epic |
| Role-based dropdown logic regression during refactor | M | H | Manual smoke test matrix: 5 roles × 2 layouts = 10 test paths; checklist in QA phase |
| Mobile drawer accessibility (focus trap, ESC, backdrop) | L | M | Use shadcn `Sheet` (Radix Dialog underneath) — accessibility built-in; project already on shadcn (`components.json` present) |

## Strategic Options Compared

| Approach | Effort | Risk | Flexibility | Notes |
|----------|--------|------|-------------|-------|
| **A. Shared nav-config + dual renderers** *(Recommended)* | 4 days | Low | High | Honors DRY; clean deprecation path when top-nav removed |
| B. Copy-paste sidebar from top-nav, fix drift later | 2 days | High | Low | Ships faster but accumulates debt; every nav change requires double-edit |
| C. Build sidebar from scratch ignoring existing | 5 days | Medium | Medium | Cleaner sidebar code but duplicates RBAC logic; harder to keep in sync |

## Recommended Approach

### Architecture

```
src/
├── components/
│   └── ui/
│       ├── nav-config.ts            # NEW — single source: links + role gating
│       ├── nav-shell.tsx            # NEW — chooses topnav vs sidebar based on prop
│       ├── app-navbar.tsx           # REFACTOR — consume nav-config (no logic change)
│       ├── app-sidebar.tsx          # NEW — desktop sidebar (260/64) + mobile sheet
│       └── sidebar-collapse-cookie.ts  # NEW — read/write collapse state
├── app/
│   └── dashboard/
│       ├── layout.tsx               # MODIFY — fetch ui_layout, render <NavShell>
│       └── settings/
│           └── settings-client.tsx  # MODIFY — add layout switcher (super_admin only)
└── lib/
    └── settings.ts                  # NEW or extend — getUiLayout() helper
```

### Contract: `nav-config.ts`

```ts
type NavLink = { href: string; label: string; icon: LucideIcon };
type NavGroup = {
  id: 'management' | 'recruitment' | 'admin' | 'interviews' | 'versions';
  label: string;
  icon?: LucideIcon;
  links: NavLink[];
  allowedRoles: UserRole[];
  accentColor: string;  // existing per-group color (e.g. '#7C8FFF', '#B48EFF')
};

export const NAV_GROUPS: NavGroup[] = [...];
export function visibleGroupsFor(role: UserRole): NavGroup[];
```

### Storage Model (zero migration)

Reuse `system_settings`:

```sql
INSERT INTO system_settings (key, value, category, label, description, input_type, options)
VALUES (
  'ui_layout',
  '"topnav"'::jsonb,
  'appearance',
  'Navigation Layout',
  'Global layout for all users',
  'select',
  '["topnav", "sidebar"]'::jsonb
);
```

RLS already enforces `admin`-only write. Verify policy matches `super_admin` too (current policy says `role = 'admin'` — **may need policy update** to include super_admin).

### Visual Spec (preserve existing aesthetic)

- Surface: `glass-card` style (existing util) on sidebar container, fixed `left-0 top-0 h-screen w-[260px]` (or 64 collapsed)
- Backdrop: keep mesh-gradient decor in `dashboard/layout.tsx` unchanged
- Logo: existing `<AppLogo>` at top (collapsed → icon-only, hide text)
- Nav stack: groups rendered as collapsible sections, icons + labels, active state `bg-[#7C8FFF]/15 text-[#7C8FFF]` (matches current)
- User pinned bottom: reuse `<NavbarUserDropdown>` with vertical orientation
- Collapse toggle: chevron button bottom-of-logo or top-of-user-section, persist via `sidebar_collapsed` httpOnly=false cookie

### Mobile

- `<768px`: sidebar hidden, hamburger button in fixed top-left renders shadcn `Sheet` from left side, content identical to desktop expanded sidebar
- Auto-close on route change

## Operational Considerations

- **Rollout**: ship sidebar with `ui_layout='topnav'` default; super_admin toggles when ready; monitor for 1 week; flip default; deprecate top-nav next sprint
- **Rollback**: single SQL update on `system_settings` reverts entire app instantly — no deploy needed
- **Observability**: log layout setting in client error boundary context (helps reproduce reports)
- **Caching**: setting read once per request in server component — no extra DB round-trips per page

## Business Impact

- **Effort**: 4 senior dev-days (1 day refactor, 2 days build, 1 day QA)
- **Value**: modern UX consistent with peers (Linear, Vercel); more vertical real estate for content; better scalability when adding nav items (top bar already crowded)
- **Risk to user productivity**: low — gated behind super_admin toggle; can revert in seconds
- **Tech-debt direction**: paying down (1 nav source after extraction vs current scattered links)

## Decisions Needed (none blocking — flagged for awareness)

1. **`super_admin` write policy on `system_settings`** — current RLS allows only `role='admin'`. Need to extend to `super_admin` OR enforce at API layer only (current pattern already does API-level checks). Confirm during phase 1.
2. **Collapse default state** — expanded or collapsed by default for new users? Suggest **expanded** (discoverability > screen real estate for first-time users).
3. **Sidebar overlap with mesh-gradient backdrop** — backdrop is `fixed inset-0 z-0`, sidebar `z-10+`; should layer correctly but verify visually.

## Next Steps

User decision: proceed to `/plan` to break this into phase-by-phase implementation, or hold for further refinement.
