# Phase 6: Skill Framework Enhancement

## Context Links

- [Brainstorm Report](../reports/brainstorm-260326-2322-admin-role-and-version-management.md)
- [Phase 1 — DB Schema](./phase-01-database-schema.md) (`skill_categories`, `level_skill_expectations`)
- [Skills List Client](../../src/app/dashboard/skills/skills-list-client.tsx)
- [Skills Page](../../src/app/dashboard/skills/page.tsx)
- [Position Detail Client](../../src/app/dashboard/positions/[id]/position-detail-client.tsx)
- [Talent Schema](../../supabase/migrations/20260326000000_talent_assessment_schema.sql)

## Overview

- **Priority**: P2
- **Status**: pending
- **Effort**: 4h

Add skill categories (grouping) and level-based skill expectations. Categories managed by admin, displayed as filters on skills list. Level expectations mapped per position — shows which skills are expected at each level.

## Key Insights

- `skills` table already has `category` varchar column — used for freeform text categories
- Phase 1 adds `category_id` FK to `skill_categories` table — structured replacement
- Keep existing `category` varchar for backward compat, add `category_id` as optional FK
- Skills list client already has a category filter dropdown (from freeform `category` values)
- Position detail page shows `position_skill_requirements` — level expectations extend this concept
- Admin-only write for `skill_categories` and `level_skill_expectations`
- All users can read categories and expectations

## Requirements

### Functional
- Skill categories CRUD API (admin write, all read)
- Level expectations CRUD API (admin write, all read)
- Category selector in skills list (replace freeform with structured dropdown)
- Category assignment when creating/editing skills
- Level expectations section on position detail page
- Levels: intern, fresher, junior, mid, senior, lead

### Non-functional
- Categories seeded with defaults in Phase 1 migration
- Backward compatible — skills without `category_id` still work via `category` varchar

## Architecture

### Category Integration

```
skill_categories (admin manages)
├── Technical Skills
├── Business Analysis
├── Communication
├── Soft Skills
└── Leadership

skills.category_id → FK to skill_categories.id
skills.category → kept for backward compat (display fallback)
```

### Level Expectations Model

```
level_skill_expectations
├── level: "junior"
├── skill_id: FK → skills
├── position_id: FK → positions (nullable = global)
├── expected_score: 3 (1-5)
└── is_mandatory: true/false

Use case: "A Junior Backend Developer should score 3+ on REST API (mandatory)"
```

### Interfaces

```typescript
interface SkillCategory {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  created_at: string;
}

interface LevelSkillExpectation {
  id: string;
  level: string;
  skill_id: string;
  position_id: string | null;
  expected_score: number;
  is_mandatory: boolean;
  skills?: { name: string; category: string | null };
}

const LEVELS = ["intern", "fresher", "junior", "mid", "senior", "lead"];
```

## Related Code Files

### Files to Create
- `D:\Projects\Git Private\ITBAAI\src\app\api\skill-categories\route.ts` — GET + POST
- `D:\Projects\Git Private\ITBAAI\src\app\api\skill-categories\[id]\route.ts` — PATCH + DELETE
- `D:\Projects\Git Private\ITBAAI\src\app\api\level-expectations\route.ts` — GET + POST + DELETE

### Files to Modify
- `D:\Projects\Git Private\ITBAAI\src\app\dashboard\skills\page.tsx` — fetch categories, pass to client
- `D:\Projects\Git Private\ITBAAI\src\app\dashboard\skills\skills-list-client.tsx` — use structured category filter, add category assignment on create/edit
- `D:\Projects\Git Private\ITBAAI\src\app\dashboard\positions\[id]\position-detail-client.tsx` — add level expectations section
- `D:\Projects\Git Private\ITBAAI\src\app\dashboard\positions\[id]\page.tsx` — fetch level expectations data
- `D:\Projects\Git Private\ITBAAI\src\components\management\skill-form-dialog.tsx` — add category_id dropdown

## Implementation Steps

### Step 1: Skill categories API

**`src/app/api/skill-categories/route.ts`**:
- GET: `getAuthContext()` → fetch all from `skill_categories` ordered by `display_order`
- POST: `requireAdmin()` → validate `name` → insert

**`src/app/api/skill-categories/[id]/route.ts`**:
- PATCH: `requireAdmin()` → update name, description, display_order
- DELETE: `requireAdmin()` → delete (CASCADE sets `category_id = null` on skills)

### Step 2: Level expectations API

**`src/app/api/level-expectations/route.ts`**:
- GET: `getAuthContext()` → fetch by `position_id` query param (or all if admin)
  - Join skills table for name display
- POST: `requireAdmin()` → validate → insert (level, skill_id, position_id, expected_score, is_mandatory)
- DELETE: `requireAdmin()` → delete by id (passed as query param or body)

### Step 3: Update skills list with structured categories

Modify `src/app/dashboard/skills/page.tsx`:
- Fetch `skill_categories` alongside skills
- Pass `categories` to client

Modify `src/app/dashboard/skills/skills-list-client.tsx`:
- Replace freeform category filter with structured dropdown from `skill_categories`
- Show category badge using category name (resolved from `category_id`)
- Keep backward compat: if skill has no `category_id`, show `category` varchar value

### Step 4: Update skill form dialog

Modify `src/components/management/skill-form-dialog.tsx`:
- Add `category_id` select dropdown (populated from `skill_categories`)
- On save: include `category_id` in payload
- Keep `category` varchar for display name (set from selected category's name)

### Step 5: Add level expectations to position detail

Modify `src/app/dashboard/positions/[id]/page.tsx`:
- Fetch `level_skill_expectations` for this position
- Pass to client component

Modify `src/app/dashboard/positions/[id]/position-detail-client.tsx`:
- New section: "Level Expectations"
- Table grouped by level: skill name | expected score | mandatory flag
- Admin can add/remove expectations via inline form or dialog
- Non-admin sees read-only view

## Todo List

- [ ] Create `src/app/api/skill-categories/route.ts` (GET + POST)
- [ ] Create `src/app/api/skill-categories/[id]/route.ts` (PATCH + DELETE)
- [ ] Create `src/app/api/level-expectations/route.ts` (GET + POST + DELETE)
- [ ] Modify skills page to fetch and pass categories
- [ ] Update skills list client with structured category filter
- [ ] Update skill form dialog with category_id dropdown
- [ ] Add level expectations section to position detail page
- [ ] Fetch level expectations data in position detail server page
- [ ] Test: admin can CRUD categories
- [ ] Test: admin can add/remove level expectations on position
- [ ] Test: recruiter sees categories and expectations (read-only)
- [ ] Test: skills filter by category works

## Success Criteria

- Skill categories show as structured dropdown (not freeform)
- Admin can create/edit/delete categories
- Skills can be assigned to categories via form dialog
- Position detail shows level expectations table
- Admin can manage level expectations; recruiter sees read-only
- Backward compat: skills without `category_id` still display correctly

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Existing skills have freeform `category` but no `category_id` | Medium | Keep both columns; display `category` as fallback when `category_id` is null |
| Seed categories fail if no admin user | Low | `ON CONFLICT DO NOTHING` in migration, manual seed if needed |
| Position detail page becomes too long | Low | Use collapsible section for level expectations |

## Security Considerations

- `skill_categories`: admin write, all read (RLS enforced)
- `level_skill_expectations`: admin write, all read (RLS enforced)
- API routes use `requireAdmin()` for write operations
- Read APIs open to all authenticated users

## Next Steps

- Phase 8 (Admin Dashboard) may show skill gap summary
- Future: skill categories used in assessment question generation prompts
