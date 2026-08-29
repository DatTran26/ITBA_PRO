---
phase: 5
title: "Version Diff + AI Merge"
status: pending
effort: 2.5h
blockedBy: [3, 4]
blocks: [7]
---

# Phase 5 — Version Diff + AI Merge

## Context Links
- Existing edge function: `supabase/functions/extract-document-topics/index.ts`
- Existing topic extractor: `supabase/functions/extract-document-topics/topic-extractor.ts`
- `document_topics` schema: `supabase/migrations/20260514000000_document_topics.sql`
- `document_sources.parent_run_id` FK: defined in Phase 1 (links new run to previous run)
- `documents.drive_modified_time`: updated after successful diff+merge confirms new version
- Freshness endpoint: `GET /api/documents/[id]/drive-freshness` (Phase 4)

## Overview

When a leader triggers "Update" on a document (re-upload or Drive new version), the system:
1. Creates a new pipeline run (`document_sources` row) with `parent_run_id` pointing to the previous run
2. Invokes a new edge function `diff-document-version` that:
   - Fetches old topics from `document_topics` (via `parent_run_id`)
   - Extracts topics from new document content
   - Uses AI to classify each old/new topic as: `added | modified | removed | unchanged`
3. Returns a structured diff proposal
4. UI shows color-coded diff panel; leader approves/rejects each change
5. On confirm: applies approved changes to `document_topics` and updates `documents.drive_modified_time`

## Architecture

### Data Flow

```
User clicks "Update Document" (from library card banner or manual trigger)
  → POST /api/documents/[id]/update-version
      body: { file?: FormData } | { driveRefetch: true }
    → fetch new content (re-download from Drive OR accept new file upload)
    → extract text (Phase 2 module)
    → insert new document_sources row (parent_run_id = previous run id, version_number++)
    → invoke edge function diff-document-version { newDocumentSourceId }
    → return { newRunId }

Client polls GET /api/document-sources/[newRunId] for status
  → status: pending → processing → topics_ready (diff complete) | failed

On topics_ready:
  → GET /api/documents/[id]/diff-proposal?runId={newRunId}
    → returns { added[], modified[], removed[], unchanged[] }
  → VersionDiffPanel renders color-coded proposal
  → User approves/rejects each item
  → POST /api/documents/[id]/apply-diff
      body: { runId, approvedChanges: DiffApproval[] }
    → apply changes to document_topics
    → update documents.drive_modified_time (if Drive source)
    → mark newRunId document_sources status = 'done'
```

### Edge Function: `diff-document-version`

Deno — no Node.js. Inputs via POST body: `{ newDocumentSourceId: string }`.

```
1. Fetch newDocumentSourceId row → get parent_run_id
2. Fetch old topics from document_topics WHERE document_id = parent_run_id's document_source_id
   (actually: WHERE document_id = old document_sources.id — clarify join below)
3. Extract topics from new document text (same AI call as extract-document-topics)
4. AI diff prompt: given old_topics[] and new_topics[], classify each as added/modified/removed/unchanged
5. Insert new topics into document_topics (for the new document_sources row) with diff_status field
6. Update document_sources status = 'topics_ready'
```

**DB join clarification**: `document_topics.document_id` references `document_sources.id` (not `documents.id`). The old run is `parent_run_id`; old topics are `WHERE document_id = parent_run_id`.

### DB Addendum for Phase 1 (coordinate)

Add `diff_status VARCHAR NULL CHECK ('added','modified','removed','unchanged')` column to `document_topics`. NULL = normal topic (not from diff flow).

### Diff Classification AI Prompt Strategy

Single OpenAI call with both old and new topic lists as JSON. Ask the model to return a structured JSON array with `old_topic_id | null`, `new_topic`, and `status`. Cheaper than two separate calls.

### UI Component Tree

