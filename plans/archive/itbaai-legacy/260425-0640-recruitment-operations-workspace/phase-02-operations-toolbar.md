# Phase 2: Operations Toolbar + API Filters

## Goal
Make search/filter the central control of the page, with real API-backed filters.

## Tasks
- [x] Build compact toolbar under header.
- [x] Keep search using `q` API param.
- [x] Keep status using `status` API param.
- [x] Add JD filter using existing `jdId` API param and `/api/recruitment/job-descriptions` options.
- [x] Add score range using existing `minScore` and `maxScore` API params.
- [x] Add CV status filter using new `cvStatus` API support.
- [x] Add created date range using new `createdFrom` and `createdTo` API support.
- [x] Add reset filters button.
- [x] Update fetch URL state/query param building.

## Files
- `src/app/dashboard/recruitment/recruitment-client.tsx`
- `src/app/api/recruitment/applications/route.ts`

## Acceptance
- All visible filters affect API results.
- No fake filter controls.
- Reset clears all filters.
- Typecheck passes.
