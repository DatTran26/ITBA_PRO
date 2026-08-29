---
phase: 2
title: App sidebar build (desktop + mobile drawer)
status: pending
effort: 1.5 days
branch: feat/sidebar-nav-redesign/phase-02-sidebar
depends_on: [phase-01]
---

# Phase 2 — App Sidebar Build

## Context Links
- Plan: [plan.md](plan.md)
- Brainstorm: [../reports/brainstorm-260501-1627-sidebar-nav-redesign.md](../reports/brainstorm-260501-1627-sidebar-nav-redesign.md) (decisions #3, #4, #8, #10, #15, #16, #17)

## Overview

**Priority:** P0
**Status:** pending
**Description:** Build `app-sidebar.tsx` component — desktop expanded 260px / collapsed 64px (toggle), mobile drawer overlay via shadcn `Sheet`. Sections rendered from `nav-config.ts`. Hybrid active state (unified indigo + per-group section header accents). User dropdown bottom (full card horizontal). Cookie-persisted collapse state.

## Key Insights

- shadcn already in project (`components.json` exists) — `Sheet` component available for mobile drawer
- Existing `<NavbarUserDropdown>` needs `variant` prop to support sidebar-bottom orientation; menu content stays shared
- Cookie-based persistence (not localStorage) so server can read on initial render → no flash

## Requirements

**Functional:**
- Desktop ≥768px: fixed left sidebar, 260px expanded ⇄ 64px collapsed via toggle button
- Mobile <768px: hidden by default, hamburger button (rendered by content-header in Phase 3) opens shadcn `Sheet` drawer from left, closes on route change + ESC + backdrop click
- Sections render with always-expanded headers (no collapsible groups per decision #8)
- Active link: `bg-[#7C8FFF]/15 text-[#7C8FFF]` + 3px left bar
- Section header label: per-group accent color, `text-[10px] uppercase tracking-wider` at ~70% opacity
- User dropdown bottom: full card horizontal expanded; avatar centered when collapsed; popout opens UPWARD
- Collapse state persisted via cookie `sidebar_collapsed` (`"1"` | `"0"`)

**Non-functional:**
- No layout flash on first render (cookie read server-side, passed to client)
- Glass-card aesthetic preserved; backdrop mesh-gradient unchanged
- Reduce-motion respected (`prefers-reduced-motion`)
- Tooltip on hover when collapsed (shadcn `Tooltip` or simple title attr)

## Architecture

### File: `src/components/ui/app-sidebar.tsx` (NEW)

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { AppLogo } from "./app-navbar";  // reuse existing logo
import NavbarUserDropdown from "./navbar-user-dropdown";
import {
  visibleGroupsFor,
  shouldShowVersionsStandalone,
  type UserRole,
  type NavGroup,
  type NavLink as NavLinkType,
} from "./nav-config";

interface AppSidebarProps {
  user: { name: string; email: string; role: UserRole } | null;
  initialCollapsed: boolean;  // from cookie, server-passed
  onMobileClose?: () => void;  // for Sheet integration
  isMobile?: boolean;
}

export default function AppSidebar({ user, initialCollapsed, onMobileClose, isMobile = false }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(initialCollapsed && !isMobile);
  const pathname = usePathname();
  const groups = visibleGroupsFor(user?.role);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `sidebar_collapsed=${next ? '1' : '0'}; path=/; max-age=31536000; SameSite=Lax`;
  }

  const widthClass = collapsed ? 'w-16' : 'w-[260px]';

  return (
    <aside
      className={`fixed left-0 top-0 h-screen ${widthClass} z-40 glass-card-sidebar
                  flex flex-col transition-[width] duration-200 ease-out`}
    >
      {/* Logo */}
      <div className="h-14 flex items-center px-3 shrink-0 border-b border-[#8B99B0]/10">
        <AppLogo size={collapsed ? 'sm' : 'md'} />
      </div>

      {/* Nav scroll area */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-4">
        {groups.map(group => (
          <NavSection
            key={group.id}
            group={group}
            collapsed={collapsed}
            pathname={pathname}
            onLinkClick={onMobileClose}
          />
        ))}
        {shouldShowVersionsStandalone(user?.role) && (
          <NavStandaloneVersionsLink collapsed={collapsed} pathname={pathname} onClick={onMobileClose} />
        )}
      </nav>

      {/* Collapse toggle (desktop only) */}
      {!isMobile && (
        <button
          onClick={toggleCollapsed}
          className="mx-3 mb-2 h-8 rounded-lg border border-[#8B99B0]/10 text-[#8B99B0]
                     hover:text-[#ECF0F7] hover:bg-[#1E2840] flex items-center justify-center
                     transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      )}

      {/* User dropdown bottom */}
      <div className="border-t border-[#8B99B0]/10 p-2">
        <NavbarUserDropdown user={user} variant={collapsed ? 'sidebar-collapsed' : 'sidebar-expanded'} />
      </div>
    </aside>
  );
}

// Sub-components NavSection / NavLinkRow / NavStandaloneVersionsLink defined in same file
// (kept colocated for KISS, total file ~250 LOC).
```

### Modify: `src/components/ui/navbar-user-dropdown.tsx`

Add `variant` prop:
- `variant?: 'topnav' | 'sidebar-expanded' | 'sidebar-collapsed'` (default `'topnav'`)
- `'topnav'`: existing behavior
- `'sidebar-expanded'`: full-width row, avatar+name+role+caret horizontal, opens dropdown UPWARD (`side="top"` `align="start"`)
- `'sidebar-collapsed'`: only avatar centered, opens dropdown to RIGHT (`side="right"` `align="end"`)

Dropdown content (menu items) stays identical across variants.

### File: `src/components/ui/sidebar-collapse-cookie.ts` (NEW)

```ts
import { cookies } from 'next/headers';

const COOKIE_NAME = 'sidebar_collapsed';

export async function readSidebarCollapsed(): Promise<boolean> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value === '1';
}
```

### Mobile drawer integration

`<AppSidebar isMobile />` rendered inside shadcn `<Sheet><SheetContent side="left">…`. Trigger lives in content-header (Phase 3). Sheet auto-closes via `onLinkClick` callback fired on every nav link click (passes `onMobileClose` down).

### Glass-card sidebar variant

Add to `src/app/globals.css` or wherever `glass-card` is defined:

```css
.glass-card-sidebar {
  background: rgba(16, 24, 40, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-right: 1px solid rgba(139, 153, 176, 0.1);
}
```

## Related Code Files

**Modify:**
- `src/components/ui/navbar-user-dropdown.tsx` (add variant prop)
- `src/app/globals.css` (add `.glass-card-sidebar` class)

**Create:**
- `src/components/ui/app-sidebar.tsx`
- `src/components/ui/sidebar-collapse-cookie.ts`

**Verify available:**
- shadcn `Sheet` — run `npx shadcn@latest add sheet` if missing
- shadcn `Tooltip` — run `npx shadcn@latest add tooltip` if missing

## Implementation Steps

1. Create branch from phase-01: `git checkout -b feat/sidebar-nav-redesign/phase-02-sidebar`
2. Verify shadcn `Sheet` + `Tooltip` installed; install if missing
3. Add `.glass-card-sidebar` CSS class
4. Create `sidebar-collapse-cookie.ts` helper
5. Add `variant` prop to `navbar-user-dropdown.tsx`; implement 3 trigger renderings; menu content shared
6. Create `app-sidebar.tsx` with subcomponents NavSection + NavLinkRow + NavStandaloneVersionsLink
7. Implement collapse toggle + cookie write
8. Implement tooltip on collapsed icons (use `title` attr OR shadcn Tooltip)
9. Test mobile drawer: Sheet open/close, route change auto-close, ESC, backdrop
10. `npm run build` passes
11. Manual visual smoke (no integration yet — sidebar mounted ad-hoc on a test route OR via temp `dashboard/layout.tsx` toggle)

## Todo List

- [ ] Create branch from phase-01
- [ ] Verify/install shadcn Sheet + Tooltip
- [ ] Add `.glass-card-sidebar` CSS
- [ ] Create `sidebar-collapse-cookie.ts`
- [ ] Add variant prop to navbar-user-dropdown
- [ ] Implement sidebar-expanded trigger
- [ ] Implement sidebar-collapsed trigger (avatar-only, opens right)
- [ ] Create `app-sidebar.tsx` skeleton
- [ ] Render NAV_GROUPS sections with always-expanded headers
- [ ] Per-group section header accent color
- [ ] Active state: bg fill + 3px left bar (unified indigo)
- [ ] Hover state styling
- [ ] Standalone Versions link for hr/interviewer/recruiter
- [ ] Collapse toggle + cookie persistence
- [ ] Tooltip on hover when collapsed
- [ ] Mobile drawer wrapper (Sheet with isMobile prop)
- [ ] Auto-close on route change (pass onMobileClose to NavLinkRow onClick)
- [ ] Compile passes
- [ ] Visual smoke desktop (mock-mounted)
- [ ] Visual smoke mobile drawer
- [ ] Commit + push

## Success Criteria

- Sidebar renders correctly for all 5 roles (visible groups match)
- Collapse toggle works, state persists across reload (cookie verified in DevTools)
- Mobile drawer: hamburger triggers Sheet, ESC closes, route change closes, backdrop closes
- Active link clearly visible (indigo bar + bg fill)
- Section headers show correct accent color (indigo / amber / purple)
- No console errors, no TS errors, build green
- File sizes: `app-sidebar.tsx` ≤ 250 LOC (project rule: <200 preferred; allow slight overage if subcomponents inline keeps it KISS)

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Layout flash on first paint (cookie not read) | M | M | Cookie read server-side via `sidebar-collapse-cookie.ts`, passed as prop |
| Sheet doesn't auto-close on route change | M | M | Pass `onMobileClose` callback to NavLinkRow; trigger on click |
| `app-sidebar.tsx` exceeds 200 LOC project rule | M | L | Extract NavSection + NavLinkRow into separate files if exceeds; prefer colocated until that point |
| Glass-card var styling clashes with backdrop mesh gradient | L | L | Visual review; adjust opacity if needed |
| User dropdown popout off-screen at viewport bottom | L | M | Use `side="top"` Radix auto-flip handles edge |

## Security Considerations

- Cookie `sidebar_collapsed` is non-sensitive UI preference; `SameSite=Lax`, no `httpOnly` (client must write), no `Secure` flag in dev (add in prod via existing config)
- No new auth surface

## Next Steps

Phase 3 — content-area header (search + bell + help strip + mobile hamburger trigger).
