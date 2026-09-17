# Recruitment Management Report v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn PR 35's basic XLSX download into a permission-safe, scope-aware Recruitment Management Report v1 for HR/admin review.

**Architecture:** Add one typed report snapshot boundary shared by the JSON preview route and XLSX export route. A dedicated Supabase RPC computes exact scoped aggregates; a server loader fetches capped detail rows with the same scope; pure helpers own date validation, KPI semantics, labels, and action classification; the existing report page renders the snapshot and passes the same query parameters to export.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict mode, Supabase RPC/Postgres, ExcelJS, Gemini via `@google/genai`, Vitest for pure report tests.

**Spec:** `docs/superpowers/specs/2026-09-14-recruitment-management-report-design.md`

## Global Constraints

- Work only in the existing `develop-thanh` worktree and preserve all unrelated dirty files.
- Do not commit or push unless Thanh explicitly requests it; stage/report only when needed for inspection.
- `admin` and `super_admin` see the full recruitment scope; `hr` is restricted to `job_applications.created_by = ctx.userId`; `interviewer`, `recruiter`, and `leader` remain outside this v1 report.
- Every metric, aggregate, action, and detail row must use the same validated `from`, `to`, optional `jd_id`, optional `department`, and role owner scope.
- Date ranges accept `YYYY-MM-DD`, use the application timezone offset `+07:00`, reject inverted ranges and ranges over two years, and include both endpoints.
- Aggregate metrics represent the complete scoped set; detail rows are capped at 5,000 and must expose the exact count plus a truncation warning.
- Current pipeline metrics are labeled as current-state distributions; do not call them historical cohort conversion without status-history evidence.
- Candidate CV text, transcript, interviewer notes, and secrets never enter the management report or AI prompt.
- AI is advisory and non-blocking; missing key, quota, timeout, invalid response, or model failure must still produce a valid non-AI report.
- Run `npm run lint`, `npm run build`, and the report unit tests before claiming completion.

---

### Task 1: Add report contracts, scope validation, and pure KPI/action helpers

**Files:**
- Create: `Frontend/src/lib/recruitment/report.ts`
- Create: `Frontend/src/lib/recruitment/report.test.ts`
- Modify: `Frontend/package.json:7-13`
- Modify: `Frontend/package-lock.json` through the package manager only

**Interfaces:**
- Produces `ReportScope`, `ReportSnapshot`, `ReportMetrics`, `ReportBreakdown`, `ReportTrend`, `ReportApplication`, `ReportAction`, `normalizeReportScope`, `formatReportQuery`, `percentage`, `isReportRole`, `getStatusLabel`, and `classifyReportActions`.
- Produces `ReportAiInsight` with `text`, `model`, `generatedAt`, and an evidence record for the workbook AI sheet.
- Consumes `URLSearchParams`, the existing `PipelineStatus` and `ParseStatus` unions, and the report SQL JSON shape defined in Task 2.

- [ ] **Step 1: Add the test runner script and write failing pure-function tests**

Add the smallest test dependency needed for TypeScript unit tests:

```json
{
  "scripts": {
    "test:report": "vitest run src/lib/recruitment/report.test.ts src/lib/export/excel-report.test.ts"
  },
  "devDependencies": {
    "vitest": "^3.2.4"
  }
}
```

Write tests for:

