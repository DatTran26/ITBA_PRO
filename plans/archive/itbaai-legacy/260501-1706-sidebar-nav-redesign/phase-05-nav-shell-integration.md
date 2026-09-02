---
phase: 5
title: NavShell integration + dashboard layout wiring
status: pending
effort: 0.5 day
branch: feat/sidebar-nav-redesign/phase-05-nav-shell
depends_on: [phase-04]
---

# Phase 5 — NavShell Integration

## Context Links
- Plan: [plan.md](plan.md)
- Brainstorm: [../reports/brainstorm-260501-1627-sidebar-nav-redesign.md](../reports/brainstorm-260501-1627-sidebar-nav-redesign.md) (architecture section)
- Existing: `src/app/dashboard/layout.tsx`

## Overview

**Priority:** P0
**Status:** pending
**Description:** Tie everything together. Server component reads `ui_layout` + `sidebar_collapsed` cookie + user data once. Passes to client `<NavShell>` which renders either top-nav OR sidebar+content-header. Mount Realtime listener globally. Wire mobile drawer state.

## Key Insights

- `dashboard/layout.tsx` is already a server component — perfect place to fetch settings once per request
- Realtime listener must mount client-side and persist across navigation — render it inside NavShell so it's tied to dashboard scope
- Mobile drawer state owned by NavShell client component (lifts hamburger click → controls Sheet open state)

## Requirements

**Functional:**
- Server component: fetch user, ui_layout, sidebar_collapsed cookie in parallel
- Render `<NavShell>` client component with these props
- NavShell branches on `layout` prop:
  - `'topnav'`: render existing `<AppNavbar user={...} />`, no sidebar, no content-header
  - `'sidebar'`: render `<AppSidebar>` + `<AppContentHeader>` + main content area, content offset by sidebar width
- NavShell mounts `<UiLayoutRealtimeListener currentLayout={layout} />` always
- Mobile state managed: `sheetOpen` boolean, hamburger toggles, AppSidebar wrapped in Sheet for mobile

**Non-functional:**
- Zero render flash — all data server-resolved
- Main content area auto-adjusts margin when sidebar collapses (CSS transition)
- Reduce layout flicker on `router.refresh()` after layout change

## Architecture

### File: `src/components/ui/nav-shell.tsx` (NEW)

```tsx
"use client";

import { useState } from "react";
import AppNavbar from "./app-navbar";
import AppSidebar from "./app-sidebar";
import AppContentHeader from "./app-content-header";
import UiLayoutRealtimeListener from "./ui-layout-realtime-listener";
import { Sheet, SheetContent } from "./sheet";
import type { UserRole } from "./nav-config";
import type { UiLayout } from "@/lib/settings/ui-layout";

interface NavShellProps {
  user: { name: string; email: string; role: UserRole } | null;
  layout: UiLayout;
  sidebarCollapsed: boolean;
  children: React.ReactNode;
}

export default function NavShell({ user, layout, sidebarCollapsed, children }: NavShellProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  if (layout === 'topnav') {
    return (
      <>
        <UiLayoutRealtimeListener currentLayout={layout} />
        <AppNavbar user={user ?? undefined} />
        <main className="pt-20 px-4">{children}</main>
      </>
    );
  }

  // Sidebar layout
  const contentMargin = sidebarCollapsed ? 'md:ml-16' : 'md:ml-[260px]';

  return (
    <>
      <UiLayoutRealtimeListener currentLayout={layout} />

      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <AppSidebar user={user} initialCollapsed={sidebarCollapsed} />
      </div>

      {/* Mobile drawer */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="left" className="p-0 w-[280px] bg-[#101828] border-[#8B99B0]/10">
          <AppSidebar
            user={user}
            initialCollapsed={false}
            isMobile
            onMobileClose={() => setSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div className={`${contentMargin} transition-[margin] duration-200`}>
        <AppContentHeader
          userRole={user?.role}
          onMobileMenuClick={() => setSheetOpen(true)}
        />
        <main className="px-4 py-6">{children}</main>
      </div>
    </>
  );
}
```

### Modify: `src/app/dashboard/layout.tsx`

```tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NavShell from "@/components/ui/nav-shell";
import { readUiLayout } from "@/lib/settings/ui-layout";
import { readSidebarCollapsed } from "@/components/ui/sidebar-collapse-cookie";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: userData }, layout, sidebarCollapsed] = await Promise.all([
    supabase.from("users").select("name, email, role").eq("auth_id", user.id).single(),
    readUiLayout(),
    readSidebarCollapsed(),
  ]);

  return (
    <div className="min-h-screen bg-[#121A2E] text-[#ECF0F7] font-body selection:bg-[#5B6CF0]/30 overflow-hidden relative">
      {/* Global mesh gradient — unchanged */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden opacity-60">
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-[#5B6CF0]/[0.08] blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] left-[-5%] w-[40%] h-[40%] bg-[#7C8FFF]/[0.05] blur-[100px] rounded-full" />
        <div className="absolute top-[20%] left-[20%] w-[30%] h-[30%] bg-[#36DDAB]/[0.03] blur-[80px] rounded-full" />
      </div>

      <div className="relative z-10">
        <NavShell user={userData} layout={layout} sidebarCollapsed={sidebarCollapsed}>
          {children}
        </NavShell>
      </div>
    </div>
  );
}
```

