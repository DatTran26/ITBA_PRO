---
phase: 7
title: "Wire Everything Together"
status: pending
effort: 1.5h
blockedBy: [3, 4, 5, 6]
blocks: []
---

# Phase 7 — Wire Everything Together

## Context Links
- QB AI Pipeline tab: `src/app/dashboard/question-bank/question-bank-ai-pipeline-tab.tsx`
- Document library card: `src/components/question-bank/document-library-card.tsx` (Phase 3)
- Document source selector: `src/components/question-bank/document-source-selector.tsx` (Phase 3)
- Google Drive picker: `src/components/question-bank/google-drive-picker.tsx` (Phase 4)
- Version diff panel: `src/components/question-bank/version-diff-panel.tsx` (Phase 5)
- Topic review panel: `src/components/question-bank/topic-review-panel.tsx` (Phase 6)
- Existing upload form: `src/components/question-bank/document-upload-form.tsx`
- Status poller: `src/components/question-bank/document-status-poller.tsx`

## Overview

Connect all prior phases into the QB AI Pipeline tab. This phase makes NO new architectural decisions — it only wires existing Phase 3–6 outputs together, replaces the existing `<DocumentUploadForm>` with `<DocumentSourceSelector>`, and adds conditional rendering for Drive freshness banners and version diff UI.

This phase also performs final integration smoke-testing and resolves any cross-phase type mismatches.

## Architecture

### Updated AiStep State Machine

Existing steps (unchanged):
```
"upload" → "polling_topics" → "topic-review" → "generating" → "question-review" → "done"
```

New branching steps added:
```
"upload"          — now renders DocumentSourceSelector (Upload New | From Library)
"polling_topics"  — unchanged; also used while diff-document-version runs (Phase 5)
"topic-review"    — now TopicReviewPanel wrapped with DndContext (Phase 6)
"diff-review"     — NEW: shown when user clicks "Update" on a stale Drive document
                        renders VersionDiffPanel; on apply-diff → transitions back to "topic-review"
```

Full updated machine:
```
"upload" → handleUploadSuccess(documentId) → "polling_topics"
         → handleLibrarySelect(documentId) → "polling_topics"      [Phase 3]
         → handleDriveImport(documentId)   → "polling_topics"      [Phase 4]

"polling_topics" → topics_ready → "topic-review"
                 → failed → "upload" (reset with error)

"topic-review"   → handleGenerateQuestions() → "generating"
                 → (no change; Phase 6 DnD is internal to TopicReviewPanel)

"diff-review"    → handleDiffApplied()  → "topic-review"           [Phase 5]
                 → handleDiffCanceled() → "upload"

"generating"     → done → "question-review"
"question-review" → done → "done"
```

### Data Flow

```
QuestionBankAiPipelineTab
  │
  ├── step === "upload"
  │     └── DocumentSourceSelector
  │           ├── "Upload New" tab → DocumentUploadForm (existing, onSuccess → handleUploadSuccess)
  │           ├── "From Library" tab → DocumentLibraryPanel
  │           │     └── DocumentLibraryCard[]
  │           │           ├── onSelect(id) → handleLibrarySelect(id)
  │           │           └── onUpdate(id) → handleUpdateDocument(id) [stale Drive doc]
  │           └── GoogleDrivePicker (within DocumentLibraryPanel's "Import from Drive" button)
  │                 └── onImported(id) → handleDriveImport(id)
  │
  ├── step === "polling_topics"
  │     └── DocumentStatusPoller (existing)
  │           └── onTopicsReady(runId) → setStep("topic-review")
  │
  ├── step === "topic-review"
  │     └── TopicReviewPanel (with DndContext from Phase 6)
  │           └── onApprove(topicIds[]) → handleGenerateQuestions(topicIds)
  │
  ├── step === "diff-review"
  │     └── VersionDiffPanel
  │           ├── onDiffApplied() → setStep("topic-review") (re-fetch topics for new run)
  │           └── onCancel()      → setStep("upload")
  │
  ├── step === "generating"
  │     └── GenerationProgressPoller (existing)
  │
  └── step === "question-review" | "done"
        └── AiQuestionsReview (existing)
```

### Library Card "New Version Available" Banner Integration

`DocumentLibraryCard` (Phase 3) shows a "New version available" banner for stale Drive docs. Clicking "Update" in the banner triggers:

```
handleUpdateDocument(documentId):
  1. POST /api/documents/[id]/update-version { driveRefetch: true }
  2. setNewRunId(response.newRunId)
  3. setStep("polling_topics")  ← polls diff-document-version completion
  4. On topics_ready: setStep("diff-review")  ← show VersionDiffPanel instead of TopicReviewPanel
```

Distinguishing diff-review from normal topic-review: add `isDiffRun: boolean` state. Set `true` when transitioning from "update" flow; `false` for normal upload/library flows.

## Requirements

**Functional**
- `<DocumentUploadForm>` replaced by `<DocumentSourceSelector>` in `question-bank-ai-pipeline-tab.tsx`
- Library document selection triggers pipeline run (same polling flow)
- Drive import triggers pipeline run (same polling flow)
- Stale Drive document "Update" → diff polling → diff review → (on apply) topic review
- Topic DnD (Phase 6) available in `topic-review` step without any additional wiring (already inside `TopicReviewPanel`)
- Back button in `diff-review` step cancels diff and returns to upload step
- All existing flows (upload → topics → questions) unaffected

**Non-functional**
- `question-bank-ai-pipeline-tab.tsx` must stay ≤ 200 lines; extract handlers to `use-ai-pipeline-state.ts` hook if needed
- No prop drilling beyond 2 levels; use callbacks

