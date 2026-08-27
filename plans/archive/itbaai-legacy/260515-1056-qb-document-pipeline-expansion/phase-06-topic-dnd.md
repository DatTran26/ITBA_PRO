---
phase: 6
title: "Topic Drag-and-Drop Merge/Split UI"
status: pending
effort: 2h
blockedBy: [2]
blocks: [7]
---

# Phase 6 — Topic Drag-and-Drop Merge/Split UI

## Context Links
- Existing panel: `src/components/question-bank/topic-review-panel.tsx`
- Existing card: `src/components/question-bank/topic-card.tsx`
- Existing key-points editor: `src/components/question-bank/topic-key-points-editor.tsx`
- Types: `src/components/question-bank/question-bank-types.ts` — `DocumentTopic` interface
- Pipeline tab: `src/app/dashboard/question-bank/question-bank-ai-pipeline-tab.tsx` (renders topic review step)
- @dnd-kit/core: **absent from package.json** — must install before starting

## Overview

Extend the topic review panel with drag-and-drop interactions:
- **Merge**: drag one topic card onto another → combine into a single topic (AI or manual)
- **Split**: drag a key point chip out of a topic → promote it to a new standalone topic

This is a purely client-side UI enhancement. No new API routes or DB tables are required; the existing `PATCH /api/document-sources/[id]/topics` endpoint (or equivalent topic-update route) handles persistence once the user confirms.

## Architecture

### Data Flow

```
TopicReviewPanel (modified)
  ├── DndContext (from @dnd-kit/core) wrapping all topic cards
  │
  ├── SortableContext → TopicCard[] (sortable by order_index)
  │
  └── On drag-end event:
        case: topic dropped onto topic → openMergeConfirmDialog(source, target)
        case: key-point dropped onto blank zone → openSplitConfirmDialog(keyPoint, parentTopic)

MergeConfirmDialog (NEW)
  ├── Shows source + target topic titles
  ├── Merged title field (pre-filled: "{source} + {target}")
  ├── Merged key_points list (union of both, user can deselect)
  └── Confirm → POST /api/document-sources/[runId]/topics/merge
                  body: { sourceId, targetId, mergedTitle, mergedKeyPoints }
              → on success: update local state (remove source, update target)

SplitConfirmDialog (NEW)
  ├── Shows key point text being split out
  ├── New topic title field (pre-filled: keyPoint text, truncated)
  └── Confirm → POST /api/document-sources/[runId]/topics/split
                  body: { parentTopicId, keyPointIndex, newTopicTitle }
              → on success: update local state (remove key point from parent, add new topic)
```

### New API Routes

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/document-sources/[id]/topics/merge` | Merge two topics into one |
| POST | `/api/document-sources/[id]/topics/split` | Split a key point into a new topic |

Both routes operate on `document_topics` rows. No new tables needed.

### Merge Logic (server-side)

```
POST /api/document-sources/[id]/topics/merge
  body: { sourceId, targetId, mergedTitle, mergedKeyPoints: string[] }

1. Auth check (leader/admin owns the document_sources run)
2. Verify sourceId and targetId both belong to document_sources.id = [id]
3. UPDATE document_topics SET title=mergedTitle, key_points=mergedKeyPoints WHERE id=targetId
4. DELETE FROM document_topics WHERE id=sourceId
5. Return { mergedTopic: DocumentTopic }
```

### Split Logic (server-side)

```
POST /api/document-sources/[id]/topics/split
  body: { parentTopicId, keyPointIndex, newTopicTitle }

1. Auth check
2. Fetch parent topic → validate keyPointIndex in bounds
3. Remove key_points[keyPointIndex] from parent array
4. UPDATE parent topic with new key_points[]
5. INSERT new document_topics row: {
     document_id: [id],
     title: newTopicTitle,
     summary: '',
     key_points: [removedKeyPoint],
     order_index: (max existing order_index + 1),
     is_approved: false
   }
