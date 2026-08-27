# Phase 9: Navigation & Polish

## Context Links

- [App Navbar](../../src/components/ui/app-navbar.tsx)
- [Navbar User Dropdown](../../src/components/ui/navbar-user-dropdown.tsx)
- [Dashboard Client](../../src/app/dashboard/dashboard-client.tsx)
- All previous phases

## Overview

- **Priority**: P3
- **Status**: pending
- **Effort**: 3h

Final integration: update navbar with admin-only navigation entries, add conditional rendering across existing pages, ensure all admin features are discoverable and non-admin users cannot see them. Integration testing checklist.

## Key Insights

- `app-navbar.tsx` has a `MGMT_LINKS` array for the Management dropdown — can add admin section
- `navbar-user-dropdown.tsx` already has `user.role === "admin"` conditional for Settings link
- Admin-only pages: Settings, Templates, Export (no standalone page, just buttons), User Management (already exists)
- Admin-only actions: version CRUD, skill category management, level expectations management
- Some pages need `isAdmin` prop passed down from server components to show/hide actions
- Current user data is fetched client-side in navbar if not passed via props

## Requirements

### Functional
- Add admin-only nav entries to navbar: Settings, Templates, Versions (management)
- Update user dropdown: add Settings link (already exists), add Templates link
- Conditionally hide admin actions on existing pages for non-admin users
- Add admin badge next to user role display
- Ensure all admin-restricted URLs redirect non-admin to dashboard

### Non-functional
- Smooth conditional rendering (no layout shift)
- Mobile-responsive admin nav entries
- Consistent admin gating pattern across all pages

## Architecture

### Admin Nav Structure

```
Navbar
├── Logo + Breadcrumbs
├── Management Dropdown (existing: Persons, Positions, Skills, Groups)
├── Admin Dropdown (NEW — admin-only)
│   ├── Settings
│   ├── Templates
│   ├── Versions
│   └── Token Usage (links to admin dashboard)
├── Search
├── Notification Bell
└── User Dropdown
    ├── Profile
    ├── Settings (admin-only — already exists)
    ├── Templates (admin-only — NEW)
    └── Logout
```

### Pages Needing Admin Gate (Server-side redirect)

| Page | File | Behavior for Non-Admin |
|------|------|----------------------|
| `/dashboard/settings` | `settings/page.tsx` | Redirect to `/dashboard` |
| `/dashboard/templates` | `templates/page.tsx` | Accessible (all can read), but write buttons hidden |
| `/dashboard/versions` | `versions/page.tsx` | Accessible (filtered to published only) |

### Pages Needing `isAdmin` Prop for Conditional UI

| Page | Component | Admin-only Elements |
|------|-----------|-------------------|
| Dashboard | `dashboard-client.tsx` | Admin mode tab, export buttons |
| Versions | `versions-client.tsx` | Create/Edit/Delete buttons, status tabs |
| Skills | `skills-list-client.tsx` | Category management, export button |
| Position Detail | `position-detail-client.tsx` | Level expectations editor |

## Related Code Files

### Files to Modify
- `D:\Projects\Git Private\ITBAAI\src\components\ui\app-navbar.tsx` — add admin dropdown
- `D:\Projects\Git Private\ITBAAI\src\components\ui\navbar-user-dropdown.tsx` — add Templates link
- `D:\Projects\Git Private\ITBAAI\src\app\dashboard\versions\page.tsx` — pass `isAdmin` to client
- `D:\Projects\Git Private\ITBAAI\src\app\dashboard\skills\page.tsx` — pass `isAdmin` to client
- `D:\Projects\Git Private\ITBAAI\src\app\dashboard\positions\[id]\page.tsx` — pass `isAdmin` to client

### Files NOT Modified (already handled in earlier phases)
- `dashboard/page.tsx` — handled in Phase 8
- `dashboard-client.tsx` — handled in Phase 8
- `dashboard-mode-tabs.tsx` — handled in Phase 8
- `settings/page.tsx` — created in Phase 2
- `templates/page.tsx` — created in Phase 5

## Implementation Steps

### Step 1: Add admin dropdown to navbar

Modify `src/components/ui/app-navbar.tsx`:

1. Add `ADMIN_LINKS` array:
```typescript
const ADMIN_LINKS = [
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
  { href: "/dashboard/templates", label: "Templates", icon: FileTemplate },
  { href: "/dashboard/versions", label: "Versions", icon: GitBranch },
];
```

