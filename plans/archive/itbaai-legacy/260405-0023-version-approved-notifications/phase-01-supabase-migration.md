---
title: "Phase 01 — Supabase Migration: user_version_reads"
status: pending
effort: 30m
---

# Phase 01 — Supabase Migration

## Context Links

- [Brainstorm report](../reports/brainstorm-260405-0013-version-approved-notifications.md)
- [plan.md](plan.md)
- Existing `versions` table used in `src/app/api/versions/route.ts`

## Overview

**Priority:** High (blocking Phase 2 & 3)
**Status:** Pending

Create a `user_version_reads` table to track which approved versions each user has seen. This replaces localStorage-based tracking for the new `version_approved` notification type.

## Key Insights

- Current `version_pending` notifications use localStorage (`SEEN_VERSION_IDS_KEY`) — that pattern stays for super_admin; the new table is only for `version_approved` read tracking
- The table is a simple junction table; no complex schema needed
- RLS must allow users to read/write only their own rows

## Requirements

### Functional
- Table stores (user_id, version_id, read_at) tuples
- Composite PK on (user_id, version_id) prevents duplicates
- Cascade delete when user or version is removed

### Non-functional
- Index on `user_id` for fast unread lookups
- RLS policies scoped to authenticated users' own rows

## Architecture

```
user_version_reads
├── user_id    UUID  FK → users(id) ON DELETE CASCADE
├── version_id UUID  FK → versions(id) ON DELETE CASCADE
├── read_at    TIMESTAMPTZ DEFAULT NOW()
└── PRIMARY KEY (user_id, version_id)
```

## Related Code Files

| File | Relevance |
|------|-----------|
| `src/app/api/versions/route.ts` | References `versions` table; same FK target |
| `src/lib/api/auth-helpers.ts` | `getAuthContext()` provides `userId` used for inserts |

## Implementation Steps

1. **Create migration SQL**

```sql
CREATE TABLE user_version_reads (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  version_id UUID NOT NULL REFERENCES versions(id) ON DELETE CASCADE,
  read_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, version_id)
);

-- Index for the unread query: WHERE user_id = $1
CREATE INDEX idx_user_version_reads_user ON user_version_reads(user_id);
```

2. **Add RLS policies**

```sql
ALTER TABLE user_version_reads ENABLE ROW LEVEL SECURITY;

-- Users can read their own rows
CREATE POLICY "Users can view own reads"
  ON user_version_reads FOR SELECT
  USING (user_id = (
    SELECT id FROM users WHERE auth_id = auth.uid()
  ));

-- Users can insert their own rows
CREATE POLICY "Users can mark versions read"
  ON user_version_reads FOR INSERT
  WITH CHECK (user_id = (
    SELECT id FROM users WHERE auth_id = auth.uid()
  ));

-- Service role can do everything (for admin operations)
-- (Supabase service role bypasses RLS by default, no policy needed)
```

3. **Run migration** via Supabase Dashboard SQL Editor or CLI

4. **Verify** — run a test SELECT with a user token to confirm RLS works

## Todo List

- [ ] Write migration SQL
- [ ] Execute migration in Supabase
- [ ] Verify table exists and columns are correct
- [ ] Verify RLS: user can SELECT own rows only
- [ ] Verify RLS: user can INSERT own rows only
- [ ] Verify CASCADE: deleting a version removes associated read rows

## Success Criteria

- Table `user_version_reads` exists with correct schema
- RLS policies prevent cross-user access
- Index `idx_user_version_reads_user` present
- Foreign key cascades work (delete version -> rows removed)

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| RLS policy references wrong column | Low | High | Test with non-super-admin token before proceeding |
| Migration conflicts with existing tables | Low | Medium | Table name is unique; no column changes to existing tables |

## Security Considerations

- RLS enforced — users cannot read or write other users' read states
- No sensitive data stored (only IDs + timestamp)
- CASCADE ensures no orphan rows

## Next Steps

- Phase 02 depends on this table existing
- Phase 03 depends on Phase 02's API
