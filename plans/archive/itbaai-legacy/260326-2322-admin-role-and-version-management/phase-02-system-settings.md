# Phase 2: System Settings

## Context Links

- [Brainstorm Report](../reports/brainstorm-260326-2322-admin-role-and-version-management.md)
- [Phase 1 — DB Schema](./phase-01-database-schema.md)
- [Auth Helpers](../../src/lib/api/auth-helpers.ts)

## Overview

- **Priority**: P1
- **Status**: pending
- **Effort**: 5h

Admin-only settings page with grouped cards and auto-save UX. API route for GET all / PATCH by key. Settings categories: AI Configuration, Assessment Defaults, Scoring Rules, Token Pricing.

## Key Insights

- Settings stored as key-value pairs in `system_settings` table (seeded in Phase 1)
- Auto-save with debounce (no explicit Save button) — use 800ms debounce
- Grouped by `category` column: `ai`, `assessment`, `scoring`
- All settings readable by anyone (needed by AI routes for config), writable only by admin
- Settings values are `jsonb` — can store strings, numbers, arrays, objects
- Existing admin conditional in `navbar-user-dropdown.tsx` already links to Settings for admin users

## Requirements

### Functional
- GET `/api/settings` — returns all settings grouped by category
- PATCH `/api/settings` — updates one or more settings by key (admin-only)
- Settings page at `/dashboard/settings` — admin-only, redirects recruiter
- Each setting renders as appropriate input (text, number, select)
- Changes auto-save with debounce, show success toast

### Non-functional
- Page loads fast (server component fetches data, client renders form)
- Debounced saves avoid excessive API calls
- Error states with retry

## Architecture

```
Server Component (page.tsx)
├── Auth check → redirect if not admin
├── Fetch all settings from Supabase
└── Pass to SettingsClient

SettingsClient
├── Groups settings by category into Card sections
├── Each setting row: label + description + input
├── onChange → debounced PATCH /api/settings
└── Toast on success/error
```

### Settings Shape

```typescript
interface SystemSetting {
  id: string;
  key: string;
  value: unknown; // jsonb — parsed
  category: string;
  description: string | null;
  updated_at: string;
}

// Category grouping for UI
const CATEGORY_LABELS: Record<string, string> = {
  ai: "AI Configuration",
  assessment: "Assessment Defaults",
  scoring: "Scoring Rules",
};

// Per-setting input type mapping
const SETTING_INPUT_TYPE: Record<string, "text" | "number" | "select"> = {
  openai_model: "select",  // options: gpt-4o, gpt-4o-mini, gpt-4-turbo
  default_question_count: "number",
  default_time_limit: "number",
  pass_threshold: "number",
  token_price_input_per_1k: "number",
  token_price_output_per_1k: "number",
};
```

## Related Code Files

### Files to Create
- `D:\Projects\Git Private\ITBAAI\src\app\api\settings\route.ts`
- `D:\Projects\Git Private\ITBAAI\src\app\dashboard\settings\page.tsx`
- `D:\Projects\Git Private\ITBAAI\src\app\dashboard\settings\settings-client.tsx`

### Files to Modify
- `D:\Projects\Git Private\ITBAAI\src\components\ui\navbar-user-dropdown.tsx` — update Settings link to point to `/dashboard/settings` instead of `/dashboard/users`

## Implementation Steps

### Step 1: Settings API route

Create `src/app/api/settings/route.ts`:

```typescript
// GET — returns all settings (any authenticated user)
// PATCH — updates settings by key (admin only)
// Body: { key: string, value: unknown } or { updates: { key: value }[] }
```

- GET: `getAuthContext()` → if error return → query all from `system_settings` ordered by category
- PATCH: `requireAdmin()` → if error return → update `value` and `updated_by` for each key

### Step 2: Settings server page

Create `src/app/dashboard/settings/page.tsx`:

- Server Component
- Auth check: fetch user, if not admin → `redirect('/dashboard')`
- Fetch all settings via Supabase
- Pass to `<SettingsClient settings={settings} />`

### Step 3: Settings client component

Create `src/app/dashboard/settings/settings-client.tsx`:

- Groups settings by `category`
- Renders each category as a Card with header
- Each setting row: label (from `description`), input field
- `useCallback` + `useRef` for debounced save (800ms)
- On value change: update local state immediately, debounce PATCH call
- Toast on success: "Setting updated"
- Toast on error: "Failed to update setting"

### Step 4: Update navbar dropdown

In `navbar-user-dropdown.tsx`, change the admin Settings link `href` from `/dashboard/users` to `/dashboard/settings`.

## Todo List

- [ ] Create `src/app/api/settings/route.ts` (GET + PATCH)
- [ ] Create `src/app/dashboard/settings/page.tsx` (server component, admin redirect)
- [ ] Create `src/app/dashboard/settings/settings-client.tsx` (grouped cards, debounced auto-save)
- [ ] Update `navbar-user-dropdown.tsx` Settings link href
- [ ] Test: admin can view and edit settings
- [ ] Test: recruiter gets redirected from settings page
- [ ] Test: PATCH rejects non-admin with 403
- [ ] Test: debounced save works (no excessive API calls)

## Success Criteria

- Admin sees grouped settings cards on `/dashboard/settings`
- Changing a value auto-saves after debounce with toast confirmation
- Recruiter is redirected to `/dashboard` when accessing settings URL
- PATCH API returns 403 for non-admin
- Settings values persist correctly in database

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Race condition with concurrent auto-saves | Low | Debounce 800ms ensures sequential saves; key-level granularity |
| Invalid jsonb values from input | Low | Validate input type before PATCH; number fields parse to number |

## Security Considerations

- Server-side admin check on page load (redirect)
- API-level admin check via `requireAdmin()` on PATCH
- RLS provides third layer: only admin role can update `system_settings`
- GET is intentionally open to all authenticated users (AI routes need config values)

## Next Steps

- Phase 4 (Token Monitoring) reads `token_price_*` settings from this table
- Phase 8 (Admin Dashboard) may display settings summary