### Audit: per-page top spacing

Existing pages assume `pt-20` (top-nav layout offset). When switching to sidebar layout, content-header replaces this. The NavShell handles main padding — but individual pages may have hardcoded `pt-20` that conflicts. **Audit task in todo list.**

## Related Code Files

**Modify:**
- `src/app/dashboard/layout.tsx`

**Create:**
- `src/components/ui/nav-shell.tsx`

**Audit (read-only this phase, fixes deferred to QA Phase 6 if found):**
- All `src/app/dashboard/**/page.tsx` — check for hardcoded `pt-20` or similar layout assumptions

## Implementation Steps

1. Create branch from phase-04: `git checkout -b feat/sidebar-nav-redesign/phase-05-nav-shell`
2. Create `nav-shell.tsx`
3. Modify `dashboard/layout.tsx` — fetch ui_layout + cookie in parallel with user
4. Wire mobile Sheet state in NavShell
5. Verify shadcn Sheet import path
6. `npm run build` passes
7. Manual: open dashboard with `ui_layout='topnav'` (default) → existing layout unchanged
8. Manual: SQL flip to `'sidebar'` → reload → sidebar appears
9. Manual: mobile viewport — hamburger opens drawer
10. Manual: super_admin Settings toggle → all open browser tabs auto-refresh within ~2s

## Todo List

- [ ] Create branch from phase-04
- [ ] Create `nav-shell.tsx`
- [ ] Branch on layout prop (topnav vs sidebar)
- [ ] Mount UiLayoutRealtimeListener
- [ ] Mobile Sheet wrapper for AppSidebar
- [ ] Wire onMobileMenuClick from AppContentHeader to Sheet state
- [ ] Modify dashboard/layout.tsx — parallel fetch
- [ ] Pass user, layout, sidebarCollapsed to NavShell
- [ ] Audit dashboard pages for `pt-20` / hardcoded top offset (list issues)
- [ ] Compile passes
- [ ] Manual: topnav layout works as before
- [ ] Manual: sidebar layout renders correctly
- [ ] Manual: mobile drawer works
- [ ] Manual: realtime live update verified (open 2 browser tabs, flip via SQL or Settings UI, both refresh)
- [ ] Commit + push

## Success Criteria

- Topnav layout: identical to current behavior post-phase-1 refactor
- Sidebar layout: sidebar visible left, content-header above main, content area offset
- Mobile: hamburger opens Sheet drawer, link click closes it
- Live update: super_admin flips → all open tabs refresh ~2s later with toast
- No render flash on initial load (cookie + setting server-resolved)
- Build green, no console errors

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Per-page `pt-20` causes double top-padding in sidebar layout | H | M | Audit step in todo list; if found, defer to Phase 6 with concrete fix list |
| Realtime listener double-fires on tab switch | L | L | useEffect cleanup; lastValueRef prevents duplicate refresh |
| Server-side cookie read blocks render | L | L | `cookies()` is synchronous-ish in Next 15; minimal cost |
| Sheet z-index conflict with existing modals | M | M | shadcn Sheet uses high z-index by default; verify against existing modals |
| Content-header offset wrong when sidebar collapsed mid-session | M | M | NavShell re-renders with new collapsed state via cookie write + future refresh; collapse state lives in AppSidebar useState — accept slight content-margin mismatch until refresh OR lift state to NavShell |

### Architecture decision: collapse state location

Trade-off: keeping `collapsed` state inside `AppSidebar` means `NavShell` doesn't know when it changes → content margin won't follow live. Options:
- **A.** Lift `collapsed` to NavShell (initial from cookie, child reports changes via callback) — content margin updates live ✅ chosen
- B. Accept stale margin until next route navigation — simpler but jank

Update `app-sidebar.tsx` (Phase 2) accordingly OR fix in this phase. **Resolution: amend AppSidebar to accept `collapsed` + `onCollapseChange` props (controlled component); NavShell owns state.** Defer to here since the integration boundary is clearer now.

```tsx
// In NavShell:
const [collapsed, setCollapsed] = useState(sidebarCollapsed);

// AppSidebar prop change:
<AppSidebar
  user={user}
  collapsed={collapsed}
  onCollapseChange={(next) => {
    setCollapsed(next);
    document.cookie = `sidebar_collapsed=${next ? '1' : '0'}; path=/; max-age=31536000; SameSite=Lax`;
  }}
/>
```

## Security Considerations

- No new auth surface — existing user fetch + role check
- `ui_layout` setting is non-sensitive

## Next Steps

Phase 6 — QA matrix + rollout + docs.
