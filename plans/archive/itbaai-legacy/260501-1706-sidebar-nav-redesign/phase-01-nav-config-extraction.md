---
phase: 1
title: Nav config extraction + label rename
status: pending
effort: 0.5 day
branch: feat/sidebar-nav-redesign/phase-01-nav-config
depends_on: []
---

# Phase 1 — Nav Config Extraction

## Context Links
- Plan: [plan.md](plan.md)
- Brainstorm: [../reports/brainstorm-260501-1627-sidebar-nav-redesign.md](../reports/brainstorm-260501-1627-sidebar-nav-redesign.md) (decisions #7, #9)
- Existing component: `src/components/ui/app-navbar.tsx`

## Overview

**Priority:** P0 (blocking all subsequent phases)
**Status:** pending
**Description:** Extract hardcoded link arrays + role-gating logic from `app-navbar.tsx` into a single shared module `nav-config.ts`. Rename section labels Management→People & Roles, Admin→System. Refactor `app-navbar.tsx` to consume the config (no behavior change). This is the load-bearing first step — without it, dual-rendering causes drift.

## Key Insights

- Current `app-navbar.tsx` has 3 inline arrays (`MGMT_LINKS`, `ADMIN_LINKS`, `RECRUITMENT_LINKS`) + scattered role-gating conditionals
- Section labels appear as dropdown trigger labels in top-nav — renaming changes top-nav UX cosmetically (acceptable, super_admin-only test phase)
- Roles in app: `super_admin`, `admin`, `recruiter`, `hr`, `interviewer`

## Requirements

**Functional:**
- Single export `NAV_GROUPS: NavGroup[]` defining ALL nav structure
- Helper `visibleGroupsFor(role): NavGroup[]` returns groups user can see
- `app-navbar.tsx` consumes `NAV_GROUPS` exclusively — no inline arrays remain

**Non-functional:**
- Zero behavior change after refactor (same role-gating, same active highlighting)
- TypeScript strict — `UserRole` type exported and reused

## Architecture

### File: `src/components/ui/nav-config.ts` (NEW)

```ts
import type { LucideIcon } from 'lucide-react';
import {
  Users, Briefcase, Zap, FolderKanban, Settings,
  FileText, GitBranch, ClipboardList, Calendar
} from 'lucide-react';

export type UserRole = 'super_admin' | 'admin' | 'recruiter' | 'hr' | 'interviewer';

export interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface NavGroup {
  id: 'people' | 'recruitment' | 'interviews' | 'system';
  label: string;
  triggerIcon?: LucideIcon;
  links: NavLink[];
  allowedRoles: UserRole[];
  accentColor: string;  // hex, used for sidebar section header
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'people',
    label: 'People & Roles',
    links: [
      { href: '/dashboard/persons',   label: 'Persons',   icon: Users },
      { href: '/dashboard/positions', label: 'Positions', icon: Briefcase },
      { href: '/dashboard/skills',    label: 'Skills',    icon: Zap },
      { href: '/dashboard/groups',    label: 'Groups',    icon: FolderKanban },
    ],
    allowedRoles: ['recruiter', 'admin', 'super_admin'],
    accentColor: '#7C8FFF',
  },
  {
    id: 'recruitment',
    label: 'Recruitment',
    triggerIcon: ClipboardList,
    links: [
      { href: '/dashboard/recruitment/settings', label: 'Settings',           icon: Settings },
      { href: '/dashboard/recruitment/schedule', label: 'Schedule Interview', icon: Calendar },
      { href: '/dashboard/recruitment/report',   label: 'Report',             icon: FileText },
    ],
    allowedRoles: ['hr', 'interviewer', 'admin', 'super_admin'],
    accentColor: '#7C8FFF',
  },
  {
    id: 'interviews',
    label: 'Interviews',
    triggerIcon: Calendar,
    links: [
      { href: '/dashboard/interviews', label: 'Interviews', icon: Calendar },
    ],
    allowedRoles: ['interviewer', 'admin', 'super_admin'],
    accentColor: '#F59E0B',
  },
  {
    id: 'system',
    label: 'System',
    links: [
      { href: '/dashboard/settings',  label: 'Settings',  icon: Settings },
      { href: '/dashboard/templates', label: 'Templates', icon: FileText },
      { href: '/dashboard/versions',  label: 'Versions',  icon: GitBranch },
    ],
    allowedRoles: ['admin', 'super_admin'],
    accentColor: '#B48EFF',
  },
];

// Special-case: Versions link standalone for hr/interviewer/recruiter roles
// (current top-nav exposes /dashboard/versions to them outside the System group).
// Keep as separate export to avoid duplicating in NAV_GROUPS.
export const VERSIONS_STANDALONE_ROLES: UserRole[] = ['hr', 'interviewer', 'recruiter'];

export function visibleGroupsFor(role: UserRole | null | undefined): NavGroup[] {
  if (!role) return [];
  return NAV_GROUPS.filter(g => g.allowedRoles.includes(role));
}

export function shouldShowVersionsStandalone(role: UserRole | null | undefined): boolean {
  return !!role && VERSIONS_STANDALONE_ROLES.includes(role);
}
```

### Refactor: `src/components/ui/app-navbar.tsx`

- Remove inline `MGMT_LINKS`, `ADMIN_LINKS`, `RECRUITMENT_LINKS`, `RECRUITMENT_ROLES`, `MGMT_ALLOWED_ROLES`
- Replace dropdown rendering with `.map()` over `visibleGroupsFor(user.role)`
- Single dropdown component per group (extract `<NavGroupDropdown group={...} />` if reduces duplication)
- Versions standalone link uses `shouldShowVersionsStandalone(user.role)`
- Active state logic unchanged

## Related Code Files

**Modify:**
- `src/components/ui/app-navbar.tsx` (refactor to consume nav-config)

**Create:**
- `src/components/ui/nav-config.ts`

**Delete:** none

## Implementation Steps

1. Create branch from `dev`: `git checkout -b feat/sidebar-nav-redesign/phase-01-nav-config`
2. Create `src/components/ui/nav-config.ts` with full type defs + `NAV_GROUPS` constant
3. Verify icon imports — match existing `lucide-react` icons used in `app-navbar.tsx`
4. Refactor `app-navbar.tsx`:
   - Import `visibleGroupsFor`, `shouldShowVersionsStandalone`, `NAV_GROUPS` (need single group lookup for "Recruitment" since it has triggerIcon)
   - Replace 3 hardcoded dropdowns with `.map()` over visible groups
   - Preserve current active-state CSS exactly (per-group accent on trigger)
   - Preserve Interviews link (use NAV_GROUPS find-by-id 'interviews', render as single link not dropdown if `links.length === 1`)
5. Run `npm run build` — must pass with zero TS errors
6. Manual smoke test in dev: each role sees correct dropdowns + correct links + correct active highlighting

## Todo List

- [ ] Create branch from dev
- [ ] Create `nav-config.ts` with types + NAV_GROUPS
- [ ] Verify all icons imported correctly
- [ ] Refactor app-navbar.tsx to consume config
- [ ] Single-link group renders as link (not dropdown)
- [ ] Compile passes (`npm run build`)
- [ ] Smoke test super_admin role
- [ ] Smoke test admin role
- [ ] Smoke test recruiter role
- [ ] Smoke test hr role
- [ ] Smoke test interviewer role
- [ ] Verify renamed labels visible: "People & Roles" + "System"
- [ ] Verify Versions standalone link shows for hr/interviewer/recruiter
- [ ] Commit + push branch

## Success Criteria

- `app-navbar.tsx` contains zero hardcoded link arrays
- Grep for `/dashboard/persons` returns ONLY `nav-config.ts` (no other source)
- All 5 roles smoke-tested OK (manual)
- Build green, no TS errors
- Old "Management" / "Admin" labels no longer appear in UI

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Role-gating regression | M | H | Smoke test all 5 roles before commit |
| Single-link group rendering edge case (Interviews has 1 link) | M | L | Add type-level branch: `links.length === 1 ? <Link /> : <Dropdown />` |
| Icon import mismatch | L | L | Visual diff before/after |
| Label rename breaks docs | L | L | Update `docs/system-architecture.md` if it references old labels (Phase 6) |

## Security Considerations

- No security changes — pure refactor
- Role logic moves to module but uses same `user.role` source

## Next Steps

Phase 2 — sidebar component build, consuming the same `nav-config.ts`.
