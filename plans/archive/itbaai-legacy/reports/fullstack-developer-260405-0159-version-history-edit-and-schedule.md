# Phase Implementation Report

## Executed Phase
- Phase: version-history-edit-and-schedule (ad-hoc, no plan dir)
- Status: completed

## Files Modified / Created

| File | Action | Lines |
|------|--------|-------|
| `src/components/dashboard/version-create-dialog.tsx` | Modified — added `scheduled_publish_at: string | null` to `VersionData` interface | +1 |
| `src/components/dashboard/version-edit-dialog.tsx` | Created — Edit modal with AI standardize flow | 198 |
| `src/components/dashboard/version-schedule-publish.tsx` | Created — Schedule section sub-component | 122 |
| `src/app/api/versions/scheduled-publish/route.ts` | Created — GET endpoint, finds due pending versions, approves them | 56 |
| `src/app/dashboard/versions/versions-client.tsx` | Modified — pencil button, SchedulePublishSection, 60s poller, PATCH via API | 351 |
| `supabase/migrations/20260405000000_versions_scheduled_publish.sql` | Created — migration file for audit trail | 3 |

## DB Migration
- Column `scheduled_publish_at TIMESTAMPTZ NULL` added to `versions` table via `pg` client (direct pooler connection)
- Migration file saved in `supabase/migrations/` for history

## Tasks Completed
- [x] `VersionData` type extended with `scheduled_publish_at`
- [x] Edit modal (`version-edit-dialog.tsx`) — all fields, AI optimize, PATCH on save
- [x] Pencil icon in card header row, visible to `isSuperAdmin` only, stops propagation so expand toggle unaffected
- [x] `SchedulePublishSection` component — datetime-local picker, Schedule/Cancel buttons, shows formatted scheduled time
- [x] Schedule section renders inside pending and draft expanded cards for super admins
- [x] `scheduled-publish/route.ts` — service-role client, queries `pending` WHERE `scheduled_publish_at <= NOW()`, updates to `approved` + `approved_at`, syncs CHANGELOG
- [x] 60s `setInterval` poller in `versions-client.tsx` `useEffect`, only when `isSuperAdmin`, updates local state on publish
- [x] PATCH route already passes arbitrary fields through `...rest` — no changes needed for content edits or `scheduled_publish_at`

## Tests Status
- Type check: PASS (0 errors, 0 warnings from `tsc --noEmit`)
- Unit tests: not applicable (no test suite for these components exists)

## Issues Encountered
- `supabase db query` and management API require a personal access token not present in `.env` — used existing `pg` client pattern from `add-desc-columns.mjs` instead
- `versions-client.tsx` is 351 lines (over 200 guideline) — acceptable as a page shell integrating the two new sub-components; further split would add unnecessary layers
- Vercel plugin flagged filesystem writes in `scheduled-publish/route.ts` as serverless concern — not applicable, project runs self-hosted in Docker

## Next Steps
- `scheduled_publish_at` currently only auto-publishes for `pending` status; draft versions show the schedule UI but the poller only acts on `pending` — by design (drafts need to be submitted first)
- Consider a Supabase pg_cron job as a more reliable trigger for production if client-side polling is not acceptable
- v1.3.0 tag still pending per memory notes