6. Return { updatedParent: DocumentTopic, newTopic: DocumentTopic }
```

### DnD Interaction Design

**Merge drop target detection**: each `TopicCard` is both a draggable source and a droppable target. When `active.id !== over.id` and both are topic IDs (not key-point IDs) → merge intent.

**Split drag source**: key point chips within a `TopicCard` are separate draggable items with ID pattern `kp-{topicId}-{index}`. When `over` is the `SplitDropZone` (a drop target outside all cards) → split intent.

**SortableContext** handles reorder (existing or new order_index tracking). This is the simple dnd-kit sortable preset — no custom sensors needed.

### Component Tree (after Phase 6)

```
TopicReviewPanel (modified)
  └── DndContext
        ├── SortableContext
        │     └── TopicCard[] (modified — key-point chips become draggable)
        ├── MergeDropZone (overlay on each card when dragging a topic)
        ├── SplitDropZone (fixed zone at bottom: "Drop key point to create new topic")
        ├── MergeConfirmDialog (NEW, ≤ 100 lines)
        └── SplitConfirmDialog (NEW, ≤ 80 lines)
```

## Requirements

**Functional**
- Drag topic card onto another topic card → merge confirmation dialog opens
- Drag key point chip outside its parent card → split confirmation dialog opens
- Merge dialog: pre-filled merged title (editable), combined key_points checklist (all checked by default), confirm/cancel
- Split dialog: pre-filled new topic title from key point text (editable), confirm/cancel
- On confirm: optimistic UI update (remove source/key-point immediately), then API call; revert on error
- Drag reordering of topic cards (updates `order_index` via existing or new PATCH endpoint)
- Keyboard accessibility: ESC closes dialogs; focus trap inside dialogs
- `unchanged` topics from Phase 5 diff view cannot be dragged (they are read-only display rows)

**Non-functional**
- Install `@dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities` (three packages; peer-reviewed stable)
- `TopicReviewPanel` must stay ≤ 200 lines — extract `MergeConfirmDialog` and `SplitConfirmDialog` into separate files
- No global state change — DnD state is local to `TopicReviewPanel`

## Dependencies to Install

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

No type packages needed — @dnd-kit ships with TypeScript declarations.

## Related Code Files

**Create**
- `src/app/api/document-sources/[id]/topics/merge/route.ts`
- `src/app/api/document-sources/[id]/topics/split/route.ts`
- `src/components/question-bank/merge-confirm-dialog.tsx`
- `src/components/question-bank/split-confirm-dialog.tsx`
- `src/components/question-bank/split-drop-zone.tsx`

**Modify**
- `src/components/question-bank/topic-review-panel.tsx` — wrap with `DndContext`, add drag handlers, render dialogs
- `src/components/question-bank/topic-card.tsx` — wrap with `useSortable`; make key-point chips `useDraggable`
- `src/components/question-bank/question-bank-types.ts` — no type changes needed (DocumentTopic already has `key_points: string[]`)

## Implementation Steps

1. Install deps: `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`

2. Create `src/app/api/document-sources/[id]/topics/merge/route.ts`:
   - POST, auth check (owner/leader/admin), verify both topic IDs belong to this run
   - UPDATE target topic, DELETE source topic
   - Return merged topic JSON
   - ≤ 60 lines

3. Create `src/app/api/document-sources/[id]/topics/split/route.ts`:
   - POST, auth check
   - Fetch parent → mutate key_points array → UPDATE parent → INSERT new topic
   - Return `{ updatedParent, newTopic }`
   - ≤ 70 lines

4. Create `src/components/question-bank/merge-confirm-dialog.tsx`:
   - Props: `source: DocumentTopic`, `target: DocumentTopic`, `onConfirm(merged: MergePayload): void`, `onCancel: () => void`
   - Editable merged title input (shadcn `Input`)
   - Key points checklist (shadcn `Checkbox` per item)
   - ≤ 100 lines

5. Create `src/components/question-bank/split-confirm-dialog.tsx`:
   - Props: `keyPointText: string`, `onConfirm(newTitle: string): void`, `onCancel: () => void`
   - Editable new topic title input
   - ≤ 80 lines

6. Create `src/components/question-bank/split-drop-zone.tsx`:
   - Uses `useDroppable({ id: 'split-zone' })`
   - Visual: dashed border box at bottom of topic list, label "Drop key point here to create new topic"
   - Highlights on hover (isOver)
   - ≤ 40 lines

7. Modify `src/components/question-bank/topic-card.tsx`:
   - Import `useSortable` (for card reorder) and `useDraggable` (for key point chips)
   - Key point chips: add `cursor-grab`, wrap with draggable context using ID `kp-{topicId}-{index}`
   - Add `isOver` drop highlight (green border) when another topic is dragged over this card
   - Keep ≤ 200 lines; extract key-point chip to inline sub-component if needed

8. Modify `src/components/question-bank/topic-review-panel.tsx`:
   - Import `DndContext`, `DragEndEvent`, `DragOverlay` from `@dnd-kit/core`
   - Import `SortableContext`, `verticalListSortingStrategy` from `@dnd-kit/sortable`
   - Add state: `pendingMerge: {source, target} | null`, `pendingSplit: {keyPoint, parentTopic} | null`
   - `handleDragEnd`: detect merge vs split vs reorder intent
   - Render `MergeConfirmDialog` when `pendingMerge !== null`
   - Render `SplitConfirmDialog` when `pendingSplit !== null`
   - Render `SplitDropZone` below topic list
   - On merge confirm: optimistic remove source + update target in local `topics` state, POST merge API
   - On split confirm: optimistic remove key point + add new topic, POST split API
   - ≤ 200 lines (extract dialogs to own files — already planned)

## Todo List

- [ ] Install `@dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
- [ ] Create `topics/merge/route.ts`
- [ ] Create `topics/split/route.ts`
- [ ] Create `merge-confirm-dialog.tsx`
- [ ] Create `split-confirm-dialog.tsx`
- [ ] Create `split-drop-zone.tsx`
- [ ] Modify `topic-card.tsx` — sortable + key-point draggable
- [ ] Modify `topic-review-panel.tsx` — DndContext + drag handlers + dialog renders
- [ ] Test: drag topic onto topic → merge dialog appears → confirm → source removed, target updated
- [ ] Test: drag key point outside → split dialog → confirm → new topic created with 1 key point
- [ ] Test: drag reorder → order_index updated (if reorder API is wired)
- [ ] Verify keyboard accessibility (ESC closes dialogs)