```ts
it("normalizes a valid local date range and optional filters", () => {
  const result = normalizeReportScope(
    new URLSearchParams("from=2026-01-01&to=2026-01-31&jd_id=jd-1&department=Engineering"),
  );
  expect(result).toEqual({
    ok: true,
    scope: {
      from: "2026-01-01T00:00:00+07:00",
      to: "2026-01-31T23:59:59.999+07:00",
      jdId: "jd-1",
      department: "Engineering",
    },
  });
});

it("rejects inverted and over-two-year ranges", () => {
  expect(normalizeReportScope(new URLSearchParams("from=2026-02-01&to=2026-01-31")).ok).toBe(false);
  expect(normalizeReportScope(new URLSearchParams("from=2023-01-01&to=2026-01-01")).ok).toBe(false);
});

it("keeps percentage denominators safe", () => {
  expect(percentage(3, 10)).toBe(30);
  expect(percentage(3, 0)).toBe(0);
});

it("classifies stale, pending, and unresolved interview actions", () => {
  const actions = classifyReportActions([staleNewApplication, pendingCvApplication, interviewWithoutResult]);
  expect(actions.map((action) => action.type)).toEqual(["STALE", "CV_PROCESSING", "INTERVIEW_RESULT"]);
});
```

- [ ] **Step 2: Run the new tests to verify RED**

Run from `Frontend`:

```bash
npm install
npm run test:report
```

Expected: FAIL because the report module and workbook tests do not exist yet.

- [ ] **Step 3: Implement the report types and normalization rules**

Use these exact core types:

```ts
export interface ReportScope {
  from: string;
  to: string;
  jdId: string | null;
  department: string | null;
}

export interface ReportMetrics {
  totalApplications: number;
  totalCvsUploaded: number;
  screenedApplications: number;
  interviewedApplications: number;
  onboardedApplications: number;
  byStatus: Record<string, number>;
  avgAiScore: number;
  passRate: number;
  offerAcceptanceRate: number;
  avgTimeToHireDays: number | null;
  medianTimeToHireDays: number | null;
  processingQueue: number;
}

export interface ReportApplication {
  id: string;
  createdAt: string;
  updatedAt: string;
  pipelineStatus: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  department: string;
  finalScore: number | null;
  aiScore: number | null;
  cvStatus: string | null;
  createdBy: string | null;
  lastStatusChangeAt: string | null;
  interviewSchedules: Array<{
    scheduledAt: string;
    status: string;
    result: string | null;
    submittedAt: string | null;
  }>;
}
```

`normalizeReportScope` must use `+07:00`, default to the last 30 calendar days ending today, trim `jd_id`/department, and return `{ ok: false, error }` for malformed dates, inverted ranges, or ranges longer than 731 days. `formatReportQuery` must serialize the same scope for both preview and export URLs.

- [ ] **Step 4: Implement status labels, role gate, percentages, and action classification**

Use the existing 12 pipeline states and Vietnamese labels already used by the recruitment UI. `isReportRole(ctx)` must accept only `ctx.isAdmin || ctx.isHr`. `classifyReportActions` must return only source-supported actions:

```ts
type ReportActionType = "STALE" | "CV_PROCESSING" | "CV_FAILED" | "INTERVIEW_RESULT" | "OFFER_RESPONSE";
```

Use a 7-day stale threshold. Classify CV processing/failed records from `cvStatus`, missing interview results when a non-cancelled schedule has no result, and pending offer response for `OFFERED`. Sort by priority (`HIGH` before `MEDIUM`) then oldest age. Never infer an AI hiring decision.

- [ ] **Step 5: Add workbook-facing snapshot types and run GREEN**

Define `ReportAiInsight` and `ReportSnapshot` with `generatedAt`, `scope`, `roleScope`, `totalMatchingApplications`, `detailLimit`, `detailTruncated`, `metrics`, `breakdowns`, `trend`, `actions`, and `applications`. Run:

```bash
npm run test:report -- --reporter=dot
```

Expected: all pure helper tests pass.

---

### Task 2: Add the scoped management-report RPC

**Files:**
- Create: `Backend/supabase/migrations/20260914000100_recruitment_management_report.sql`

**Interfaces:**
- Produces `public.recruitment_management_report(from_date timestamptz, to_date timestamptz, p_jd_id uuid, p_department text, p_owner_id uuid) returns jsonb`.
- Consumes existing `job_applications`, `candidate_cvs`, `candidate_screenings`, `job_descriptions`, and `candidate_status_history` tables.

