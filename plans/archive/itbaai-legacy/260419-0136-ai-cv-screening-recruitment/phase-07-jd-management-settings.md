# Phase 7 — JD Management + Settings

## Context Links
- `src/components/management/*-form-dialog.tsx` (reuse pattern)
- `system_settings` key-value store
- Phase 2 Edge Function reads threshold

## Overview
- **Priority:** P2
- **Status:** pending
- **Description:** Full CRUD for Job Descriptions + recruitment settings (auto-reject threshold).

## Key Insights
- JD `required_skills` stored as JSONB array of `{skill, weight}` for future scoring tuning (keep weight optional, default 1)
- Auto-reject threshold: if `ai_score < threshold`, Edge Function sets status to REJECTED instead of SCREENED
- Settings reuse existing `system_settings` table; namespace `recruitment.*`

## Requirements
**Functional**
- CRUD endpoints for job_descriptions
- GET/PATCH settings endpoint for global `recruitment.auto_reject_threshold` (default 40)
- Per-JD threshold: `job_descriptions.auto_reject_threshold` nullable int — overrides global when set
- Pages: `/dashboard/recruitment/jd` (list + form dialogs) and `/dashboard/recruitment/settings`
- Write access: `interviewer | admin | super_admin` only
- HR: read-only — can only select existing JDs in upload dialog (no create/edit/delete)
- `recruiter`: no JD access at all

## Architecture

Threshold resolution order in Edge Function:
1. `job_descriptions.auto_reject_threshold` (if not null) — per-JD override
2. `system_settings['recruitment.auto_reject_threshold'].threshold` — global default (40)

```ts
// system_settings row (global default)
key: 'recruitment.auto_reject_threshold'
value: { threshold: 40 }  // jsonb

// job_descriptions schema addition (per-JD override)
auto_reject_threshold: integer | null  -- null means use global
```

```ts
// Role guard helper
const canWriteJd = ctx.isAdmin || ctx.role === 'interviewer'
// HR → read-only; recruiter → no access
```

## Related Code Files
**Create**
- `src/app/api/recruitment/job-descriptions/route.ts` (GET, POST)
- `src/app/api/recruitment/job-descriptions/[id]/route.ts` (GET, PATCH, DELETE)
- `src/app/api/recruitment/settings/route.ts` (GET, PATCH)
- `src/app/dashboard/recruitment/jd/page.tsx`
- `src/app/dashboard/recruitment/jd/jd-client.tsx`
- `src/app/dashboard/recruitment/settings/page.tsx`
- `src/components/recruitment/jd-form-dialog.tsx`

## Implementation Steps
1. JD CRUD endpoints — write guard: `isAdmin || role === 'interviewer'`; read allowed for `hr` (picker only); `recruiter` blocked entirely
2. JD list page using existing data-table (visible to interviewer/admin only)
3. JD form-dialog: title, role_key, department, seniority, required_skills tag input, full_text textarea, `auto_reject_threshold` (optional int 0–100), is_active toggle
4. Settings GET/PATCH endpoint — admin only for global threshold write
5. Settings page: global threshold slider/input (0–100), label: "Default auto-reject threshold (per-JD overrides this)"
6. Verify Edge Function reads per-JD threshold first, falls back to global
7. Wire JD picker into CV upload dialog (Phase 2 field) — HR sees picker, no create link

## Todo
- [ ] JD CRUD endpoints (write: interviewer/admin only, read: hr for picker)
- [ ] JD list page + dialog (with per-JD auto_reject_threshold field)
- [ ] Settings endpoint (global threshold, admin-only write)
- [ ] Settings page
- [ ] Edge Function: per-JD threshold → fallback to global verified
- [ ] HR upload dialog shows JD picker without create link

## Success Criteria
- Create JD → appears in upload picker
- Change threshold → next upload uses new value
- Delete-guard: cannot delete JD referenced by applications (soft-delete via `is_active=false`)

## Risk Assessment
- **Risk:** Orphaned job_applications if JD hard-deleted → prefer soft delete
- **Risk:** Threshold races with in-flight processing → acceptable (read-at-time-of-score)

## Security Considerations
- Write guard: `interviewer | admin | super_admin` only — enforced both at API and RLS level
- HR role: RLS SELECT-only on `job_descriptions`; no INSERT/UPDATE/DELETE
- Recruiter: no RLS policy for job_descriptions (blocked)
- `full_text` length cap 20 KB
- `auto_reject_threshold` must be validated 0–100 inclusive server-side

## Next Steps
- Phase 8 dashboard consumes JD + settings
