# Phase 7: Reports & Export

## Context Links

- [Brainstorm Report](../reports/brainstorm-260326-2322-admin-role-and-version-management.md)
- [Existing PDF Generator](../../src/lib/generate-result-pdf.ts) (uses `jspdf` + `jspdf-autotable`)
- [Results Detail Client](../../src/app/dashboard/results/[id]/result-detail-client.tsx)
- [Skills List Client](../../src/app/dashboard/skills/skills-list-client.tsx)

## Overview

- **Priority**: P2
- **Status**: pending
- **Effort**: 6h

Admin-only export functionality for candidates, results, and skills data in CSV, Excel, and PDF formats. CSV uses native streaming. Excel uses `exceljs` with formatted sheets. PDF uses `@react-pdf/renderer` for styled reports.

## Key Insights

- Existing `generate-result-pdf.ts` uses `jspdf` + `jspdf-autotable` for individual result PDFs — keep this for single-result export
- New PDF export uses `@react-pdf/renderer` for multi-record styled reports (list views, summaries)
- Excel export via `exceljs` — supports styled headers, auto-width columns, multiple sheets
- CSV is simplest — native `TextEncoder` + streaming, no external deps
- Export is admin-only (admin can export all data; recruiter cannot export bulk data)
- Export types: candidates (results), skills coverage, assessment summaries
- API route pattern: `/api/export/[type]?format=csv|excel|pdf`

## Requirements

### Functional
- 3 export utilities: CSV, Excel, PDF
- API route: `/api/export/[type]` where type = `candidates`, `results`, `skills`
- Query param `format`: `csv`, `excel`, `pdf`
- Admin-only access enforcement
- Export buttons on: results list area, skills list page, admin dashboard
- CSV: streaming text/csv response with Content-Disposition header
- Excel: formatted .xlsx with headers, styling, auto-width
- PDF: styled multi-page report with branded header, colored tables

### Non-functional
- Large datasets: stream CSV, paginate Excel/PDF
- Dynamic imports for `exceljs` and `@react-pdf/renderer` (reduce bundle)
- Max 1000 rows per export to prevent memory issues

## Architecture

### Export Flow

```
Export Button (UI)
      │
      ▼
GET /api/export/[type]?format=csv&...filters
      │
      ├── requireAdmin()
      ├── Fetch data from Supabase
      ├── Format with appropriate exporter
      └── Return file as streaming response

Exporters:
├── csv-export.ts  → text/csv stream
├── excel-export.ts → application/vnd.openxmlformats (exceljs)
└── pdf-export.ts  → application/pdf (@react-pdf/renderer)
```

### Interfaces

```typescript
interface ExportColumn {
  key: string;
  header: string;
  width?: number;
  format?: (value: unknown) => string;
}

interface ExportOptions {
  title: string;
  columns: ExportColumn[];
  data: Record<string, unknown>[];
  metadata?: { generatedBy: string; date: string };
}
```

### Export Types & Columns

**Candidates/Results Export** (`/api/export/candidates`):
- candidate_name, candidate_email, test (job_role + level), score, total_questions, percentage, status, submitted_at

**Skills Export** (`/api/export/skills`):
- skill_name, category, description, positions_using (count), avg_evaluation_score

**Assessment Summary Export** (`/api/export/results`):
- test_title, job_role, level, total_submissions, pass_count, fail_count, avg_score, created_at

## Related Code Files

### Files to Create
- `D:\Projects\Git Private\ITBAAI\src\lib\export\csv-export.ts`
- `D:\Projects\Git Private\ITBAAI\src\lib\export\excel-export.ts`
- `D:\Projects\Git Private\ITBAAI\src\lib\export\pdf-export.ts`
- `D:\Projects\Git Private\ITBAAI\src\app\api\export\[type]\route.ts`

### Files to Modify
- `D:\Projects\Git Private\ITBAAI\src\app\dashboard\dashboard-client.tsx` — add export button (admin-only)
- `D:\Projects\Git Private\ITBAAI\src\app\dashboard\skills\skills-list-client.tsx` — add export button (admin-only)

### New Packages
- `exceljs` — Excel generation
- `@react-pdf/renderer` — PDF generation

## Implementation Steps

### Step 1: Install packages

```bash
npm install exceljs @react-pdf/renderer
```

### Step 2: CSV export utility

**`src/lib/export/csv-export.ts`**:

```typescript
import type { ExportOptions } from "./types";

export function generateCsv(options: ExportOptions): string {
  const { columns, data } = options;
  const header = columns.map((c) => `"${c.header}"`).join(",");
  const rows = data.map((row) =>
    columns.map((c) => {
      const val = c.format ? c.format(row[c.key]) : String(row[c.key] ?? "");
      return `"${val.replace(/"/g, '""')}"`;
    }).join(",")
  );
  return [header, ...rows].join("\n");
}
```

### Step 3: Excel export utility

**`src/lib/export/excel-export.ts`**:

```typescript
// Dynamic import: const ExcelJS = (await import("exceljs")).default;
// Create workbook + worksheet
// Style header row: bold, colored background, auto-filter
// Auto-width columns based on content
// Return workbook.xlsx.writeBuffer()
```

Key implementation details:
- Header row: bold white text on dark blue (#1E2840) background
- Alternating row colors for readability
- Number columns right-aligned
- Date columns formatted as locale string
- Auto-filter on header row

### Step 4: PDF export utility

**`src/lib/export/pdf-export.ts`**:

```typescript
// Dynamic import: const { renderToBuffer, Document, Page, ... } = await import("@react-pdf/renderer");
// Build React component tree → render to buffer
// Branded header: ITBA logo text, report title, generated date
// Table with styled rows: header bg, alternating row colors
// Footer: page numbers
```

Key implementation details:
- Page size: A4 landscape for wide tables
- Header: "ITBA AI — {Report Title}" with date
- Table header: dark blue bg, white text
- Body rows: alternating white/light gray
- Max rows per page: ~30 (auto-pagination by @react-pdf/renderer)
- Footer: "Page X of Y"

### Step 5: Export API route

**`src/app/api/export/[type]/route.ts`**:

```typescript
// GET handler
// Params: type = "candidates" | "results" | "skills"
// Query: format = "csv" | "excel" | "pdf"
// Optional: date filters, status filters

export async function GET(
  request: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  const ctx = await requireAdmin();
  if (ctx instanceof NextResponse) return ctx;

  const { type } = await params;
  const url = new URL(request.url);
  const format = url.searchParams.get("format") || "csv";

  // Fetch data based on type
  // Format with appropriate exporter
  // Return response with correct Content-Type and Content-Disposition
}
```

Content-Type headers:
- CSV: `text/csv; charset=utf-8`
- Excel: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- PDF: `application/pdf`

### Step 6: Add export buttons to UI

Add export dropdown buttons (admin-only) to:
- Dashboard client: "Export Results" with format selector
- Skills list: "Export Skills" with format selector

Pattern:
```tsx
{isAdmin && (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="outline" size="sm">
        <Download className="w-4 h-4 mr-2" /> Export
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuItem onClick={() => handleExport("csv")}>CSV</DropdownMenuItem>
      <DropdownMenuItem onClick={() => handleExport("excel")}>Excel</DropdownMenuItem>
      <DropdownMenuItem onClick={() => handleExport("pdf")}>PDF Report</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
)}
```

Export handler: `window.open('/api/export/candidates?format=csv', '_blank')`

## Todo List

- [ ] Install `exceljs` and `@react-pdf/renderer`
- [ ] Create shared export types in `src/lib/export/types.ts` (if needed)
- [ ] Create `src/lib/export/csv-export.ts`
- [ ] Create `src/lib/export/excel-export.ts`
- [ ] Create `src/lib/export/pdf-export.ts`
- [ ] Create `src/app/api/export/[type]/route.ts`
- [ ] Add export buttons to dashboard-client.tsx (admin-only)
- [ ] Add export buttons to skills-list-client.tsx (admin-only)
- [ ] Test: CSV export downloads valid file
- [ ] Test: Excel export has formatted headers and data
- [ ] Test: PDF export renders styled report
- [ ] Test: non-admin gets 403 on export API

## Success Criteria

- Admin can export candidates, results, skills in CSV/Excel/PDF
- CSV file opens correctly in spreadsheet apps
- Excel file has styled headers, auto-width, alternating rows
- PDF has branded header, colored table, page numbers
- Non-admin gets 403 on export API
- Export buttons only visible to admin users
- Dynamic imports keep bundle size reasonable

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| `@react-pdf/renderer` large bundle | Medium | Dynamic import — only loaded when PDF requested |
| PDF generation memory for large datasets | Low | Limit to 1000 rows; paginate |
| `exceljs` SSR compatibility | Low | Server-only (API route) — no browser bundle issue |
| Export timeout for large datasets | Medium | Limit rows, stream CSV, set `maxDuration` on route |

## Security Considerations

- All export endpoints use `requireAdmin()` — admin-only
- No export of raw `ai_analysis` jsonb (may contain sensitive AI insights)
- Export includes only display-ready columns
- File downloads authenticated via same-origin cookies

## Next Steps

- Phase 8 (Admin Dashboard) can reuse export buttons for dashboard-level exports
- Phase 9 (Navigation) can add Export section to admin menu
