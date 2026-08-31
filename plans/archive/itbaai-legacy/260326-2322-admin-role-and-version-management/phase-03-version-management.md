# Phase 3: Version Management Enhancement

## Context Links

- [Brainstorm Report](../reports/brainstorm-260326-2322-admin-role-and-version-management.md)
- [Phase 1 — DB Schema](./phase-01-database-schema.md) (versions table extension)
- [Existing Versions Client](../../src/app/dashboard/versions/versions-client.tsx)
- [Existing Versions Page](../../src/app/dashboard/versions/page.tsx)
- [Notification Bell](../../src/components/ui/notification-bell.tsx)

## Overview

- **Priority**: P1
- **Status**: pending
- **Effort**: 4h

Enhance version management with draft/archived statuses, category badges, admin-only write controls (UI + backend), and a version creation form. Recruiters see published versions only.

## Key Insights

- Current `versions-client.tsx` (307 lines) handles pending/approved/rejected — already has status config pattern
- Current `versions/page.tsx` fetches all versions without role filtering
- Notification bell already queries `versions` with `status = 'pending'`
- Version status flow: `draft → pending → approved → archived` (can also `reject` from pending)
- Map `approved` display label to "Published" in UI
- `versions` table already has: `id, version_number, title, description, features, status, approved_at, notes, created_at`
- Phase 1 adds: `category, visibility_scope, created_by`
- Versions table uses client-side Supabase updates — need to add API route for admin-only enforcement

## Requirements

### Functional
- API route `/api/versions` for admin-only CRUD (POST create, PATCH update)
- Version creation dialog (admin-only): version_number, title, description, features, category
- Status tabs: Draft | Pending | Published | Rejected | Archived
- Category badge on each version card
- Archive button for published versions
- "Create Version" button visible only to admin
- Recruiter sees only `approved` (published) versions
- Status transition controls based on current state

### Non-functional
- Backend enforcement via `requireAdmin()` on all write operations
- Smooth UX transition between status tabs

## Architecture

### Version Workflow State Machine

```
                 ┌──────────┐
                 │  Draft    │
                 └────┬─────┘
                      │ Submit
                 ┌────▼─────┐
                 │  Pending  │
                 └──┬────┬──┘
           Approve  │    │  Reject
            ┌───────▼┐  ┌▼────────┐
            │Approved│  │Rejected │
            │(Publis)│  └─────────┘
            └───┬────┘
                │ Archive
            ┌───▼─────┐
            │Archived │
            └─────────┘
    (Archived can be restored to Draft)
```

### Version Interface (Extended)

```typescript
interface Version {
  id: string;
  version_number: string;
  title: string;
  description: string | null;
  features: string[];
  status: "draft" | "pending" | "approved" | "rejected" | "archived";
  category: string | null;       // NEW
  visibility_scope: string;       // NEW
  created_by: string | null;      // NEW
  approved_at: string | null;
  notes: string | null;
  created_at: string;
}

type VersionCategory = "feature" | "improvement" | "bug_fix" | "security" | "ui" | "ai";
```

## Related Code Files

### Files to Create
- `D:\Projects\Git Private\ITBAAI\src\app\api\versions\route.ts` — POST (create) + GET (list with filters)
- `D:\Projects\Git Private\ITBAAI\src\app\api\versions\[id]\route.ts` — PATCH (update status/fields) + DELETE

### Files to Modify
- `D:\Projects\Git Private\ITBAAI\src\app\dashboard\versions\page.tsx` — pass user role, filter by role
- `D:\Projects\Git Private\ITBAAI\src\app\dashboard\versions\versions-client.tsx` — add status tabs, category badges, create dialog, admin controls
- `D:\Projects\Git Private\ITBAAI\src\components\ui\notification-bell.tsx` — update query to handle new statuses

## Implementation Steps

### Step 1: Create versions API routes

**`src/app/api/versions/route.ts`**:
- POST: `requireAdmin()` → validate body → insert into `versions` with `status: 'draft'`, `created_by: userId`
- GET: `getAuthContext()` → if admin, return all; if recruiter, return only `status = 'approved'`

**`src/app/api/versions/[id]/route.ts`**:
- PATCH: `requireAdmin()` → update fields (status, title, description, features, category, notes)
- DELETE: `requireAdmin()` → delete version

### Step 2: Update versions server page

Modify `src/app/dashboard/versions/page.tsx`:
- Fetch current user + role
- If admin: fetch all versions
- If recruiter: fetch only `status = 'approved'`
- Pass `isAdmin` prop to client

### Step 3: Enhance versions client

Modify `src/app/dashboard/versions/versions-client.tsx`:

1. Add `isAdmin` prop
2. Add STATUS_CONFIG entries for `draft` and `archived`:
   - `draft`: gray/neutral styling, Pencil icon
   - `archived`: slate styling, Archive icon
3. Add status filter tabs (admin sees all 5, recruiter sees only Published tab)
4. Add "Create Version" button (admin-only) → opens dialog form
5. Add category badges on version cards (color-coded)
6. Add action buttons per status:
   - Draft: "Submit for Review" (→ pending), "Edit", "Delete"
   - Pending: "Approve" (→ approved), "Reject" (→ rejected) — existing logic
   - Approved: "Archive" (→ archived)
   - Archived: "Restore to Draft" (→ draft)
7. Move status updates from client-side Supabase to API calls (`fetch /api/versions/[id]`)

### Step 4: Update notification bell

In `notification-bell.tsx`:
- Keep existing pending version notification query
- No changes needed — still notifies on pending status versions

## Todo List

- [ ] Create `src/app/api/versions/route.ts` (GET + POST)
- [ ] Create `src/app/api/versions/[id]/route.ts` (PATCH + DELETE)
- [ ] Modify `versions/page.tsx` — add role-based filtering, pass `isAdmin`
- [ ] Add `draft` and `archived` to STATUS_CONFIG in `versions-client.tsx`
- [ ] Add status filter tabs (admin: all 5, recruiter: published only)
- [ ] Add "Create Version" dialog form (admin-only)
- [ ] Add category badge component to version cards
- [ ] Add context-aware action buttons per version status
- [ ] Migrate status updates from client Supabase to API calls
- [ ] Test: recruiter only sees published versions
- [ ] Test: admin can create, submit, approve, archive, delete versions
- [ ] Test: API rejects non-admin write attempts with 403

## Success Criteria

- Admin can create versions in draft, submit to pending, approve, archive
- Recruiter sees only published versions, no write controls visible
- Category badges display on version cards
- Status tabs filter versions correctly
- All write operations go through API with admin enforcement
- Backend rejects non-admin write with 403

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Existing client-side Supabase updates bypass API | High | Must migrate ALL writes to API calls — remove direct Supabase `.update()` |
| Version table schema mismatch (no migration file) | Medium | Phase 1 handles with ALTER IF NOT EXISTS |

## Security Considerations

- All write endpoints use `requireAdmin()`
- RLS policy (Phase 1) also enforces admin-only write on versions
- Server page filters versions by role before sending to client
- Version creation requires `created_by` set server-side (not from client)

## Next Steps

- Phase 9 (Navigation) adds version management link to admin navbar
