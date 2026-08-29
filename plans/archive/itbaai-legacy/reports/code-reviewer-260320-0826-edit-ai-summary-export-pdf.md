# Code Review: Edit AI Summary + Export PDF Report

**Reviewer**: code-reviewer | **Date**: 2026-03-20 | **Commit**: 9acd13d

## Scope

- Files: 3 (route.ts, result-detail-client.tsx, generate-result-pdf.ts)
- LOC changed: ~380 added, ~30 removed
- Focus: security, logic correctness, edge cases, PDF completeness

## Overall Assessment

Solid implementation. Both features follow existing patterns well. The API validation is good, edit state management is correct, and the PDF utility is well-structured. Several medium-priority issues found, one high-priority.

---

## Critical Issues

None.

---

## High Priority

### H1. `ai_analysis` validation allows arbitrary keys — stored XSS / data pollution

**File**: `src/app/api/results/[id]/route.ts` lines 42-51

The `ai_analysis` field validates `recommendation` but accepts any other keys and values without restriction. An attacker can inject arbitrary JSON into the JSONB column — including keys like `__proto__`, excessively large strings, or HTML/script payloads that will be rendered in the client or PDF.

```typescript
// Current: only checks recommendation, accepts everything else
if ("ai_analysis" in body) {
    const analysis = body.ai_analysis;
    if (typeof analysis !== "object" || analysis === null) { ... }
    if (analysis.recommendation && !VALID_RECOMMENDATIONS.includes(analysis.recommendation)) { ... }
    updateFields.ai_analysis = analysis; // <-- anything else passes through
}
```

**Fix**: Whitelist and validate every field:

```typescript
if ("ai_analysis" in body) {
    const analysis = body.ai_analysis;
    if (typeof analysis !== "object" || analysis === null || Array.isArray(analysis)) {
        return NextResponse.json({ error: "Invalid ai_analysis value" }, { status: 400 });
    }
    // Whitelist fields and validate types
    const sanitized: Record<string, unknown> = {};
    if (typeof analysis.overall_assessment === "string") {
        sanitized.overall_assessment = analysis.overall_assessment.substring(0, 5000);
    }
    if (Array.isArray(analysis.strengths)) {
        sanitized.strengths = analysis.strengths.filter((s: unknown) => typeof s === "string").map((s: string) => s.substring(0, 500));
    }
    if (Array.isArray(analysis.weaknesses)) {
        sanitized.weaknesses = analysis.weaknesses.filter((w: unknown) => typeof w === "string").map((w: string) => w.substring(0, 500));
    }
    if (analysis.recommendation && VALID_RECOMMENDATIONS.includes(analysis.recommendation)) {
        sanitized.recommendation = analysis.recommendation;
    }
    if (typeof analysis.detail_note === "string") {
        sanitized.detail_note = analysis.detail_note.substring(0, 5000);
    }
    updateFields.ai_analysis = sanitized;
}
```

### H2. `updateFields` typed as `Record<string, string>` but receives object for `ai_analysis`

**File**: `src/app/api/results/[id]/route.ts` line 20

```typescript
const updateFields: Record<string, string> = {};
// ...
updateFields.ai_analysis = analysis; // analysis is an object, not string
```

This is a type lie. TypeScript doesn't catch it at runtime but it misrepresents the data shape. Should be:

```typescript
const updateFields: Record<string, unknown> = {};
```

---

## Medium Priority

### M1. GET endpoint has no auth check — relies solely on RLS

**File**: `src/app/api/results/[id]/route.ts` lines 72-95

The `GET` handler does not call `supabase.auth.getUser()`. It depends entirely on RLS policies. While the RLS policy `results_select_own` uses `USING (true)`, meaning any authenticated or anonymous user can read any result by ID. This is by design for the candidate flow, but the API route is publicly accessible without auth verification, which means anyone with a result UUID can fetch full test data including correct answers.

**Risk**: Low in practice (UUIDs are unguessable), but worth noting for audit purposes. Consider adding an auth check to the GET endpoint in the dashboard API if correctness data should be restricted.

### M2. File size: `result-detail-client.tsx` is 1141 lines

Per project rules, files should be under 200 lines. This file is 5.7x over the limit. The AI analysis edit section alone adds ~100 lines of JSX. Consider extracting:
- `AiAssessmentCard` component (edit + display mode)
- `CandidateHeader` component (score ring + info + decision buttons)
- `QuestionBreakdown` component

### M3. PDF export is synchronous — blocks UI thread

**File**: `result-detail-client.tsx` lines 294-306

`generateResultPdf` is synchronous. For large tests (100 questions), jsPDF + autoTable table rendering could freeze the UI. The `setIsExporting(true)` state never actually renders a spinner because React doesn't get a chance to paint before the synchronous work completes.

**Fix**: Wrap in `requestAnimationFrame` or `setTimeout(..., 0)` to allow React to paint the loading state:

```typescript
const handleExportPdf = useCallback(() => {
    setIsExporting(true);
    // Allow React to paint spinner before blocking
    requestAnimationFrame(() => {
        try {
            generateResultPdf(...);
            toast.success("PDF downloaded");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "PDF export failed");
        } finally {
            setIsExporting(false);
        }
    });
}, [result, aiAnalysis, candidateStatus, noteBullets, test]);
```

### M4. PDF markdown stripping is naive

**File**: `generate-result-pdf.ts` line 208

```typescript
const cleanText = q.question_text.replace(/[*_`#>]/g, "").substring(0, 80);
```

This removes individual characters, not markdown syntax. A question like `What does `Array.map()` do?` becomes `What does Array.map() do?` (correct), but `**bold**` becomes `bold` while `> blockquote\ntext` becomes ` blockquotetext`. Consider using a proper markdown-to-plaintext strip or at minimum handle common patterns:

```typescript
const cleanText = q.question_text
    .replace(/```[\s\S]*?```/g, "[code]")   // code blocks
    .replace(/`([^`]+)`/g, "$1")             // inline code
    .replace(/\*\*([^*]+)\*\*/g, "$1")       // bold
    .replace(/\*([^*]+)\*/g, "$1")           // italic
    .replace(/^>\s?/gm, "")                  // blockquotes
    .replace(/^#{1,6}\s/gm, "")              // headings
    .replace(/\n/g, " ")                     // newlines
    .substring(0, 80);
```

### M5. Division by zero in percentage calculation

**File**: `result-detail-client.tsx` line 158 and `generate-result-pdf.ts` line 138

```typescript
const percentage = Math.round((result.score / result.total_questions) * 100);
```

If `total_questions` is 0 (edge case: test with no questions, or corrupted data), this produces `NaN` which propagates through the SVG circle dasharray and all conditional logic. Add a guard:

```typescript
const percentage = result.total_questions > 0
    ? Math.round((result.score / result.total_questions) * 100)
    : 0;
```

---

## Low Priority

### L1. `detail_note` field not editable in UI

The `Analysis` interface includes `detail_note?: string` but the edit form does not expose it. If it contains data from AI generation, editing and saving will silently preserve whatever was there (good), but the user cannot modify it. Not a bug, just a completeness gap.

### L2. Hardcoded locale `"vi-VN"` in PDF

**File**: `generate-result-pdf.ts` lines 112, 124

The locale is hardcoded. Consider accepting it as a parameter or using `Intl.DateTimeFormat().resolvedOptions().locale` for portability if the platform is used outside Vietnam.

### L3. Edit mode allows saving empty strengths/weaknesses arrays

The UI allows removing all strengths and saving an empty array. This is technically valid but may cause confusion when the AI Analysis section then shows nothing under "Strengths". Consider requiring at least one item or showing a placeholder.

---

## Edge Cases Found by Scout

1. **Concurrent edit race**: If two recruiters edit the same result's AI analysis simultaneously, last-write-wins with no conflict detection. Acceptable for MVP.
2. **Analysis edit during re-analysis**: If a recruiter clicks "Edit" on AI analysis while a background re-analysis is running (triggered by page load when `!result.ai_analysis`), the `isAnalyzing` flag prevents this — correctly handled.
3. **PDF with null answers array**: `result.answers?.find(...)` and fallback to `result.answers?.[idx]` handles null safely. Good.
4. **Empty candidate name in PDF filename**: `safeName` could be empty string after regex replace if name is all special characters. Would produce `Report -  - Backend.pdf`. Edge case but harmless.

---

## Positive Observations

- Clean deep-clone via `JSON.parse(JSON.stringify(...))` for edit state isolation
- Proper optimistic-then-confirm pattern on save (updates local state only after API success)
- Good use of `useCallback` throughout to prevent unnecessary re-renders
- `VALID_RECOMMENDATIONS` and `VALID_STATUSES` constants shared conceptually between client/server
- PDF sanitizes filename characters to prevent filesystem issues
- RLS UPDATE policy properly scoped to recruiter's own tests
- Error handling consistent: try/catch with toast feedback on every async action

---

## Recommended Actions (Priority Order)

1. **[H1]** Whitelist and sanitize `ai_analysis` fields in PATCH handler
2. **[H2]** Fix `updateFields` type to `Record<string, unknown>`
3. **[M3]** Wrap PDF generation in `requestAnimationFrame` for spinner visibility
4. **[M5]** Guard against `total_questions === 0` division
5. **[M2]** Extract sub-components from 1141-line file (next refactor cycle)
6. **[M4]** Improve markdown stripping for PDF question text

---

## Metrics

- Type Coverage: Good (interfaces defined, one type lie at H2)
- Test Coverage: Not evaluated (no test files for these features)
- Linting Issues: 1 existing `eslint-disable` for `any` cast (line 455-456, pre-existing)
- Build: Passes with zero TypeScript errors (per user)