```
VersionDiffPanel (NEW)
  ├── DiffSectionHeader ("3 added, 1 modified, 2 removed")
  ├── DiffTopicRow[] (NEW, one per changed topic)
  │     ├── status badge (green=Added, yellow=Modified, red=Removed)
  │     ├── topic title + summary preview
  │     └── approve/reject toggle
  └── "Apply N approved changes" button → POST apply-diff
```

## Requirements

**Functional**
- Diff covers: `added` (new topic not in old), `modified` (title/summary/key_points changed), `removed` (old topic absent in new), `unchanged` (shown as info, no action needed)
- Leader can approve individual changes selectively (e.g. accept added topics, reject removed ones)
- On apply: approved `added` → insert new `document_topics`; approved `modified` → UPDATE existing; approved `removed` → DELETE existing; rejected = keep old state
- `unchanged` topics are never deleted regardless
- After apply: `documents.drive_modified_time` updated (Drive sources only)
- After apply: existing `question_bank` questions linked via `topic_tag` are NOT auto-deleted (YAGNI — manual cleanup)

**Non-functional**
- New edge function file ≤ 200 lines (split into `diff-generator.ts` if needed)
- API routes follow existing pattern: `getAuthContext`, `isLeader || isAdmin`
- Diff proposal stored ephemerally in `document_topics` (diff_status column); no separate diff table needed

## Related Code Files

**Create**
- `supabase/functions/diff-document-version/index.ts`
- `supabase/functions/diff-document-version/diff-generator.ts`
- `src/app/api/documents/[id]/update-version/route.ts`
- `src/app/api/documents/[id]/diff-proposal/route.ts`
- `src/app/api/documents/[id]/apply-diff/route.ts`
- `src/components/question-bank/version-diff-panel.tsx`
- `src/components/question-bank/version-diff-topic-row.tsx`

**Modify**
- `supabase/migrations/` — add `diff_status` column to `document_topics` (new migration `20260515000001_document_topics_diff_status.sql`)
- `src/components/question-bank/question-bank-types.ts` — extend `DocumentTopic` with `diff_status?: string | null`
- `src/components/question-bank/document-library-card.tsx` (Phase 3) — wire "Update" button to trigger `update-version`

## Implementation Steps

1. Create migration `supabase/migrations/20260515000001_document_topics_diff_status.sql`:
   - `ALTER TABLE document_topics ADD COLUMN IF NOT EXISTS diff_status VARCHAR CHECK (diff_status IN ('added','modified','removed','unchanged'));`

2. Create `supabase/functions/diff-document-version/diff-generator.ts`:
   - `generateDiff(oldTopics: TopicRow[], newTopics: ExtractedTopic[], openaiApiKey: string): Promise<DiffResult[]>`
   - Single OpenAI chat completion call with structured JSON output
   - Parse response; validate each item has a valid `status`
   - ≤ 120 lines

3. Create `supabase/functions/diff-document-version/index.ts`:
   - Accept `{ newDocumentSourceId }`
   - Fetch new doc_source row → get `parent_run_id`
   - Fetch old topics WHERE `document_id = parent_run_id`
   - Extract text from new doc (using `preExtractedText` from `documents.extracted_text` if available)
   - Extract new topics via `extractTopics` (reuse from existing `topic-extractor.ts`)
   - Call `generateDiff`
   - Insert new topics into `document_topics` with `document_id = newDocumentSourceId` and `diff_status` set
   - Update `document_sources` status = `topics_ready`
   - ≤ 150 lines

4. Create `src/app/api/documents/[id]/update-version/route.ts`:
   - POST — auth check
   - Accept `{ driveRefetch: true }` OR `file` in FormData
   - If Drive: call `downloadFileBytes` (Phase 4) → extract text
   - If file upload: extract text via Phase 2 module
   - Fetch latest `document_sources` row for this document → use as `parent_run_id`
   - Insert new `document_sources` row (`version_number = prev + 1`, `parent_run_id`)
   - Invoke `diff-document-version` edge function (fire-and-forget)
   - Return `{ newRunId }`

