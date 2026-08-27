---
phase: 1
title: "Cleanup & Nav Fix"
status: pending
priority: P1
effort: "1h"
dependencies: []
---

# Phase 1: Cleanup & Nav Fix

## Overview

Delete the 3 sub-page directories under `dashboard/question-bank/`, fix `nav-config.ts` to emit a single link for Question Bank, and update `app-sidebar.tsx` to render single-link groups as direct nav items (no accordion, no chevron).

## Requirements

- Functional: Question Bank appears as a flat nav item in sidebar, clicking navigates directly to `/dashboard/question-bank`
- Non-functional: Collapsed sidebar still shows icon; hover-expand shows label without chevron

## Architecture

`nav-config.ts` keeps `NavGroup` shape but Question Bank group gets only 1 link. `app-sidebar.tsx` detects `links.length === 1` and renders a `NavStandaloneItem` (direct Link) instead of accordion `NavSection`.

Alternatively: add `standalone: true` flag to `NavGroup` — cleaner, explicit intent.

**Chosen approach:** Add `standalone?: boolean` to `NavGroup`. When true, `NavSection` renders as direct nav link (no accordion toggle, no chevron). This avoids coupling sidebar logic to `links.length`.

## Related Code Files

- Delete: `src/app/dashboard/question-bank/add/`
- Delete: `src/app/dashboard/question-bank/import/`
- Delete: `src/app/dashboard/question-bank/ai-pipeline/`
- Modify: `src/components/ui/nav-config.ts`
- Modify: `src/components/ui/app-sidebar.tsx`

## Implementation Steps

1. **Delete sub-pages** — remove these dirs entirely:
   - `src/app/dashboard/question-bank/add/`
   - `src/app/dashboard/question-bank/import/`
   - `src/app/dashboard/question-bank/ai-pipeline/`

2. **Update `NavGroup` type** in `nav-config.ts`:
   - Add `standalone?: boolean` field to `NavGroup` interface
   - Update `NavGroup["id"]` union type (no change needed, `"question-bank"` already there)

3. **Update question-bank group** in `nav-config.ts`:
   - Remove the 3 sub-links (`add`, `import`, `ai-pipeline`)
   - Keep only: `{ href: "/dashboard/question-bank", label: "Question Bank", icon: Database }`
   - Add `standalone: true`
   - Remove unused imports: `Upload`, `PlusCircle`, `BrainCircuit`

4. **Update `NavSection`** in `app-sidebar.tsx`:
   - When `group.standalone === true` OR `links.length === 1`: render as direct `<Link>` (no `e.preventDefault()`, no chevron, no sub-items section)
   - Active state: `pathname === links[0].href || pathname.startsWith(links[0].href + "/")`
   - Style: same as existing non-accordion link pattern

## Success Criteria

- [ ] No files exist under `src/app/dashboard/question-bank/add/`, `import/`, `ai-pipeline/`
- [ ] `nav-config.ts` question-bank group has exactly 1 link + `standalone: true`
- [ ] Sidebar shows "Question Bank" as flat item (no chevron, no children)
- [ ] Clicking navigates to `/dashboard/question-bank` directly
- [ ] Collapsed sidebar icon still visible; hover-expand shows label

## Risk Assessment

Low risk. The `NavSection` change is additive (new branch for `standalone`). Existing groups unaffected since they don't have `standalone: true`.