## Success Criteria

- Dragging a topic card and dropping it on another card opens `MergeConfirmDialog`
- Confirming merge: source topic disappears, target topic has merged title and combined key points
- Dragging a key point chip into `SplitDropZone` opens `SplitConfirmDialog`
- Confirming split: key point removed from parent, new topic card appears in list
- Canceling either dialog: no state change
- Optimistic UI: changes appear immediately; revert on API error with toast notification
- No regression to existing topic approval workflow (checkboxes, approve/reject still work)

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| @dnd-kit/core conflicts with existing framer-motion animations | Low | Low | dnd-kit and framer-motion are independent; apply `transform` only during drag |
| Key-point chip hit area too small for drag on touch devices | Medium | Low | Add `TouchSensor` to `DndContext` sensors list; increase chip min-height to 32px |
| Merge API partially fails (UPDATE succeeds, DELETE fails) | Low | Medium | Wrap UPDATE + DELETE in Supabase RPC transaction |
| `TopicCard` grows beyond 200 lines after adding sortable/draggable hooks | Medium | Low | Extract key-point chip render to `KeyPointChip` sub-component inline or separate file |
| Accidental merge when user intends to reorder | Medium | Low | Require drag-over target to be held for 300ms before activating merge (pointer sensor delay) |

## Unresolved Questions

- Should reorder (sort) persist to DB immediately on drop, or only on "Confirm topics" button? Recommend: immediate persist (PATCH order_index on drag-end) — keeps UI consistent.
- Should merge generate an AI-improved merged summary (extra OpenAI call) or just concatenate? Recommend: concatenate for MVP (YAGNI). AI merge can be added in a future iteration.
