---
phase: 6
title: "AI Pipeline Tab Redesign"
status: pending
effort: "M"
---

# Phase 6: AI Pipeline Tab Redesign

## Context Links

- Plan overview: `plans/260514-2phase-ai-document-pipeline/plan.md`
- Phase 05 (UI Topic Review Components): `plans/260514-2phase-ai-document-pipeline/phase-05-ui-topic-review-components.md`
- Phase 04 (API Routes): `plans/260514-2phase-ai-document-pipeline/phase-04-api-routes-for-topics.md`
- Tab entrypoint: `src/app/dashboard/question-bank/question-bank-ai-pipeline-tab.tsx`
- Job poller (old): `src/components/question-bank/job-status-poller.tsx`
- Questions review: `src/components/question-bank/ai-questions-review.tsx`
- Types: `src/components/question-bank/question-bank-types.ts`

## Overview

**Priority:** P2  
**Status:** Pending (depends on Phase 05)  
**Description:** Wire the 2-pass AI pipeline into the existing AI Pipeline tab by replacing the 4-state machine with a 6-state machine, creating a new `document-status-poller.tsx` component that polls `document_sources.status` (needed for both passes since Pass 1 creates no job row), and grouping questions by `topic_tag` in `ai-questions-review.tsx`.

## Key Insights

- `job-status-poller.tsx` polls `/api/document-sources/[id]/job` — only works after Pass 2 creates a job row. Pass 1 (topic extraction) never creates a job row, so a separate `document-status-poller.tsx` is needed that polls `document_sources.status` directly.
- `ai-questions-review.tsx` already renders `topic_tag` as a badge per question — only group-by logic and section headers need to be added; individual card layout is unchanged.
- `TopicReviewPanel` from Phase 05 handles `approvedTopicIds` selection — the tab just needs to receive them via `onGenerateQuestions(approvedTopicIds)` callback.
- Both polling states (`polling_topics` and `generating`) can reuse the same `DocumentStatusPoller` component with different trigger conditions passed as props.

## Requirements

**Functional:**
- Upload → extract topics → leader reviews/edits → generate questions → review questions → done
- Polling for Pass 1: wait for `status === "topics_ready"`
- Polling for Pass 2: wait for `status === "done"`, then load job to get `result_json`
- Failed state in either pass: show error, allow reset to upload
- "Upload Another Document" resets all state

**Non-functional:**
- Poll interval: 3 000 ms (same as existing job poller)
- No loading flicker between state transitions
- Questions review must render grouped by topic; existing per-card layout unchanged

## Architecture

```
question-bank-ai-pipeline-tab.tsx   (state machine controller)
│
├── "upload"          → DocumentUploadForm(onSuccess)
├── "polling_topics"  → DocumentStatusPoller(targetStatus="topics_ready", onReached, onFailed)
├── "topic-review"    → TopicReviewPanel(documentId, onGenerateQuestions)
├── "generating"      → DocumentStatusPoller(targetStatus="done", onReached, onFailed)
├── "question-review" → AiQuestionsReview(documentId, questions, onApproved)
└── "done"            → success screen

DocumentStatusPoller
  → polls GET /api/document-sources/[id] every 3s
  → calls onReached() when status === targetStatus
  → calls onFailed(message) when status === "failed"

AiQuestionsReview
  → groups questions[] by topic_tag
  → renders <section> per group with <h3> header + count badge
  → individual question card layout unchanged
```

## Related Code Files

**Modify:**
- `src/app/dashboard/question-bank/question-bank-ai-pipeline-tab.tsx`
- `src/components/question-bank/ai-questions-review.tsx`

**Create:**
- `src/components/question-bank/document-status-poller.tsx`

**Read for context:**
- `src/components/question-bank/job-status-poller.tsx` (reference implementation)
- `src/components/question-bank/question-bank-types.ts` (AiQuestion, DocumentSource types)
- `src/components/question-bank/topic-review-panel.tsx` (Phase 05 output)

## Implementation Steps

### Step 1 — Create `document-status-poller.tsx`

Create `src/components/question-bank/document-status-poller.tsx`:

