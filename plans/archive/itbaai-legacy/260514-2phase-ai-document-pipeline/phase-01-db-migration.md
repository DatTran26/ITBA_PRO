---
phase: 1
title: "DB Migration"
status: pending
priority: P1
effort: "1h"
dependencies: []
---

# Phase 1: DB Migration

## Overview

Create `document_topics` table and extend `document_sources` with `topics_extracted_at` column + new status values to support the 2-phase pipeline.

## Requirements

- Functional:
  - `document_topics` stores AI-extracted topics per document with full edit support
  - `document_sources.status` extended to include `extracting_topics`, `topics_ready`, `generating_questions`
  - `document_sources.topics_extracted_at` records when Pass 1 completed
- Non-functional:
  - Migration must be backward-compatible (existing rows unaffected)
  - Index on `document_topics(document_id)` for fast lookup

## Architecture

```
document_sources (existing)
  + topics_extracted_at TIMESTAMPTZ
  + status: now includes 'extracting_topics' | 'topics_ready' | 'generating_questions'

document_topics (new)
  id UUID PK
  document_id UUID FK → document_sources(id) ON DELETE CASCADE
  title TEXT NOT NULL
  summary TEXT
  key_points JSONB DEFAULT '[]'
  order_index INTEGER DEFAULT 0
  is_approved BOOLEAN DEFAULT true
  created_at / updated_at TIMESTAMPTZ
```

## Related Code Files

- Create: `supabase/migrations/20260514000000_document_topics.sql`

## Implementation Steps

1. Create migration file `supabase/migrations/20260514000000_document_topics.sql`:

```sql
-- New table for AI-extracted document topics
CREATE TABLE document_topics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES document_sources(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT,
  key_points JSONB DEFAULT '[]'::jsonb NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_approved BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_document_topics_document_id ON document_topics(document_id);

-- Extend document_sources
ALTER TABLE document_sources ADD COLUMN IF NOT EXISTS topics_extracted_at TIMESTAMPTZ;

-- Enable RLS
ALTER TABLE document_topics ENABLE ROW LEVEL SECURITY;

-- RLS policy: same org as document_sources (join through document_sources)
CREATE POLICY "Org members can view topics" ON document_topics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM document_sources ds
      WHERE ds.id = document_topics.document_id
        AND ds.org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Org members can manage topics" ON document_topics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM document_sources ds
      WHERE ds.id = document_topics.document_id
        AND ds.org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
    )
  );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ language 'plpgsql';

CREATE TRIGGER update_document_topics_updated_at
  BEFORE UPDATE ON document_topics
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
```

2. Apply migration: `supabase db push` (or via MCP `apply_migration`)
3. Verify tables exist and indexes are created

## Success Criteria

- [ ] `document_topics` table created with all columns and indexes
- [ ] `document_sources.topics_extracted_at` column added
- [ ] RLS policies in place
- [ ] Migration applies cleanly without errors
- [ ] Existing `document_sources` rows unaffected

## Risk Assessment

- RLS policy depends on `document_sources.org_id` and `profiles.org_id` — verify column names match existing schema before writing policy. If schema differs, adjust the subquery.