- [ ] **Step 1: Define a single scoped application CTE**

The function must use one `scoped_apps` CTE with these predicates in every derived metric:

```sql
where ja.created_at >= from_date
  and ja.created_at <= to_date
  and (p_jd_id is null or ja.job_description_id = p_jd_id)
  and (p_department is null or jd.department = p_department)
  and (p_owner_id is null or ja.created_by = p_owner_id)
```

Join the current screening through `ja.current_screening_id` and keep null-related rows via `left join`.

- [ ] **Step 2: Return exact summary metrics and current-state status counts**

Return camelCase JSON fields matching `ReportMetrics`: total applications, CV count through scoped applications, screened/interviewed/onboarded counts, all 12 status counts with zeroes, average AI score, pass rate, offer acceptance rate, processing queue, and time-to-hire statistics.

Use these definitions:

```sql
screened = pipeline_status in ('SCREENED','SHORTLISTED','INTERVIEW_SCHEDULED','INTERVIEWED','PASSED','FAILED','OFFERED','ACCEPTED','OFFER_REJECTED','ONBOARDED')
interviewed = pipeline_status in ('INTERVIEWED','PASSED','FAILED','OFFERED','ACCEPTED','OFFER_REJECTED','ONBOARDED')
passed = pipeline_status in ('PASSED','OFFERED','ACCEPTED','ONBOARDED')
offer_acceptance = pipeline_status in ('ACCEPTED','ONBOARDED') / pipeline_status in ('OFFERED','ACCEPTED','OFFER_REJECTED')
```

Use `candidate_status_history.to_status = 'ONBOARDED'` for time-to-hire when available and `updated_at - created_at` for an onboarded row without history. Return null for average/median when no application reached onboarded.

- [ ] **Step 3: Return JD/department breakdown and monthly trend**

Return `breakdowns` grouped by `job_description_id`, title, and department, and `trend` grouped by `date_trunc('month', created_at)`. Each breakdown includes application count, screened/interviewed/onboarded counts, pass rate, offer acceptance rate, and average time-to-hire. Null departments are labeled by the server as `Chưa phân loại`.

- [ ] **Step 4: Lock down function execution**

Declare the function `security definer`, set `search_path = public`, revoke execution from `public`, and grant execution only to `service_role`. The API still passes `p_owner_id` for HR; the function must never derive a broader owner scope from a client-provided parameter.

- [ ] **Step 5: Perform a SQL self-check**

Run:

```bash
sed -n '1,360p' Backend/supabase/migrations/20260914000100_recruitment_management_report.sql
rg -n "TODO|TBD|p_owner_id|p_department|security definer|revoke|grant" Backend/supabase/migrations/20260914000100_recruitment_management_report.sql
```

Expected: one scoped CTE feeds every metric; no placeholders; no raw CV text is selected.

---

### Task 3: Build one server snapshot loader and secure preview/export routes

**Files:**
- Create: `Frontend/src/lib/recruitment/report-data.ts`
- Create: `Frontend/src/app/api/recruitment/report/route.ts`
- Modify: `Frontend/src/app/api/recruitment/report/export/route.ts`

**Interfaces:**
- Produces `loadRecruitmentReport(scope, ctx): Promise<ReportSnapshot>` and `GET /api/recruitment/report?...` JSON.
- Preserves `GET /api/recruitment/report/export?...` as the XLSX endpoint, now consuming the same loader.

- [ ] **Step 1: Implement role-aware scope derivation**

Authenticate before parsing report data. Return `401` for unauthenticated, `403` for any role other than admin/super_admin/hr, and pass `ctx.userId` as `p_owner_id` only for HR. Do not reuse the old all-time constant. Return `400` for an invalid normalized scope.

- [ ] **Step 2: Implement the aggregate RPC call**

Call:

