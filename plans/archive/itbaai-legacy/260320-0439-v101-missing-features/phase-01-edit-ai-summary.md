# Phase 1: Edit AI Summary

## Priority: High | Status: Complete

## Overview

Add inline edit mode to the AI Assessment section on the Candidate Result Detail page. Allow interviewers to edit overall_assessment, strengths[], weaknesses[], and recommendation after AI generates them.

## Requirements

- Toggle edit/save/cancel on AI Assessment card
- Edit overall_assessment as textarea
- Edit strengths/weaknesses as editable list (add/remove items)
- Edit recommendation as dropdown (Recommend / Consider / Not Recommend)
- Save via PATCH /api/results/[id] with ai_analysis field
- Toast notifications on save/error
- AI summary must not overwrite interviewer-edited content

## Implementation Steps

### Step 1: Update API route — `src/app/api/results/[id]/route.ts`

Add `ai_analysis` to PATCH handler:

```typescript
// Handle ai_analysis field
if ("ai_analysis" in body) {
    if (typeof body.ai_analysis !== "object" || body.ai_analysis === null) {
        return NextResponse.json({ error: "Invalid ai_analysis" }, { status: 400 });
    }
    updateFields.ai_analysis = body.ai_analysis;
}
```

Update select to return ai_analysis.

### Step 2: Add edit UI to result-detail-client.tsx

In the AI Assessment section (lines 517-586):

- Add state: `isEditingAnalysis`, `editedAnalysis`
- Add Edit button in card header (next to "AI Assessment" title)
- In edit mode: replace display with editable fields
- Save/Cancel buttons in edit mode
- Handler: `handleSaveAnalysis` → PATCH with ai_analysis

### UI Design (edit mode)

- Overall assessment: `<Textarea>` replacing the `<p>` display
- Strengths: list of `<input>` fields + "Add" button, each with delete button
- Weaknesses: same pattern as strengths
- Recommendation: 3-button toggle (Recommend / Consider / Not Recommend)

## Files to Modify

- `src/app/api/results/[id]/route.ts` — Add ai_analysis to PATCH
- `src/app/dashboard/results/[id]/result-detail-client.tsx` — Add edit mode UI

## Success Criteria

- [x] Can toggle edit mode on AI Assessment
- [x] Can edit all 4 fields (overall_assessment, strengths, weaknesses, recommendation)
- [x] Changes persist after save (page reload shows edited values)
- [x] Cancel discards changes
- [x] Toast notifications for save success/error