```typescript
"use client";

import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

interface DocumentStatusPollerProps {
  documentId: string;
  targetStatus: string;
  onReached: () => void;
  onFailed: (message: string) => void;
  label?: string;
}

export function DocumentStatusPoller({
  documentId,
  targetStatus,
  onReached,
  onFailed,
  label = "Processing…",
}: DocumentStatusPollerProps) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/document-sources/${documentId}`);
        if (!res.ok) return;
        const data = await res.json();
        const status: string = data.status ?? "";
        if (status === targetStatus) {
          clearInterval(intervalRef.current!);
          onReached();
        } else if (status === "failed") {
          clearInterval(intervalRef.current!);
          onFailed(data.error_message ?? "Processing failed.");
        }
      } catch {
        // network hiccup — keep polling
      }
    };

    intervalRef.current = setInterval(poll, 3_000);
    poll(); // immediate first check

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [documentId, targetStatus, onReached, onFailed]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-[#8B99B0]">
      <Loader2 className="h-8 w-8 animate-spin text-[#7C8FFF]" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
```

> Requires `GET /api/document-sources/[id]` route to return `{ status, error_message? }`. Add this lightweight route in Phase 04 if missing, or verify it exists. The route must be accessible to org members.

### Step 2 — Rewrite `question-bank-ai-pipeline-tab.tsx`

Replace the file entirely:

```typescript
"use client";

import { useState, useCallback } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DocumentUploadForm } from "@/components/question-bank/document-upload-form";
import { DocumentStatusPoller } from "@/components/question-bank/document-status-poller";
import { TopicReviewPanel } from "@/components/question-bank/topic-review-panel";
import { AiQuestionsReview } from "@/components/question-bank/ai-questions-review";
import type { AiQuestion } from "@/components/question-bank/question-bank-types";

type AiStep =
  | "upload"
  | "polling_topics"
  | "topic-review"
  | "generating"
  | "question-review"
  | "done";