```ts
admin.rpc("recruitment_management_report", {
  from_date: scope.from,
  to_date: scope.to,
  p_jd_id: scope.jdId,
  p_department: scope.department,
  p_owner_id: ownerId,
});
```

Normalize missing JSON fields defensively to zero/empty arrays before building the snapshot. RPC failure returns a user-safe `500` and logs only the error message.

- [ ] **Step 3: Fetch capped detail rows with the exact same predicates**

Query `job_applications` with `{ count: "exact" }`, `range(0, 4999)`, and the same date/JD/department/owner predicates. Select only:

```text
id, created_at, updated_at, pipeline_status, created_by,
persons!inner(full_name, email),
job_descriptions(id, title, department),
candidate_cvs(id, parse_status),
candidate_screenings!fk_current_screening(final_score, ai_score),
candidate_status_history(changed_at),
interview_schedules(scheduled_at, status, interview_results(result, submitted_at))
```

Map relation arrays defensively, derive `lastStatusChangeAt`, normalize the selected screening, classify actions, and set `detailTruncated = (count ?? 0) > 5000`.

- [ ] **Step 4: Add the JSON preview response**

Return the typed snapshot as JSON with `Cache-Control: no-store`. The response must include `generatedAt`, `roleScope`, `totalMatchingApplications`, `detailLimit`, and the effective scope so the UI and workbook cannot silently disagree.

- [ ] **Step 5: Rewire the XLSX route and AI behavior**

Replace the old route's direct RPC/application queries with `loadRecruitmentReport`. Call Gemini only with the metric/breakdown/trend subset, enforce a 6-second timeout with `Promise.race`, and pass an evidence object alongside the generated text. AI failures return a snapshot without an AI sheet. Keep the existing content type and deterministic filename.

- [ ] **Step 6: Verify server typing and route build**

Run:

```bash
cd Frontend
npx tsc --noEmit
```

Expected: no new TypeScript errors. If Supabase's inferred nested relation types are broad, keep local narrow row types and small casts at the mapping boundary; do not add `any` to the public snapshot contract.

---

### Task 4: Replace the basic workbook with the management-report workbook

**Files:**
- Modify: `Frontend/src/lib/export/excel-report.ts`
- Create: `Frontend/src/lib/export/excel-report.test.ts`

**Interfaces:**
- `buildRecruitmentReportWorkbook(snapshot: ReportSnapshot, ai?: ReportAiInsight): Promise<ExcelJS.Workbook>` returns the workbook used by the export route.
- Consumes only the typed snapshot; it must not query Supabase or call Gemini.

- [ ] **Step 1: Write failing workbook contract tests**

Assert that a snapshot with no AI creates exactly these sheets in order:

```ts
expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
  "Tổng quan",
  "Pipeline hiện tại",
  "Theo JD & phòng ban",
  "Cần hành động",
  "Chi tiết ứng viên",
]);
```

Add a second test asserting the AI sheet is sixth, the detail sheet freezes row 1, empty data still creates all base sheets, and `detailTruncated` appears in metadata.

- [ ] **Step 2: Implement shared workbook styling and metadata**

Keep ExcelJS and the existing purple header style, but add a compact metadata block at the top of `Tổng quan`: period, filters, role scope, generation time, total matching rows, detail limit/truncation note, and the current-state semantics note. Use real `Date` cell values with `numFmt = "dd/mm/yyyy hh:mm"` for date columns.

- [ ] **Step 3: Implement the six defined sheet builders**

Use focused functions:

```ts
addOverviewSheet(workbook, snapshot)
addPipelineSheet(workbook, snapshot)
addBreakdownSheet(workbook, snapshot)
addActionsSheet(workbook, snapshot)
addApplicationsSheet(workbook, snapshot)
addInsightSheet(workbook, snapshot, ai)
```

Pipeline rows include count and percentage of scoped applications. Breakdown rows include JD, department, counts, rates, and time. Action rows include priority, type, candidate/application, status, age, and next action. Detail rows include only operational fields and a relative application URL; exclude CV body, transcript, notes, and AI narrative.

