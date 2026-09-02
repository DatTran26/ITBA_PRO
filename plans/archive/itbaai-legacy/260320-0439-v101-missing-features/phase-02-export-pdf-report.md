# Phase 2: Export PDF Report

## Priority: High | Status: Complete

## Overview

Add client-side PDF export to the Candidate Result Detail page. Generate a professional PDF report containing candidate info, score, AI analysis, notes, and pass/fail status.

## Requirements

- Install `jspdf` + `jspdf-autotable` for client-side PDF generation
- Create reusable PDF generation utility in `src/lib/generate-result-pdf.ts`
- Add "Export PDF" button to the result detail page header area
- PDF includes: candidate info, score, AI analysis, strengths/weaknesses, notes, pass/fail
- Clean, professional formatting suitable for internal reporting

## Implementation Steps

### Step 1: Install dependencies

```bash
npm install jspdf jspdf-autotable
npm install -D @types/jspdf
```

### Step 2: Create PDF generator — `src/lib/generate-result-pdf.ts`

Utility function that accepts result + test data and generates a PDF:

```typescript
export function generateResultPdf(result: ResultData, test: TestData): void {
    // 1. Header: candidate name, email, date, job role, level
    // 2. Score section: score/total, percentage, pass/fail status
    // 3. AI Analysis: overall assessment, strengths, weaknesses, recommendation
    // 4. Interviewer notes (if any)
    // 5. Question breakdown table (question, correct answer, candidate answer, result)
    // Download as: "Report - {candidate_name} - {job_role}.pdf"
}
```

### Step 3: Add Export button to result-detail-client.tsx

Add "Export PDF" button near the Pass/Fail decision area in the header card. Use FileDown icon from lucide-react.

## Files to Create

- `src/lib/generate-result-pdf.ts` — PDF generation utility (~100 LOC)

## Files to Modify

- `package.json` — Add jspdf + jspdf-autotable
- `src/app/dashboard/results/[id]/result-detail-client.tsx` — Add export button + import

## Success Criteria

- [x] PDF downloads on button click
- [x] PDF contains all required sections (candidate info, score, AI analysis, notes, status)
- [x] PDF is cleanly formatted and professional
- [x] No server-side endpoint needed (client-side generation)
- [x] Button shows loading state during generation