2. Add admin dropdown next to Management dropdown (same pattern):
```tsx
{user?.role === "admin" && (
  <div className="relative hidden md:block shrink-0">
    <button onClick={...} className={...}>
      Admin
      <ChevronDown />
    </button>
    {adminOpen && (
      <div className="absolute ...">
        {ADMIN_LINKS.map(...)}
      </div>
    )}
  </div>
)}
```

### Step 2: Update user dropdown

Modify `src/components/ui/navbar-user-dropdown.tsx`:

1. Change Settings link href from `/dashboard/users` to `/dashboard/settings`
2. Add Templates link (admin-only):
```tsx
{user.role === "admin" && (
  <Link href="/dashboard/templates">
    <DropdownMenuItem>
      <Layers className="w-4 h-4" />
      Templates
    </DropdownMenuItem>
  </Link>
)}
```

### Step 3: Pass `isAdmin` to page clients

For each server page that needs it:

```typescript
// In page.tsx (server component)
const isAdmin = userData?.role === "admin";
// Pass to client:
<SomeClient isAdmin={isAdmin} ... />
```

Pages:
- `versions/page.tsx` → `<VersionsClient versions={...} isAdmin={isAdmin} />`
- `skills/page.tsx` → `<SkillsListClient skills={...} isAdmin={isAdmin} />`
- `positions/[id]/page.tsx` → `<PositionDetailClient ... isAdmin={isAdmin} />`

### Step 4: Conditional rendering in client components

For each client that receives `isAdmin`:
- Wrap admin-only buttons/sections in `{isAdmin && (...)}`
- Example: Export buttons, Create buttons, Edit/Delete on admin-managed entities

### Step 5: Integration testing checklist

Verify end-to-end:

**As Admin:**
- [ ] See 3-tab dashboard toggle (Recruitment / Employee / Admin)
- [ ] See Admin dropdown in navbar with Settings, Templates, Versions
- [ ] Can access `/dashboard/settings`
- [ ] Can create/edit/delete versions
- [ ] Can manage skill categories
- [ ] Can export CSV/Excel/PDF
- [ ] Token usage data appears in admin dashboard
- [ ] Can create/use assessment templates

**As Recruiter:**
- [ ] See 2-tab dashboard toggle (no Admin tab)
- [ ] No Admin dropdown in navbar
- [ ] Cannot access `/dashboard/settings` (redirected)
- [ ] Only sees published versions (no create/edit controls)
- [ ] No export buttons visible
- [ ] Can use templates (read + create own)
- [ ] API rejects admin-only endpoints with 403

## Todo List

- [ ] Add `ADMIN_LINKS` and admin dropdown to `app-navbar.tsx`
- [ ] Add Templates link to `navbar-user-dropdown.tsx`
- [ ] Update Settings link href in dropdown
- [ ] Pass `isAdmin` prop from `versions/page.tsx` to client
- [ ] Pass `isAdmin` prop from `skills/page.tsx` to client
- [ ] Pass `isAdmin` prop from `positions/[id]/page.tsx` to client
- [ ] Add conditional rendering in `versions-client.tsx`
- [ ] Add conditional rendering in `skills-list-client.tsx`
- [ ] Add conditional rendering in `position-detail-client.tsx`
- [ ] Run full integration test checklist (admin role)
- [ ] Run full integration test checklist (recruiter role)
- [ ] Verify mobile responsive admin nav

## Success Criteria

- Admin sees all admin navigation entries; recruiter sees none
- All admin-only URLs either redirect or filter content for non-admin
- No admin data leaks to non-admin clients
- Navigation is intuitive — admin features are discoverable
- Mobile layout handles admin nav cleanly
- All integration test checkpoints pass for both roles

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Navbar too crowded with admin dropdown | Low | Only visible to admin; follows same pattern as Management dropdown |
| Missing `isAdmin` prop somewhere | Medium | Search for all admin-gated UI patterns; checklist above |
| Mobile nav overflow | Low | Admin dropdown follows same responsive pattern as Management |

## Security Considerations

- UI hiding is NOT security — all admin restrictions enforced at API + RLS levels
- `isAdmin` prop derived server-side from database role check
- Never trust client-side role assertions
- This phase only adds UI polish; actual enforcement done in Phases 1-8

## Next Steps

- Feature complete after this phase
- Future: audit log (deferred), additional roles (HR Manager, Interviewer, Viewer)
- Documentation update in `docs/` directory
