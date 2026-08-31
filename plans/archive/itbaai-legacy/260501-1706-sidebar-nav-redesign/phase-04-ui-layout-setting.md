---
phase: 4
title: ui_layout setting + Settings UI + Realtime
status: pending
effort: 1 day
branch: feat/sidebar-nav-redesign/phase-04-layout-setting
depends_on: [phase-03]
---

# Phase 4 — ui_layout Setting + Settings UI + Realtime Live Update

## Context Links
- Plan: [plan.md](plan.md)
- Brainstorm: [../reports/brainstorm-260501-1627-sidebar-nav-redesign.md](../reports/brainstorm-260501-1627-sidebar-nav-redesign.md) (decisions #1, #5, #6, #12, #13, #14)
- DB: `supabase/migrations/20260329000000_admin_role_and_version_management.sql` (system_settings table + RLS)
- Existing: `src/app/dashboard/settings/page.tsx`, `settings-client.tsx`

## Overview

**Priority:** P0 (gates rollout)
**Status:** pending
**Description:** Seed `system_settings` with `ui_layout` key, add **"Navigation Layout"** section to Settings page (super_admin only), implement Supabase Realtime subscription + toast + `router.refresh()` flow. Includes confirm dialog before super_admin flips. Verify/extend RLS policy for super_admin write.

## Key Insights

- `system_settings` table already exists with shape `(key, value jsonb, category, label, description, input_type, options jsonb)`
- Existing RLS policy `settings_update_admin` is restricted to `role='admin'` only — **must extend to include super_admin** OR rely on API-layer enforcement (current pattern in `src/app/api/settings/route.ts`)
- Existing `settings_select_all` policy permits read for all authenticated users — Realtime broadcast works out-of-box
- Realtime postgres_changes requires the table be in publication; verify `supabase_realtime` includes `system_settings`

## Requirements

**Functional:**
- Insert/upsert default row: `key='ui_layout'`, `value='"topnav"'`, `category='appearance'`, `label='Navigation Layout'`, `input_type='select'`, `options='["topnav","sidebar"]'`
- "Navigation Layout" section in Settings page visible ONLY when `user.role === 'super_admin'`
- Toggle UI: 2 cards or radio group (Top Navigation / Sidebar) with preview thumbnail icon
- Click toggle → confirm dialog "This will change navigation for ALL users immediately. Continue?"
- Confirm → upsert `system_settings.ui_layout` via Supabase client (writes audited via existing pattern)
- Supabase Realtime channel subscribed in client provider — receives postgres_changes event for `key='ui_layout'`
- On event: show toast "Navigation layout updated. Refreshing in 2s..." → `setTimeout(() => router.refresh(), 2000)`
- Skip toast/refresh if event value === current local value (idempotent)

**Non-functional:**
- RLS verified: super_admin can write
- Realtime publication verified
- Toast component reuse (check if `sonner` or shadcn `Toast` already in project)

## Architecture

### Migration: `supabase/migrations/{timestamp}_ui_layout_setting.sql` (NEW)

```sql
-- Seed ui_layout system setting + extend RLS policy for super_admin

INSERT INTO public.system_settings (key, value, category, label, description, input_type, options)
VALUES (
  'ui_layout',
  '"topnav"'::jsonb,
  'appearance',
  'Navigation Layout',
  'Global navigation layout for all users (topnav or sidebar)',
  'select',
  '["topnav", "sidebar"]'::jsonb
)
ON CONFLICT (key) DO NOTHING;

-- Extend update policy to include super_admin (currently only admin)
DROP POLICY IF EXISTS settings_update_admin ON public.system_settings;
CREATE POLICY settings_update_admin ON public.system_settings
  FOR UPDATE TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE auth_id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Verify table is in realtime publication (idempotent)
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_settings;
```

### Helper: `src/lib/settings/ui-layout.ts` (NEW)

```ts
import { createClient as createServerClient } from '@/lib/supabase/server';

export type UiLayout = 'topnav' | 'sidebar';

export async function readUiLayout(): Promise<UiLayout> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'ui_layout')
    .single();
  const value = data?.value;
  return value === 'sidebar' ? 'sidebar' : 'topnav';  // safe default
}
```

### Client provider: `src/components/ui/ui-layout-realtime-listener.tsx` (NEW)

```tsx
"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";  // or whatever toast lib is in project

export default function UiLayoutRealtimeListener({ currentLayout }: { currentLayout: 'topnav' | 'sidebar' }) {
  const router = useRouter();
  const lastValueRef = useRef(currentLayout);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('system_settings:ui_layout')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'system_settings', filter: 'key=eq.ui_layout' },
        (payload) => {
          const newValue = (payload.new as { value: unknown }).value;
          const next = newValue === 'sidebar' ? 'sidebar' : 'topnav';
          if (next === lastValueRef.current) return;
          lastValueRef.current = next;
          toast.info('Navigation layout updated by admin. Refreshing in 2s...');
          setTimeout(() => router.refresh(), 2000);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [router]);

  return null;
}
```

### Settings UI: modify `src/app/dashboard/settings/settings-client.tsx`

Add new section "Appearance" (super_admin only) with `<UiLayoutToggle currentValue={...} />`:

```tsx
// New component: src/app/dashboard/settings/ui-layout-toggle.tsx
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function UiLayoutToggle({ currentValue }: { currentValue: 'topnav' | 'sidebar' }) {
  const [pendingValue, setPendingValue] = useState<'topnav' | 'sidebar' | null>(null);
  const [busy, setBusy] = useState(false);

  async function applyChange(value: 'topnav' | 'sidebar') {
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('system_settings')
      .update({ value: JSON.stringify(value) })
      .eq('key', 'ui_layout');
    setBusy(false);
    if (error) {
      toast.error(`Failed to update layout: ${error.message}`);
      return;
    }
    toast.success('Navigation layout updated.');
    // Realtime listener will trigger refresh for everyone (including this user)
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-[#ECF0F7]">Navigation Layout</h3>
      <p className="text-xs text-[#8B99B0]">Applies globally to all users. Change takes effect within ~2 seconds.</p>
      <div className="grid grid-cols-2 gap-3 max-w-lg">
        {(['topnav', 'sidebar'] as const).map(opt => (
          <AlertDialog key={opt} open={pendingValue === opt} onOpenChange={o => !o && setPendingValue(null)}>
            <AlertDialogTrigger asChild>
              <button
                disabled={busy || currentValue === opt}
                onClick={() => setPendingValue(opt)}
                className={`p-4 rounded-xl border-2 text-left transition-colors disabled:cursor-default
                  ${currentValue === opt
                    ? 'border-[#7C8FFF] bg-[#7C8FFF]/10'
                    : 'border-[#8B99B0]/20 hover:border-[#7C8FFF]/40'}`}
              >
                <div className="text-sm font-medium text-[#ECF0F7]">
                  {opt === 'topnav' ? 'Top Navigation' : 'Sidebar'}
                </div>
                <div className="text-xs text-[#8B99B0] mt-1">
                  {opt === 'topnav' ? 'Horizontal bar at top' : 'Vertical bar on left'}
                </div>
                {currentValue === opt && (
                  <div className="text-[10px] text-[#7C8FFF] mt-2 uppercase tracking-wider">Active</div>
                )}
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Change navigation layout?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will change the navigation layout for <strong>ALL users</strong> immediately.
                  Online users will see a refresh notification within 2 seconds.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setPendingValue(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => { setPendingValue(null); applyChange(opt); }}
                >
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ))}
      </div>
    </div>
  );
}
```

In `settings-client.tsx`: gate render on `user.role === 'super_admin'`. Pass `currentValue` from server component (read via `readUiLayout()`).

## Related Code Files

**Modify:**
- `src/app/dashboard/settings/page.tsx` (server-side fetch ui_layout, pass to client)
- `src/app/dashboard/settings/settings-client.tsx` (add Appearance section for super_admin)

**Create:**
- `supabase/migrations/{timestamp}_ui_layout_setting.sql`
- `src/lib/settings/ui-layout.ts`
- `src/components/ui/ui-layout-realtime-listener.tsx`
- `src/app/dashboard/settings/ui-layout-toggle.tsx`

**Verify available:**
- shadcn `AlertDialog` — install if missing
- Toast lib (sonner or shadcn Toast) — install if missing

## Implementation Steps

1. Create branch from phase-03: `git checkout -b feat/sidebar-nav-redesign/phase-04-layout-setting`
2. Create migration file, run via Supabase CLI/MCP
3. Verify migration applied: `SELECT * FROM system_settings WHERE key='ui_layout'`
4. Verify `supabase_realtime` publication includes `system_settings`
5. Test super_admin write: log in as super_admin, attempt UPDATE via SQL — should succeed
6. Test admin write: should still succeed
7. Test non-admin write: should be denied (recruiter, hr, interviewer)
8. Install shadcn AlertDialog + sonner toast if missing
9. Create `src/lib/settings/ui-layout.ts` helper
10. Create `ui-layout-realtime-listener.tsx`
11. Create `ui-layout-toggle.tsx`
12. Modify `settings-client.tsx` to render new section gated on super_admin
13. Modify `settings/page.tsx` to fetch + pass currentValue
14. `npm run build` passes
15. Manual test: super_admin opens Settings → sees Appearance section → clicks toggle → confirm dialog → confirms → DB row updated → toast appears

## Todo List

- [ ] Create branch from phase-03
- [ ] Write migration: seed ui_layout + RLS update + realtime publication
- [ ] Apply migration
- [ ] Verify row exists in DB
- [ ] Verify realtime publication includes system_settings
- [ ] Test super_admin can UPDATE
- [ ] Test non-admin denied
- [ ] Install shadcn AlertDialog (if missing)
- [ ] Install/verify toast lib (sonner)
- [ ] Create `src/lib/settings/ui-layout.ts`
- [ ] Create `ui-layout-realtime-listener.tsx`
- [ ] Create `ui-layout-toggle.tsx` with confirm dialog
- [ ] Modify `settings/page.tsx` server fetch
- [ ] Modify `settings-client.tsx` to render Appearance section (super_admin only)
- [ ] Manual: super_admin sees section, admin does NOT
- [ ] Manual: confirm dialog appears on click
- [ ] Manual: cancel dialog → no DB write
- [ ] Manual: confirm → DB row updated
- [ ] Compile passes
- [ ] Commit + push

## Success Criteria

- Migration applies cleanly
- `system_settings.ui_layout` row exists with default `"topnav"`
- super_admin can UPDATE; admin can UPDATE; recruiter/hr/interviewer DENIED
- Settings page shows "Navigation Layout" section for super_admin only
- Confirm dialog appears, cancel works, confirm writes DB
- Realtime listener subscribes successfully (verify via Network tab WebSocket frames OR debug log)
- Build green, no TS errors

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Realtime publication doesn't include system_settings | M | H | Migration adds it; verify after apply |
| RLS policy update breaks existing admin writes | L | H | Migration uses DROP+CREATE on update policy; existing admin role still in WHERE clause |
| Toast library not installed | M | L | Install sonner if missing; fallback to native alert in worst case |
| Self-toast on writer (super_admin sees own toast) | L | L | Acceptable UX — confirms write succeeded; can suppress later |
| Realtime channel cleanup leaks on navigation | L | M | useEffect cleanup `removeChannel` on unmount |
| Race: super_admin clicks twice rapidly | L | M | `busy` state guards button; AlertDialog only allows one open |

## Security Considerations

- RLS enforces who can write — extending to super_admin is intentional & scoped
- `system_settings` SELECT is public-readable (existing policy) — no PII concern
- Realtime channel uses authenticated client, no extra auth surface

## Next Steps

Phase 5 — `nav-shell.tsx` integration + `dashboard/layout.tsx` modification + Realtime listener mount.