5. Create `src/app/api/documents/[id]/diff-proposal/route.ts`:
   - GET with `?runId=...`
   - Query `document_topics WHERE document_id = runId AND diff_status IS NOT NULL`
   - Also fetch old topics WHERE `document_id = parent_run_id` for `unchanged` list
   - Return `{ added[], modified[], removed[], unchanged[] }`

6. Create `src/app/api/documents/[id]/apply-diff/route.ts`:
   - POST `{ runId, approvedChanges: { topicId: string; action: 'keep'|'reject' }[] }`
   - For each approved `added`: copy from new run's topics to parent run (or mark permanent)
   - For each approved `modified`: UPDATE parent run's topic with new values
   - For each approved `removed`: DELETE from parent run's topics
   - Update `documents.drive_modified_time` if Drive source
   - Mark `newRunId` document_sources status = `done`
   - Return `{ applied: number }`

7. Create `src/components/question-bank/version-diff-topic-row.tsx`:
   - Props: `topic: DocumentTopic`, `status: DiffStatus`, `approved: boolean`, `onToggle: () => void`
   - Color-coded left border: green=added, yellow=modified, red=removed
   - ≤ 80 lines

8. Create `src/components/question-bank/version-diff-panel.tsx`:
   - Fetches `GET /api/documents/[id]/diff-proposal?runId=...` on mount
   - Renders four sections with `VersionDiffTopicRow` lists
   - Local state for approval toggles
   - "Apply changes" button → POST `apply-diff`
   - On success: call `onDiffApplied()` callback
   - ≤ 180 lines

9. Update `DocumentTopic` in `question-bank-types.ts` — add `diff_status?: 'added'|'modified'|'removed'|'unchanged'|null`

## Todo List

- [ ] Create migration for `diff_status` column
- [ ] Create `diff-generator.ts` edge function module
- [ ] Create `diff-document-version/index.ts` edge function
- [ ] Create `update-version/route.ts`
- [ ] Create `diff-proposal/route.ts`
- [ ] Create `apply-diff/route.ts`
- [ ] Create `version-diff-topic-row.tsx`
- [ ] Create `version-diff-panel.tsx`
- [ ] Extend `DocumentTopic` type with `diff_status`
- [ ] Wire "Update" button on `document-library-card.tsx`
- [ ] Test: update Drive doc → diff proposal shown → approve changes → old topics updated

## Success Criteria

- Re-importing a modified document generates a diff proposal with correct status classifications
- Leader can selectively approve/reject changes; "unchanged" topics always preserved
- After apply: `document_topics` reflects only approved changes
- `documents.drive_modified_time` updated post-apply for Drive sources
- `unchanged` classification costs zero DB writes
- UI color-coding: green/yellow/red clearly distinguishable per design tokens in DESIGN.md

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| AI diff classification is inaccurate (hallucinates status) | Medium | Medium | Validate each returned status is in enum; default to 'modified' if unclear |
| Old topics and new topics have mismatched order — AI can't reliably match | Medium | Medium | Match by title similarity first (exact or fuzzy); pass both lists with stable IDs |
| `apply-diff` is non-atomic — partial failure leaves inconsistent state | Low | High | Wrap all DB mutations in a single Supabase RPC transaction function |
| Diff panel re-fetching when parent run not yet complete | High | Low | Poll `document_sources` status before opening diff panel (same pattern as existing poller) |
| Conflicts if user edits existing topics while diff is pending | Low | Medium | Lock topic editing (disable edit buttons) while a pending diff run exists |

## Unresolved Questions

- Should `unchanged` topics in the new run be inserted into `document_topics` (for the new `document_sources` row) or only referenced from the old run? Recommend: insert copies — keeps each pipeline run self-contained.
- Define "modified" threshold: any change to title, summary, OR key_points? Or only title/summary? Recommend: any field change = modified.
