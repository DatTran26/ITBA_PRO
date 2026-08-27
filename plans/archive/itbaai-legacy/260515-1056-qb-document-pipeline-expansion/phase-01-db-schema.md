---
phase: 1
title: "DB Schema: documents table + versioning"
status: pending
effort: 1h
blocks: [2, 3, 4, 5]
---

# Phase 1 — DB Schema: documents table + versioning

## Context Links
- Existing migration: `supabase/migrations/20260513000000_question_bank_foundation.sql`
- Topic migration: `supabase/migrations/20260514000000_document_topics.sql`
- `document_sources` schema: `document_sources.format` CHECK `('pdf','docx','txt','url')`
- Role pattern from existing policies: `('leader','admin','super_admin')`

## Overview

Introduce a `documents` table representing the **canonical document library**. Each library entry can have multiple pipeline runs (`document_sources`). Add versioning columns to `document_sources` to support diff/merge flow. Add `user_oauth_tokens` table for Google OAuth storage.

## Architecture

### Data Model

```
documents (library record)
  id, team_id, title, file_type, storage_path, drive_file_id,
  drive_modified_time, source_type ('upload'|'google_drive'),
  uploaded_by, created_at, updated_at

document_sources (pipeline run — existing, extended)
  + document_id FK → documents.id (nullable for backward compat)
  + version_number INTEGER DEFAULT 1
  + parent_run_id FK → document_sources.id (nullable; points to previous run for diff)

user_oauth_tokens
  id, user_id FK → users.id, provider ('google'), access_token (encrypted),
  refresh_token (encrypted), expires_at, scope, created_at, updated_at
```

### Why Separate `documents` from `document_sources`

`document_sources` is a **pipeline run record** — ephemeral, one per upload/trigger. `documents` is the **canonical library entity** — persists across re-imports and version updates. This lets multiple runs reference the same document without data duplication.

### Backward Compatibility

`document_id` column on `document_sources` is **nullable** — existing rows have NULL, pipeline still works unchanged. New pipeline runs populate it.

## Requirements

**Functional**
- `documents` table with team scoping via `team_id`
- Source type: `upload` | `google_drive` (allows future extension)
- `file_type`: `pdf` | `docx` | `txt` | `md` (md maps to txt format in pipeline)
- Soft-delete pattern: `deleted_at TIMESTAMPTZ NULL` (admin recovers within 30 days)
- `document_sources.version_number` increments on each re-process
- `user_oauth_tokens`: stores encrypted tokens per user per provider

**Non-functional**
- All new tables have RLS enabled
- Indexes on FK columns and `team_id`
- `updated_at` auto-trigger on `documents`

## Related Code Files

**Create**
- `supabase/migrations/20260515000000_document_library.sql`

**No changes to existing files in this phase**

## Implementation Steps

1. Create migration file `supabase/migrations/20260515000000_document_library.sql`
2. Define `documents` table with columns:
   ```sql
   id UUID PK, team_id UUID REFERENCES teams(id), title TEXT NOT NULL,
   file_type VARCHAR CHECK ('pdf','docx','txt','md'),
   storage_path TEXT, drive_file_id TEXT, drive_modified_time TIMESTAMPTZ,
   source_type VARCHAR NOT NULL CHECK ('upload','google_drive'),
   uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
   deleted_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
   ```
3. Add `document_id UUID REFERENCES documents(id) ON DELETE SET NULL` to `document_sources` (nullable, no CHECK change)
4. Add `version_number INTEGER NOT NULL DEFAULT 1` to `document_sources`
5. Add `parent_run_id UUID REFERENCES document_sources(id) ON DELETE SET NULL` to `document_sources`
6. Define `user_oauth_tokens` table:
   ```sql
   id UUID PK, user_id UUID REFERENCES users(id) ON DELETE CASCADE,
   provider VARCHAR NOT NULL DEFAULT 'google',
   access_token TEXT, refresh_token TEXT, expires_at TIMESTAMPTZ,
   scope TEXT, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now(),
   UNIQUE(user_id, provider)
   ```
7. Enable RLS on `documents` and `user_oauth_tokens`
8. Write RLS policies:
   - `documents SELECT`: authenticated user in same team OR admin/super_admin
   - `documents INSERT`: role IN ('leader','admin','super_admin') AND uploaded_by = current user
   - `documents UPDATE`: uploaded_by = current user OR admin/super_admin
   - `documents DELETE`: soft-delete only (set deleted_at); hard DELETE for admin/super_admin
   - `user_oauth_tokens`: user_id = current user only (full CRUD own row)
9. Create indexes: `idx_documents_team_id`, `idx_documents_uploaded_by`, `idx_documents_source_type`, `idx_document_sources_document_id`
10. Add `update_documents_updated_at` trigger (same pattern as existing triggers)
11. Verify: `ALTER TABLE document_sources ADD COLUMN IF NOT EXISTS` for idempotency

## Todo List

- [ ] Create `supabase/migrations/20260515000000_document_library.sql`
- [ ] Define `documents` table
- [ ] Alter `document_sources` — add `document_id`, `version_number`, `parent_run_id`
- [ ] Define `user_oauth_tokens` table
- [ ] Enable RLS + write policies for all 3 tables/changes
- [ ] Add indexes
- [ ] Add `updated_at` auto-trigger for `documents`
- [ ] Verify migration is idempotent (`IF NOT EXISTS`, `IF NOT EXISTS` on columns)
- [ ] Run `supabase db diff` locally to confirm no unintended changes

## Success Criteria

- Migration applies cleanly on fresh DB and on existing DB with data
- `document_sources` existing rows unaffected (document_id = NULL, version_number = 1)
- `SELECT * FROM documents LIMIT 1` returns expected columns
- RLS blocks cross-user access in psql test
- `user_oauth_tokens` UNIQUE constraint prevents duplicate provider per user

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `teams` table may not exist / different name | Medium | High | Check `20260310000000_init_schema.sql` before writing FK; use nullable if uncertain |
| `user_oauth_tokens` tokens stored as plain text | High | High | Use `pgcrypto` or Supabase Vault; at minimum, confirm encryption approach before implementing |
| Breaking existing RLS on `document_sources` with new columns | Low | Medium | New columns are nullable — no existing SELECT/INSERT policies affected |

## Unresolved Questions

- Does `teams` table exist? If scoping is by department instead, adjust `team_id` FK target.
- Is Supabase Vault available on current project tier for `pgp_sym_encrypt`? If not, fallback to app-level encryption before insert.