## Related Code Files

**Modify**
- `src/app/dashboard/question-bank/question-bank-ai-pipeline-tab.tsx`
  - Replace `<DocumentUploadForm>` with `<DocumentSourceSelector>`
  - Add `"diff-review"` step to `AiStep` union type
  - Add `isDiffRun` state + `newRunId` state
  - Add `handleLibrarySelect`, `handleDriveImport`, `handleUpdateDocument` handlers
  - Add `handleDiffApplied`, `handleDiffCanceled` handlers
  - Add conditional render of `<VersionDiffPanel>` in diff-review step

**No new files** — all components were created in prior phases.

## Implementation Steps

1. Read current `question-bank-ai-pipeline-tab.tsx` to confirm exact line counts and import structure before editing.

2. Extend `AiStep` type:
   ```ts
   type AiStep = "upload" | "polling_topics" | "topic-review" | "diff-review" | "generating" | "question-review" | "done";
   ```

3. Add state variables:
   ```ts
   const [isDiffRun, setIsDiffRun] = useState(false);
   const [diffRunId, setDiffRunId] = useState<string | null>(null);
   ```

4. Add handlers:
   ```ts
   handleLibrarySelect(documentId: string)  → setDocumentId(documentId); setStep("polling_topics");
   handleDriveImport(documentId: string)    → setDocumentId(documentId); setStep("polling_topics");
   handleUpdateDocument(documentId: string) → call update-version API → setDiffRunId(newRunId); setIsDiffRun(true); setStep("polling_topics");
   handleDiffApplied()                      → setIsDiffRun(false); setDiffRunId(null); setStep("topic-review");
   handleDiffCanceled()                     → setIsDiffRun(false); setDiffRunId(null); setStep("upload");
   ```

5. Modify polling completion handler: when `topics_ready` and `isDiffRun === true` → `setStep("diff-review")` instead of `"topic-review"`.

6. Replace in JSX:
   ```tsx
   // Before:
   {step === "upload" && <DocumentUploadForm onSuccess={handleUploadSuccess} />}

   // After:
   {step === "upload" && (
     <DocumentSourceSelector
       onSuccess={handleUploadSuccess}
       onLibrarySelect={handleLibrarySelect}
       onDriveImport={handleDriveImport}
       onUpdateDocument={handleUpdateDocument}
     />
   )}
   ```

7. Add diff-review render:
   ```tsx
   {step === "diff-review" && diffRunId && (
     <VersionDiffPanel
       documentId={documentId!}
       runId={diffRunId}
       onDiffApplied={handleDiffApplied}
       onCancel={handleDiffCanceled}
     />
   )}
   ```

8. If file exceeds 200 lines after edits: extract state + handlers to `src/app/dashboard/question-bank/use-ai-pipeline-state.ts` custom hook. Tab file becomes a pure render component.

9. Run `rtk tsc` — fix any TypeScript errors from type union changes.

10. Run `rtk next build` — confirm no build errors.

## Todo List

- [ ] Read `question-bank-ai-pipeline-tab.tsx` current line count
- [ ] Extend `AiStep` union with `"diff-review"`
- [ ] Add `isDiffRun`, `diffRunId` state
- [ ] Add `handleLibrarySelect`, `handleDriveImport`, `handleUpdateDocument` handlers
- [ ] Add `handleDiffApplied`, `handleDiffCanceled` handlers
- [ ] Modify polling completion to branch on `isDiffRun`
- [ ] Replace `<DocumentUploadForm>` with `<DocumentSourceSelector>`
- [ ] Add `<VersionDiffPanel>` render for diff-review step
- [ ] Extract to `use-ai-pipeline-state.ts` hook if file > 200 lines
- [ ] Run `rtk tsc` — zero type errors
- [ ] Run `rtk next build` — clean build
- [ ] End-to-end smoke test: upload → topics → questions (existing flow unaffected)
- [ ] End-to-end smoke test: library select → pipeline run
- [ ] End-to-end smoke test: Drive import → pipeline run (requires Phase 4 env vars set)
- [ ] End-to-end smoke test: stale Drive doc → update → diff review → apply → topic review

## Success Criteria

- Existing upload → topics → questions flow works identically to before
- Library document selection creates a new pipeline run and enters polling step
- Drive import (if env vars configured) creates a pipeline run and enters polling step
- "Update" on a stale Drive doc triggers diff flow; `VersionDiffPanel` is shown
- After applying diff, user is returned to `topic-review` step with fresh topics loaded
- `question-bank-ai-pipeline-tab.tsx` ≤ 200 lines (or extracted to hook)
- `rtk tsc` reports zero errors
- `rtk next build` completes without error

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `DocumentSourceSelector` prop interface mismatch with Phase 3 implementation | Medium | Medium | Agree on `onSuccess`, `onLibrarySelect`, `onDriveImport` prop names in Phase 3 spec; Phase 7 follows that contract |
| `AiStep` type extension breaks existing switch/case exhaustiveness checks | Low | Low | TypeScript will flag unhandled cases at compile time — treat as guidance, not blocker |
| `isDiffRun` state not reset on navigation away then back | Low | Medium | Reset all state in `handleReset()` (already called on step="upload" transitions) |
| Phase 3–6 components not yet implemented when Phase 7 starts | High | High | Phase 7 is blocked on 3+4+5+6; do not start until all prior phase todos are checked off |

## Unresolved Questions

- None — all architectural decisions were made in Phases 1–6. Phase 7 is pure wiring.
