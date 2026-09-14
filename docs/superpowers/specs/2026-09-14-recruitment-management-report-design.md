# Recruitment Management Report v1

**Status:** Implementation scope approved in conversation on 2026-09-14

## Context

PR 35 adds a working XLSX download to `Recruitment > Report`, but the current
file is an all-time data dump with three basic sheets and an optional AI
paragraph. The product requirements position reporting as a management tool:
HR and leaders should understand recruitment throughput, pipeline bottlenecks,
time-to-hire, risks, and the evidence behind the recommended actions.

The existing Recruitment Dashboard already owns the date and job-description
filters and calls the `recruitment_dashboard` RPC. Report v1 extends that flow
with a shared report scope and a workbook that can be used for management
review. It does not create a second analytics subsystem.

## Primary user and outcome

The primary users are HR and administrators who prepare a recruitment review
for a selected period and, when needed, one job description. The report must
answer five questions:

1. How many applications entered the pipeline and what is their current state?
2. Which stages are accumulating candidates or losing candidates?
3. Which job descriptions and departments need attention?
4. How long are applications taking and which records are stale?
5. What concrete follow-up actions should the team take next?

## Goals

- Replace the report placeholder with a usable management report page.
- Use one scope (`from`, `to`, optional `jd_id`, optional department) for every
  KPI, aggregate, action list, and detail row.
- Export a structured XLSX with management summary, pipeline analysis,
  breakdowns, action items, and a permission-safe application appendix.
- Preserve exact report-period and data-scope metadata in the workbook.
- Make KPI denominators and time semantics explicit so the report is not
  mistaken for a historical cohort analysis when it is a current-state view.
- Keep AI optional and advisory. Every AI observation must cite a metric label
  and value from the generated report; an AI failure must never fail the export.
- Maintain a bounded implementation that fits two five-hour sessions.

## Non-goals

- Candidate-specific evaluation dossier, interview transcript, full CV export,
  or PDF generation. Those remain separate detail-page features.
- Organization/tenant/team hierarchy or a new permission model. In v1,
  `admin` and `super_admin` may view the full recruitment scope; `hr` is
  restricted to applications it created and their related data. Other roles
  do not receive this management export until a broader scope model exists.
- Real-time scheduled report delivery, saved report definitions, dashboards
  with interactive drill-down, or background export jobs.
- AI-generated Pass/Fail decisions, hiring recommendations, or unverified
  claims about interviewer quality.

## Report scope and semantics

The page exposes:

- `from`: inclusive ISO date at the start of the selected local day.
- `to`: inclusive ISO date at the end of the selected local day.
- `jd_id`: optional job description filter.
- `department`: optional exact department filter.

The UI shows the effective period, selected JD/department, row count, whether
the detail appendix is truncated, the generation timestamp, and the role scope.
The API validates dates and rejects an inverted period or a period longer than
two years with a clear `400` response.

The current-state section counts applications by their latest
`pipeline_status` at export time. It labels this explicitly as current state.
The report does not present those counts as true historical conversion unless
the underlying status history supports that calculation. Time-to-stage and
stale-record figures use `candidate_status_history` when available and state
their fallback behavior for records without history.

The report uses an exact aggregate count for all matching applications and a
hard detail limit of 5,000 rows. When the limit is reached, the workbook shows
`Chi tiết bị giới hạn ở 5.000 dòng` and the exact matching count in metadata;
summary KPIs still represent the full scoped set.

## Workbook contract

The workbook has these sheets in order:

1. **Tổng quan** — report metadata, total applications/CVs, screening and
   interview counts, pass rate, offer acceptance rate, average/median available
   processing time, pending processing count, and a short definition note for
   each KPI.
2. **Pipeline hiện tại** — all pipeline states, counts, percentage of scoped
   applications, and a clear note that this is a current-state distribution.
3. **Theo JD & phòng ban** — application count, screened count, interviewed
   count, onboarded count, pass rate, offer acceptance rate, and average time
   by job description/department.
4. **Cần hành động** — stale applications, pending/failed CV processing,
   interviews without a result, and offers awaiting a final response. Each row
   includes application identity, current status, age, owner, and suggested
   next action when the source data supports it.
5. **Chi tiết ứng viên** — permission-safe operational appendix with
   application ID, application date, candidate name/email, JD, department,
   current status, current scores, last status-change date, and detail URL.
   Sensitive CV text, transcript, and interviewer notes are excluded.
6. **Nhận xét AI** — optional, only when Gemini returns a response. It contains
   the advisory text, generation timestamp, model name, and the structured KPI
   snapshot used as evidence.

All sheets have a styled header row, readable widths, frozen headers for row
data, and `vi-VN` labels. Dates are written as real Excel date values with a
display format where practical, not locale-dependent preformatted strings.

## Architecture and data flow

The report route is the single server boundary for the page and download:

1. Authenticate with `getAuthContext`.
2. Validate the scope and derive an explicit access predicate from the role.
3. Fetch scoped aggregates and scoped application details using the same
   normalized scope.
4. Build a typed `RecruitmentReportSnapshot` containing metadata, metrics,
   breakdowns, actions, and rows.
5. Build the XLSX from the snapshot through a pure workbook builder.
6. Request an optional AI summary from only the aggregate snapshot; enforce a
   short timeout and discard the AI sheet on failure.
7. Return the file with a deterministic date-based filename.

The UI uses the same query parameters for preview and export. The existing
Dashboard may continue using its current endpoint, but the report route must
not mix Dashboard metrics with unfiltered application rows.

## Access and privacy

- `admin` and `super_admin` can export all recruitment records covered by the
  selected filters.
- `hr` can export only applications where `created_by = ctx.userId`; all
  aggregates and related CV/application rows use that same owner scope.
- `interviewer`, `recruiter`, and `leader` are not granted this management
  report in v1 because their team/assignment scope is not represented
  consistently in the current schema. The navigation must not advertise a
  report they cannot use.
- Every report request is logged with actor, scope, row count, and whether AI
  was used when an existing activity/audit boundary can accept it; no secret or
  raw CV content is logged.

## Error and empty-state behavior

- Invalid scope returns `400` with a user-safe message.
- Unauthorized returns `401`; disallowed roles return `403`.
- Aggregate or detail query failure returns `500` and no partial workbook.
- Empty matching data still produces a valid workbook with zero values and an
  explicit `Không có dữ liệu trong phạm vi đã chọn` note.
- AI configuration, quota, timeout, or response errors never block the file.
- The page shows loading, empty, error, and exporting states; it prevents a
  second export while the first is running and surfaces the effective scope.

## Testing and acceptance criteria

- Unit-test or pure-function-test scope normalization, date validation, KPI
  percentage/denominator handling, current-state labels, truncation metadata,
  and action classification.
- Verify the workbook contains the six defined sheets when AI is available and
  five sheets when it is not, with headers, metadata, frozen detail rows, and
  empty-data behavior.
- Verify route access for admin, super_admin, HR-owned data, HR foreign data,
  interviewer, and unauthenticated requests.
- Verify that every sheet uses the selected scope and that exact aggregate
  counts remain visible when detail rows are capped.
- Run TypeScript/build/lint checks and perform a manual browser download test
  against the existing Supabase environment without changing unrelated dirty
  files.

## Timebox and delivery boundary

Session 1 delivers the scoped server snapshot, workbook contract, permission
fixes, and automated checks. Session 2 delivers the report UI, browser export
flow, AI evidence sheet, manual verification, and review. If the timebox is
threatened, JD/department breakdown and AI remain optional before weakening
access control, scope consistency, or KPI definitions.