- [ ] **Step 4: Add AI evidence and run workbook tests**

The AI sheet must contain advisory text, model, timestamp, and a two-column evidence table of the structured metrics supplied to Gemini. Run:

```bash
npm run test:report -- --reporter=dot
```

Expected: pure helper and workbook contract tests pass.

---

### Task 5: Build the scoped report UI and fix role advertisement

**Files:**
- Modify: `Frontend/src/app/dashboard/recruitment/report/page.tsx`
- Modify: `Frontend/src/app/dashboard/recruitment/report/report-coming-soon-client.tsx`
- Modify: `Frontend/src/components/ui/nav-config.ts:81`

**Interfaces:**
- UI consumes `GET /api/recruitment/report` and calls `/api/recruitment/report/export` with the same `formatReportQuery` output.
- Page visibility and API authorization must expose the same role set: `hr`, `admin`, `super_admin`.

- [ ] **Step 1: Add server-side page gating**

After loading the profile, redirect roles outside `hr`, `admin`, and `super_admin` back to `/dashboard/recruitment`. Update `nav-config.ts` to the same exact role list so interviewers do not see a button that always fails.

- [ ] **Step 2: Replace the coming-soon content with report controls**

Keep the existing visual language but remove the false “Q3 2026/Đang phát triển” promise. Add date inputs defaulting to the last 30 days, JD select, department select derived from loaded JDs, `Xem báo cáo`/auto-refresh behavior, and `Xuất Excel`.

- [ ] **Step 3: Render management preview states**

Render six KPI cards (applications, CVs, screened, interviewed, onboarded, pass/offer rates), the current-state pipeline table, JD/department breakdown, and the action list. Show the effective scope and `N chi tiết / M matching` with a truncation warning. Include loading, empty, error, and exporting states; disable duplicate export while active.

- [ ] **Step 4: Verify URL parity and browser behavior**

Ensure changing any filter refreshes preview and that export uses the exact same query string. When the response is empty, show the explicit empty-state note while preserving a valid Excel download. Surface API errors in Vietnamese without exposing server details.

---

### Task 6: Verify, review, and hand off within the timebox

**Files:**
- No additional production files; inspect the task diff and test artifacts only.

- [ ] **Step 1: Run focused tests and TypeScript checks**

```bash
cd Frontend
npm run test:report
npx tsc --noEmit
```

Expected: all report tests pass and TypeScript exits 0.

- [ ] **Step 2: Run repository lint and production build**

```bash
npm run lint
npm run build
```

Expected: lint and build complete successfully, with any pre-existing warnings clearly separated from new findings.

- [ ] **Step 3: Validate SQL and scope consistency by inspection**

```bash
rg -n "from_date|to_date|p_jd_id|p_department|p_owner_id|limit|5000|detailTruncated" \
  Backend/supabase/migrations/20260914000100_recruitment_management_report.sql \
  Frontend/src/lib/recruitment/report-data.ts \
  Frontend/src/app/api/recruitment/report/route.ts \
  Frontend/src/app/api/recruitment/report/export/route.ts
```

Expected: no report path uses the old all-time constant or an unfiltered application query.

- [ ] **Step 4: Perform the browser smoke test**

With the existing local environment and a permitted admin/HR session, verify: default report loads, changing date/JD changes metadata, empty range renders zeros, Excel opens with the five base sheets, AI adds only the sixth sheet, and AI failure still downloads the base workbook. Verify a disallowed role cannot see or call the report.

- [ ] **Step 5: Run the final code review pass**

Review only the report-related diff for: permission leaks, mismatched filters, misleading KPI labels, PII leakage into AI/workbook, unbounded rows, unhandled empty relations, and UI/API role drift. Do not alter unrelated dirty files. Report exact verification results and any scope cuts made to stay inside the 10-hour budget.
