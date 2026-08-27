---
phase: 2
title: "Unified Page Redesign"
status: pending
priority: P1
effort: "2h"
dependencies: ["phase-01"]
---

# Phase 2: Unified Page Redesign

## Overview

Replace the current flat Overview-only `question-bank-client.tsx` with a unified page that hosts all four features as internal shadcn/ui `Tabs`. Eliminate all `router.push()` calls that navigate to the now-deleted sub-pages.

## Requirements

- Functional: One page at `/dashboard/question-bank` with tabs: Questions · Add Question · Bulk Import · AI Pipeline
- Functional: AI Pipeline tab must contain the full upload → poll → review → approve flow (previously split across two routes)
- Non-functional: No page reloads or route changes when switching tabs

## Architecture

### State Machine for AI Pipeline Tab

The previous flow used `router.push` to `/ai-pipeline/${documentId}` for the polling/review step. With the tab approach, maintain local state:

```
aiStep: "upload" | "polling" | "review" | "done"
aiDocumentId: string | null
aiQuestions: AiQuestion[] | null
```

Transitions:
- `DocumentUploadForm.onSuccess(id)` → set `aiStep = "polling"`, `aiDocumentId = id`
- `JobStatusPoller.onDone(job)` → set `aiStep = "review"`, `aiQuestions = job.result_json`
- `AiQuestionsReview.onApproved(count)` → set `aiStep = "done"` → after 1.5s refresh questions tab data

### Tab Layout

```
<Tabs defaultValue="questions">
  <TabsList> Questions | Add Question | Bulk Import | AI Pipeline </TabsList>
  <TabsContent value="questions">   ...table + filters + KPIs </TabsContent>
  <TabsContent value="add">         ...QuestionFormDialog inline, or button to open dialog </TabsContent>
  <TabsContent value="bulk-import"> ...instructions + download template + BulkImportDropzone + ImportResultReport </TabsContent>
  <TabsContent value="ai-pipeline"> ...upload/poll/review state machine </TabsContent>
</Tabs>
```

For the "Add Question" tab: render the form inline using a `<div>` wrapper rather than a modal dialog, OR keep the modal but auto-open it when the tab is selected. **Simpler approach:** keep `QuestionFormDialog` as a dialog and show an "Add Question" button within the tab content — consistent with existing UI pattern.

## Related Code Files

- Modify: `src/app/dashboard/question-bank/question-bank-client.tsx`
- No changes: `src/app/dashboard/question-bank/page.tsx` (props unchanged)
- No changes: `src/components/question-bank/` (all components reused as-is)

## Implementation Steps

1. **Add shadcn/ui Tabs import** to `question-bank-client.tsx`:
   ```ts
   import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
   ```

2. **Add AI pipeline state** to component state block:
   ```ts
   type AiStep = "upload" | "polling" | "review" | "done";
   const [aiStep, setAiStep] = useState<AiStep>("upload");
   const [aiDocumentId, setAiDocumentId] = useState<string | null>(null);
   const [aiQuestions, setAiQuestions] = useState<AiQuestion[] | null>(null);
   ```

3. **Add Bulk Import state**:
   ```ts
   const [importResult, setImportResult] = useState<ImportResult | null>(null);
   const [downloading, setDownloading] = useState(false);
   ```

4. **Add `downloadTemplate` function** (copy from deleted `import/page.tsx`):
   ```ts
   async function downloadTemplate() { ... fetch("/api/question-bank/template") ... }
   ```

5. **Restructure JSX** — wrap the body content in `<Tabs>`:
   - Keep the page header (title + description) ABOVE the tabs, outside `<Tabs>`
   - Keep `<KpiCardGrid>` inside the "questions" tab content only
   - Move `<FilterBar>` and `<QuestionBankTable>` into `<TabsContent value="questions">`
   - "Add Question" tab: show a centered button that opens `QuestionFormDialog` (reuse existing dialog state)
   - "Bulk Import" tab: replicate layout from `import/page.tsx` minus AppNavbar/PageBreadcrumb/PageContainer (already wrapped by parent)
   - "AI Pipeline" tab: state machine rendering

6. **Remove** the two `router.push` calls in the header buttons for Bulk Import and Add Question (lines 129 and 136 of current file). The tab triggers replace them.

7. **Add imports** for newly used components:
   ```ts
   import BulkImportDropzone from "@/components/question-bank/bulk-import-dropzone";
   import ImportResultReport from "@/components/question-bank/import-result-report";
   import DocumentUploadForm from "@/components/question-bank/document-upload-form";
   import JobStatusPoller from "@/components/question-bank/job-status-poller";
   import AiQuestionsReview from "@/components/question-bank/ai-questions-review";
   import type { ImportResult, AiQuestion, DocumentJob } from "@/components/question-bank/question-bank-types";
   import { FileDown, BrainCircuit, Plus, ArrowLeft } from "lucide-react";
   ```

8. **AI Pipeline tab rendering** — three sub-states:
   - `aiStep === "upload"`: render info card + `<DocumentUploadForm onSuccess={...} />`
   - `aiStep === "polling"`: render `<JobStatusPoller documentId={aiDocumentId!} onDone={...} onFailed={...} />`
   - `aiStep === "review"`: render `<AiQuestionsReview documentId={aiDocumentId!} questions={aiQuestions!} onApproved={...} />` + "New Upload" button to reset state
   - `aiStep === "done"`: render success message, auto-switch tab to "questions" after 1.5s

9. **After AI approve**: call `fetchData(...)` to refresh questions list, then switch to "questions" tab programmatically via a controlled `value` + `onValueChange` on `<Tabs>`.

10. **File size check**: if `question-bank-client.tsx` exceeds 200 lines after rewrite, split into:
    - `question-bank-questions-tab.tsx` — questions tab content
    - `question-bank-bulk-import-tab.tsx` — bulk import tab content
    - `question-bank-ai-pipeline-tab.tsx` — AI pipeline state machine tab

## Success Criteria

- [ ] `/dashboard/question-bank` renders 4 tabs: Questions, Add Question, Bulk Import, AI Pipeline
- [ ] Questions tab shows KPI cards + filter bar + paginated table (same as before)
- [ ] Add Question tab opens the form dialog for creating/editing
- [ ] Bulk Import tab: shows instructions, download template button, dropzone, result report
- [ ] AI Pipeline tab: upload → poll → review → approve all work within the single tab
- [ ] No `router.push` calls remain that point to deleted sub-pages
- [ ] Tabs are accessible: correct `aria-label`, keyboard navigation works

## Risk Assessment

Medium. The AI Pipeline tab merges two previously separate routes into one state machine. Key risk: `JobStatusPoller` was designed for a dedicated page; verify it doesn't require route context. Quick check: `job-status-poller.tsx` only needs `documentId` prop and `onDone`/`onFailed` callbacks — no router dependency.
