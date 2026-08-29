# Phase 5: Recruitment CSV Export

## Goal
Export recruitment applications CSV directly from `/dashboard/recruitment`, respecting active filters.

## Tasks
- [x] Add export button to recruitment header/action bar.
- [x] Add `GET /api/recruitment/applications/export` or extend existing export route for recruitment applications.
- [x] Reuse `generateCsv` from `src/lib/export/csv-export.ts`.
- [x] Support filters: `q`, `status`, `jdId`, `minScore`, `maxScore`, `cvStatus`, `createdFrom`, `createdTo`.
- [x] Include columns: Candidate Name, Email, JD Title, Department, Pipeline Status, AI Score, Final Score, CV Status, Created At.
- [x] Permission scope: HR, interviewer, admin, super_admin.

## Files
- `src/app/dashboard/recruitment/recruitment-client.tsx`
- `src/app/api/recruitment/applications/export/route.ts` or `src/app/api/export/[type]/route.ts`
- `src/lib/export/csv-export.ts` only if helper needs small enhancement.

## Acceptance
- CSV downloads from UI.
- CSV matches filters.
- Header-only CSV works when no rows match.
- Typecheck passes.

