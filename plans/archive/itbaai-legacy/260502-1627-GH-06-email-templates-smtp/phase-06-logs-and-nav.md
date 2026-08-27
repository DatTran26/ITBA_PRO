---
phase: 6
title: Logs page + nav-config + permissions
status: pending
effort: 0.5 day
branch: feat/email-templates/phase-06-logs-nav
depends_on: [phase-05]
---

# Phase 6 — Logs Page + Nav + Permissions

## Context Links
- Plan: [plan.md](plan.md)
- Brainstorm: decisions #8 (logs), #10 (nav)

## Overview

**Priority:** P1
**Description:** Build `/dashboard/emails/logs` viewer. Add "Emails" group to nav-config with sub-link visibility (Settings link visible only to admin/super_admin within group). Final permission gates verified across all routes.

## Requirements

**Functional:**
- Logs page: paginated table (20/page), filter by template_type, sender, recipient, status, date range
- Admin/super_admin see ALL logs; hr/interviewer/recruiter see only own (`sent_by = current_user`)
- Click row → modal showing full rendered_body + variables JSON
- Nav-config "Emails" group:
  - Compose (`/dashboard/emails`) — visible to 5 roles
  - Logs (`/dashboard/emails/logs`) — visible to 5 roles (RLS filters)
  - Settings (`/dashboard/emails/settings`) — visible to admin/super_admin only

**Non-functional:**
- Sub-link role check: extend nav-config `NavLink` with optional `allowedRoles` override (more restrictive than group-level)

## Architecture

### nav-config.ts extension

```ts
export interface NavLink {
    href: string;
    label: string;
    icon: LucideIcon;
    /** Override group-level allowedRoles (more restrictive). */
    allowedRoles?: UserRole[];
}

// New group:
{
    id: "emails",
    label: "Emails",
    triggerIcon: Mail,
    links: [
        { href: "/dashboard/emails", label: "Compose", icon: Send },
        { href: "/dashboard/emails/logs", label: "Logs", icon: ScrollText },
        {
            href: "/dashboard/emails/settings",
            label: "Settings",
            icon: Settings,
            allowedRoles: ["admin", "super_admin"],  // override
        },
    ],
    allowedRoles: ["hr", "interviewer", "recruiter", "admin", "super_admin"],
    accentColor: "#36DDAB",
}
```

### Render layer (top-nav + sidebar)

Both `app-navbar.tsx` (NavGroupEntry) and `app-sidebar.tsx` (NavSection) need to filter `group.links` by `link.allowedRoles ?? group.allowedRoles`. Single utility function in nav-config:

```ts
export function visibleLinksFor(group: NavGroup, role: UserRole): NavLink[] {
    return group.links.filter(link => {
        const allowed = link.allowedRoles ?? group.allowedRoles;
        return allowed.includes(role);
    });
}
```

### Logs page: `src/app/dashboard/emails/logs/page.tsx` + `logs-client.tsx`

- Server component: fetch first page of logs (RLS auto-filters per user role)
- Client: filter UI, paginate, modal for detail view

## Related Code Files

**Modify:**
- `src/components/ui/nav-config.ts` (add `link.allowedRoles`, add Emails group, add `visibleLinksFor`)
- `src/components/ui/app-navbar.tsx` (use `visibleLinksFor` instead of rendering all links)
- `src/components/ui/app-sidebar.tsx` (NavSection uses `visibleLinksFor`)

**Create:**
- `src/app/dashboard/emails/logs/page.tsx`
- `src/app/dashboard/emails/logs/logs-client.tsx`
- `src/app/api/emails/logs/route.ts` (GET with filters + pagination, RLS handles per-role)

## Implementation Steps

1. Branch from phase-05
2. Extend nav-config with `link.allowedRoles` + `visibleLinksFor`
3. Add Emails group with 3 links
4. Update app-navbar `NavGroupEntry.map` to use `visibleLinksFor`
5. Update app-sidebar `NavSection.map` similarly
6. Create logs API route with filter/pagination
7. Build logs page + client
8. Click row → modal detail
9. Manual: hr sees only own logs; admin sees all
10. Manual: hr does NOT see Settings link in Emails group
11. Compile passes

## Todo List

- [ ] Branch from phase-05
- [ ] Extend NavLink with allowedRoles
- [ ] Add visibleLinksFor helper
- [ ] Add Emails group to NAV_GROUPS
- [ ] Refactor app-navbar to use visibleLinksFor
- [ ] Refactor app-sidebar to use visibleLinksFor
- [ ] GET /api/emails/logs with filter+pagination
- [ ] Logs page + client
- [ ] Detail modal (full body + variables)
- [ ] Manual: hr sees own logs only
- [ ] Manual: admin sees all logs
- [ ] Manual: hr does NOT see Settings sub-link
- [ ] Compile passes
- [ ] Commit + push

## Success Criteria

- Emails group visible in nav for 5 roles
- Settings sub-link visible only to admin/super_admin
- Logs page filters work + RLS enforces per-role visibility
- Both topnav + sidebar layouts render Emails group correctly

## Risk Assessment

| Risk | L | I | Mitigation |
|------|---|---|------------|
| Sub-link visibility regression in topnav vs sidebar | M | M | Single `visibleLinksFor` utility used by both renderers |
| Logs filter SQL injection | L | H | Use Supabase client builder, no raw SQL |
| RLS bypass exposes other users' logs | L | H | Phase 1 RLS already enforces; logs API does not bypass with service-role key |

## Next Steps

Phase 7 — QA + docs + CHANGELOG.