export function QuestionBankAiPipelineTab() {
  const [step, setStep] = useState<AiStep>("upload");
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<AiQuestion[]>([]);
  const [approvedCount, setApprovedCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleUploadSuccess = useCallback((id: string) => {
    setDocumentId(id);
    setErrorMessage(null);
    setStep("polling_topics");
  }, []);

  const handleTopicsReady = useCallback(() => {
    setStep("topic-review");
  }, []);

  const handleGenerateQuestions = useCallback(
    async (approvedTopicIds: string[]) => {
      if (!documentId) return;
      setStep("generating");
      try {
        await fetch(`/api/document-sources/${documentId}/generate-questions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approvedTopicIds }),
        });
      } catch {
        setErrorMessage("Failed to start question generation.");
        setStep("topic-review");
      }
    },
    [documentId]
  );

  const handleGeneratingDone = useCallback(async () => {
    if (!documentId) return;
    try {
      const res = await fetch(`/api/document-sources/${documentId}/job`);
      if (res.ok) {
        const job = await res.json();
        const qs: AiQuestion[] = job.result_json?.questions ?? [];
        setQuestions(qs);
        setStep("question-review");
      } else {
        setErrorMessage("Questions generated but failed to load.");
        setStep("upload");
      }
    } catch {
      setErrorMessage("Failed to load generated questions.");
      setStep("upload");
    }
  }, [documentId]);

  const handleFailed = useCallback((msg: string) => {
    setErrorMessage(msg);
    setStep("upload");
  }, []);

  const handleApproved = useCallback((count: number) => {
    setApprovedCount(count);
    setStep("done");
  }, []);

  const handleReset = useCallback(() => {
    setStep("upload");
    setDocumentId(null);
    setQuestions([]);
    setApprovedCount(0);
    setErrorMessage(null);
  }, []);

  return (
    <div className="space-y-6">
      {errorMessage && (
        <div className="rounded-md border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-400">
          {errorMessage}
        </div>
      )}

      {step === "upload" && (
        <DocumentUploadForm onSuccess={handleUploadSuccess} />
      )}

      {step === "polling_topics" && documentId && (
        <DocumentStatusPoller
          documentId={documentId}
          targetStatus="topics_ready"
          onReached={handleTopicsReady}
          onFailed={handleFailed}
          label="Extracting topics from document…"
        />
      )}

      {step === "topic-review" && documentId && (
        <TopicReviewPanel
          documentId={documentId}
          onGenerateQuestions={handleGenerateQuestions}
        />
      )}

      {step === "generating" && documentId && (
        <DocumentStatusPoller
          documentId={documentId}
          targetStatus="done"
          onReached={handleGeneratingDone}
          onFailed={handleFailed}
          label="Generating questions from approved topics…"
        />
      )}

      {step === "question-review" && documentId && (
        <AiQuestionsReview
          documentId={documentId}
          questions={questions}
          onApproved={handleApproved}
        />
      )}

      {step === "done" && (
        <div className="flex flex-col items-center gap-6 py-16">
          <CheckCircle2 className="h-12 w-12 text-[#10B981]" />
          <p className="text-lg font-medium text-[#ECF0F7]">
            {approvedCount} question{approvedCount !== 1 ? "s" : ""} added to
            the question bank
          </p>
          <Button
            variant="outline"
            className="border-[#5A6882] text-[#8B99B0] hover:border-[#7C8FFF] hover:text-[#ECF0F7]"
            onClick={handleReset}
          >
            Upload Another Document
          </Button>
        </div>
      )}
    </div>
  );
}
```

### Step 3 — Add group-by-topic rendering to `ai-questions-review.tsx`

Read the current file first. Then add a grouping step before the render. The only changes are:

1. Add a `groupedByTopic` memo that partitions `questions` by `topic_tag` (null/undefined → group key `"Uncategorized"`).
2. Replace the flat `questions.map(…)` render with a `Object.entries(groupedByTopic).map(([tag, qs]) => <section>…</section>)` wrapper that prepends a `<h3>` header with the tag name and a count badge before each group.
3. Keep every individual question card exactly as-is.

Pseudo-diff:

```diff
+import { useMemo } from "react";

 // inside component, before return:
+const groupedByTopic = useMemo(() => {
+  return questions.reduce<Record<string, AiQuestion[]>>((acc, q) => {
+    const key = q.topic_tag ?? "Uncategorized";
+    (acc[key] ??= []).push(q);
+    return acc;
+  }, {});
+}, [questions]);

 // in JSX, replace flat list with:
+{Object.entries(groupedByTopic).map(([tag, qs]) => (
+  <section key={tag} className="space-y-3">
+    <div className="flex items-center gap-2">
+      <h3 className="text-sm font-semibold text-[#ECF0F7]">{tag}</h3>
+      <span className="rounded-full bg-[#1C2333] px-2 py-0.5 text-xs text-[#8B99B0]">
+        {qs.length}
+      </span>
+    </div>
+    {qs.map((q) => (
       // existing question card JSX unchanged
+    ))}
+  </section>
+))}
```

### Step 4 — Verify `GET /api/document-sources/[id]` route exists

`DocumentStatusPoller` requires a GET route that returns `{ status, error_message? }`. Check if it already exists or add to Phase 04's route file:

```typescript
// src/app/api/document-sources/[id]/route.ts
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createServiceClient();
  const { member } = await requireOrgRole(_req, ["leader", "admin"]);
  const { data, error } = await supabase
    .from("document_sources")
    .select("id, status, error_message")
    .eq("id", params.id)
    .eq("org_id", member.org_id)
    .single();
  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}
```

## Todo List

- [ ] Create `src/components/question-bank/document-status-poller.tsx`
- [ ] Rewrite `src/app/dashboard/question-bank/question-bank-ai-pipeline-tab.tsx` with 6-state machine
- [ ] Modify `src/components/question-bank/ai-questions-review.tsx` to group by `topic_tag`
- [ ] Verify or add `GET /api/document-sources/[id]` route
- [ ] TypeScript compile check: `rtk tsc --noEmit`
- [ ] Manual smoke test: upload → topics ready → review → generate → question review → approve → done

## Success Criteria

- [ ] Upload a document → spinner shows "Extracting topics…" → `TopicReviewPanel` renders when status hits `topics_ready`
- [ ] Leader edits topics → clicks Generate → spinner shows "Generating questions…" → questions appear grouped by `topic_tag`
- [ ] Failed extraction/generation shows error banner and resets to upload
- [ ] "Upload Another Document" clears all state
- [ ] No TypeScript errors
- [ ] Existing AI pipeline tab tests (if any) still pass

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| `GET /api/document-sources/[id]` missing | Add lightweight route in Step 4 |
| `TopicReviewPanel` props mismatch | Read Phase 05 output before implementing; adjust `onGenerateQuestions` signature if needed |
| `ai-questions-review.tsx` over 200 lines after changes | Extract `TopicQuestionsSection` sub-component if needed |
| `polling_topics` never resolves if edge fn crashes silently | Edge fn sets `status = "failed"` on catch — `DocumentStatusPoller` handles this |

## Security Considerations

- All API routes use `requireOrgRole` — poller receives only `{ status, error_message }`, no question content leaks
- `approvedTopicIds` validated server-side in Phase 04 route before invoking edge function

## Next Steps

- After Phase 06: end-to-end QA across all 6 phases
- Update `docs/codebase-summary.md` with new 2-pass pipeline architecture
- Deprecate / remove `job-status-poller.tsx` if no other consumers remain
