---
phase: 3
title: Content-area header (search/bell/help strip)
status: pending
effort: 0.5 day
branch: feat/sidebar-nav-redesign/phase-03-content-header
depends_on: [phase-02]
---

# Phase 3 — Content-Area Header

## Context Links
- Plan: [plan.md](plan.md)
- Brainstorm: [../reports/brainstorm-260501-1627-sidebar-nav-redesign.md](../reports/brainstorm-260501-1627-sidebar-nav-redesign.md) (decision #11)

## Overview

**Priority:** P1
**Status:** pending
**Description:** Build `app-content-header.tsx` — thin ~48px utility strip rendered above main content when sidebar layout is active. Holds breadcrumbs/page title (left) + search center + help icon + notification bell (right). Mobile: replace search center with hamburger button left + page title + bell right. ONLY rendered in sidebar layout (top-nav layout keeps existing chrome).

## Key Insights

- Existing `<NotificationBell userRole={...} />` reused as-is
- Search bar input style copied from existing top-nav (max-w-md, glass-card-light)
- Hamburger button on mobile triggers parent-level state to open Sheet drawer (state lives in NavShell — Phase 5)

## Requirements

**Functional:**
- Desktop ≥768px: layout `[breadcrumbs/page title slot]  [search center max-w-md]  [help] [bell]`
- Mobile <768px: `[hamburger] [page title] [bell]`
- Height fixed 48px, sits above main content (right of sidebar, NOT full-width)
- Reuses `<NotificationBell>` and search styling from existing `app-navbar.tsx`
- Page title/breadcrumbs slot: accept children prop OR derive from pathname (start with simple pathname-based fallback; pages can override later)

**Non-functional:**
- ARIA-compliant button labels for hamburger + help
- Focus styles preserved
- No layout shift on mount

## Architecture

### File: `src/components/ui/app-content-header.tsx` (NEW)

```tsx
"use client";

import { Menu, Search, HelpCircle } from "lucide-react";
import NotificationBell from "./notification-bell";

interface AppContentHeaderProps {
  userRole?: string | null;
  onMobileMenuClick: () => void;
  pageTitle?: string;  // optional override; fallback to derived
  breadcrumbs?: { label: string; href?: string }[];
}

export default function AppContentHeader({
  userRole,
  onMobileMenuClick,
  pageTitle,
  breadcrumbs,
}: AppContentHeaderProps) {
  return (
    <header className="h-12 border-b border-[#8B99B0]/10 px-4 flex items-center gap-3
                       bg-[#0C1220]/40 backdrop-blur-md">
      {/* Mobile hamburger */}
      <button
        onClick={onMobileMenuClick}
        className="md:hidden p-2 -ml-2 rounded-lg text-[#8B99B0] hover:text-[#ECF0F7]
                   hover:bg-[#1E2840] transition-colors"
        aria-label="Open navigation menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Breadcrumbs / page title */}
      <div className="flex items-center gap-2 text-sm text-[#8B99B0] min-w-0 flex-shrink">
        {breadcrumbs?.map((b, i) => (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && <span className="text-[#5A6882]">/</span>}
            {b.href ? <a href={b.href} className="hover:text-[#ECF0F7]">{b.label}</a>
                    : <span className="text-[#ECF0F7]">{b.label}</span>}
          </span>
        )) ?? (pageTitle && <span className="text-[#ECF0F7] truncate">{pageTitle}</span>)}
      </div>

      {/* Search center (desktop only) */}
      <div className="flex-1 hidden md:flex justify-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5A6882]" />
          <input
            type="text"
            placeholder="Search candidates, assessments, or insights..."
            className="w-full h-9 pl-9 pr-4 rounded-lg bg-[#0C1220]/60 border border-[#8B99B0]/10
                       text-sm text-[#ECF0F7] placeholder:text-[#5A6882]/70
                       focus:outline-none focus:border-[#7C8FFF]/40 focus:ring-1 focus:ring-[#7C8FFF]/20
                       transition-all"
          />
        </div>
      </div>

      {/* Mobile spacer when no search */}
      <div className="flex-1 md:hidden" />

      {/* Right: Help + Bell */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          className="p-2 rounded-lg text-[#8B99B0] hover:text-[#ECF0F7] hover:bg-[#1E2840]
                     transition-colors hidden sm:flex items-center justify-center"
          aria-label="Help & Support"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
        <NotificationBell userRole={userRole ?? undefined} />
      </div>
    </header>
  );
}
```

## Related Code Files

**Modify:** none in this phase
**Create:** `src/components/ui/app-content-header.tsx`

## Implementation Steps

1. Create branch from phase-02: `git checkout -b feat/sidebar-nav-redesign/phase-03-content-header`
2. Create `app-content-header.tsx`
3. Verify search input matches existing top-nav styling
4. Verify NotificationBell import path
5. `npm run build` passes
6. Visual smoke: render component standalone in test page or temporarily in dashboard/layout.tsx behind a feature flag

## Todo List

- [ ] Create branch from phase-02
- [ ] Create `app-content-header.tsx`
- [ ] Hamburger button (mobile only)
- [ ] Breadcrumbs/page title slot
- [ ] Search input (desktop only)
- [ ] Help icon
- [ ] Notification bell wired with userRole
- [ ] Mobile responsive layout verified
- [ ] Compile passes
- [ ] Commit + push

## Success Criteria

- Component renders all elements correctly desktop + mobile
- Hamburger only shows <768px
- Search hidden on mobile, visible on ≥768px
- NotificationBell shows badge count correctly (existing component behavior)
- 48px height, no overflow

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Hamburger callback not wired (no-op) | M | L | Phase 5 wires onMobileMenuClick to NavShell state; placeholder in this phase OK |
| Search functionality not implemented | H | L | Out of scope — input is visual only, matches current top-nav (also non-functional). Future epic. |
| Header overlaps sidebar at edge cases | L | M | Test viewport widths 768/1024/1440 in Phase 6 QA |

## Security Considerations

- None — read-only utility chrome

## Next Steps

Phase 4 — `ui_layout` setting in system_settings + Settings UI + Realtime subscription + confirm dialog.
