# Brainstorm: Admin Role & Version Management

**Date:** 2026-03-26
**Source:** `admin_plan.md`
**Scope:** Full plan (all 9 feature areas)

---

## Problem Statement

The ITBA platform currently has a basic 2-role system (admin/recruiter) with minimal enforcement. The platform needs full admin governance: user management enhancements, version notification control, system settings, token monitoring, templates, reports/export, and skill framework improvements.

---

## Current State Analysis

| Component | Status | Notes |
|-----------|--------|-------|
| `users.role` column | Exists (`varchar DEFAULT 'recruiter'`) | Only checked in 2 places |
| User CRUD (create/delete/reset) | Working | `/api/users` + `/dashboard/users` |
| Version management page | Exists | Has pending/approved/rejected workflow |
| Notification bell | Working | Polls results + versions |
| Admin-only Settings link | Exists | navbar dropdown conditional |
| Supabase RLS | All tables | Owner-based policies |
| Dashboard modes | 2 modes | Recruitment / Employee |

---

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Permissions model | Simple role checks (admin/recruiter) | YAGNI — only 2 roles, no matrix needed |
| Version workflow | Keep existing + extend (add draft/archived) | Preserves current behavior, adds admin_plan states |
| Audit log | Skip for now | Defer to future phase, no blocking dependency |
| Settings storage | DB `system_settings` table (key-value) | Queryable, editable via UI, no redeploy |
| Export formats | CSV + Excel + PDF | Full export suite (`exceljs` + `@react-pdf/renderer`) |
| Token monitoring | Per-feature breakdown | Track by feature (generate, analyze, evaluate, etc.) |
| Templates | Assessment templates only | Highest ROI, save test configs as reusable templates |
| Admin dashboard | Third dashboard mode (Admin) | Extends existing segmented toggle, admin-only |
| Skill framework | Add categories + level mappings | New tables, builds on existing CRUD pages |
| DB migrations | One per feature area | Granular rollback, cleaner history |

---

## Recommended Architecture

### New Database Tables

1. **`system_settings`** — Key-value settings store
   - `id`, `key` (unique), `value` (jsonb), `category`, `description`, `updated_by`, `updated_at`

2. **`ai_usage`** — Token consumption tracking
   - `id`, `user_id`, `feature` (generate/analyze/evaluate/etc.), `model`, `tokens_in`, `tokens_out`, `cost_estimate`, `metadata` (jsonb), `created_at`

3. **`assessment_templates`** — Reusable test configurations
   - `id`, `name`, `description`, `job_role`, `level`, `question_count`, `time_limit`, `target_type`, `job_description`, `test_description`, `created_by`, `created_at`, `updated_at`

4. **`skill_categories`** — Skill grouping (Technical, BA, Soft Skills, etc.)
   - `id`, `name`, `description`, `display_order`, `created_by`, `created_at`

5. **`level_skill_expectations`** — Which skills expected at each level
   - `id`, `level` (intern/fresher/junior/etc.), `skill_id` (FK), `position_id` (FK, nullable), `expected_score`, `is_mandatory`, `created_by`, `created_at`

### Schema Changes (Existing Tables)

- **`versions`** — Add `draft` and `archived` statuses, add `category` (feature/improvement/bug-fix/etc.), add `visibility_scope`, add `created_by` FK
- **`skills`** — Add `category_id` FK to `skill_categories`

### New API Routes

| Route | Method | Purpose | Auth |
|-------|--------|---------|------|
| `/api/settings` | GET/PATCH | Read/update system settings | Admin only |
| `/api/ai-usage` | GET | Token usage stats + trends | Admin only |
| `/api/ai-usage/log` | POST | Internal — log token usage | Server-side only |
| `/api/templates` | GET/POST | List/create assessment templates | All authenticated |
| `/api/templates/[id]` | GET/PATCH/DELETE | Template CRUD | Owner or Admin |
| `/api/export/[type]` | GET | Export data (candidates/results/skills) | Admin only |
| `/api/skill-categories` | GET/POST | Category CRUD | Admin for write, all for read |
| `/api/skill-categories/[id]` | PATCH/DELETE | Category update/delete | Admin only |
| `/api/level-expectations` | GET/POST | Level-skill mapping CRUD | Admin only |

### New Pages/Components

| Page | Purpose |
|------|---------|
| Admin dashboard mode | Platform health widgets, token usage chart, user stats |
| `/dashboard/settings` | System settings UI (grouped by category) |
| `/dashboard/templates` | Assessment template library |
| Export buttons on list pages | CSV/Excel/PDF download triggers |
| Skill category management | Integrated into existing `/dashboard/skills` page |
| Level expectations editor | New tab or section on positions detail page |

### Admin Dashboard Widgets (3rd mode)

- Total Users (active/inactive breakdown)
- Total Assessments (by type: recruitment/employee)
- Token Usage Summary (chart: daily/weekly/monthly)
- Token Usage by Feature (pie/bar chart)
- Cost Estimate (based on model pricing)
- Platform Health (recent errors, pending jobs)
- Most Active Recruiters
- Most Tested Roles
- Latest Version Published
- Storage/quota indicators

### Version Workflow (Extended)

```
Draft → Published → Archived
         ↑
    (can unpublish back to Draft)
```

Keep existing `pending/approved/rejected` statuses AND add `draft/archived`:
- `draft` — Admin creates, not visible to anyone
- `pending` — Submitted for review (existing)
- `approved` → rename display to `published` — visible to all users
- `rejected` — Not approved (existing)
- `archived` — Hidden from active list, kept for history

### Export Implementation

- **CSV**: Native `TextEncoder` + streaming response, no dependencies
- **Excel**: `exceljs` package — formatted sheets with headers, styling, auto-width
- **PDF**: `@react-pdf/renderer` — React components → PDF document, styled reports

### Token Tracking Integration Points

Every AI API route needs a `logAiUsage()` call after OpenAI response:
- `/api/ai/generate` — question generation
- `/api/ai/regenerate` — question regeneration
- `/api/ai/analyze` — result analysis
- `/api/ai/analyze-result` — detailed result analysis
- `/api/ai/analyze-jd` — job description analysis
- `/api/ai/enhance-instruction` — instruction enhancement
- `/api/ai/evaluate-level` — level evaluation
- `/api/ai/generate-followup` — follow-up generation

---

## Implementation Phases (Recommended Order)

### Phase 1: Database Schema & Admin Enforcement
- New migration: `system_settings` table
- New migration: `ai_usage` table
- New migration: `assessment_templates` table
- New migration: `skill_categories` + `level_skill_expectations` tables
- New migration: Extend `versions` table (add statuses, category, visibility)
- New migration: Add `category_id` to `skills` table
- Add admin role checks to all admin-only API routes
- Update RLS policies for new tables

### Phase 2: System Settings
- Settings API route (GET/PATCH)
- Settings UI page (`/dashboard/settings`)
- Group settings by category (AI, Assessment, Scoring, Notification)
- Seed default settings values

### Phase 3: Version Management Enhancement
- Extend versions API with new statuses + category
- Update versions UI for draft/archive workflow
- Add category/tag selector
- Enforce admin-only write access (backend)
- Update notification bell for new statuses

### Phase 4: Token Usage Monitoring
- Create `logAiUsage()` utility function
- Integrate into all 8 AI API routes
- AI usage API route (aggregation queries)
- Admin dashboard: usage charts + cost estimates

### Phase 5: Assessment Templates
- Templates API routes (CRUD)
- Templates list page (`/dashboard/templates`)
- "Save as Template" button on test creation
- "Create from Template" option on dashboard

### Phase 6: Skill Framework Enhancement
- Skill categories API + UI integration
- Level expectations API + editor UI
- Integrate categories into skills list/detail pages
- Expected skills by level visualization

### Phase 7: Reports & Export
- CSV export utility (streaming)
- Excel export with `exceljs`
- PDF export with `@react-pdf/renderer`
- Export buttons on candidates, results, skills pages
- Admin-only export access

### Phase 8: Admin Dashboard Mode
- Add "Admin" to dashboard mode segmented toggle (admin-only)
- Admin KPI cards (users, assessments, tokens, health)
- Token usage chart component
- Platform health indicators
- Integrate all admin widgets

### Phase 9: Navigation & Polish
- Update navbar for admin-specific menu items
- Admin-only nav entries (Settings, Templates, Export)
- Update existing pages with admin-aware conditional rendering
- Final integration testing

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Token tracking adds latency to AI routes | Medium | Fire-and-forget insert (don't await), or use `waitUntil` |
| PDF generation memory usage | Low | Generate server-side with streaming, limit page count |
| Excel package size | Low | Dynamic import `exceljs` only when needed |
| Migration ordering dependencies | Medium | Test migrations sequentially, FK constraints must reference existing tables |
| Admin mode leaking to recruiters | High | Server-side mode filtering, never send admin data to non-admin clients |

---

## Dependencies (New Packages)

- `exceljs` — Excel file generation
- `@react-pdf/renderer` — PDF generation (or `jspdf` + `jspdf-autotable` for simpler approach)

---

## Success Criteria

- [ ] Admin can access all recruiter features + admin-only features
- [ ] Recruiter cannot access admin-only pages/APIs (enforced backend)
- [ ] Version CRUD restricted to admin (backend + UI)
- [ ] System settings editable via admin UI
- [ ] Token usage tracked per-feature with dashboard visualization
- [ ] Assessment templates saveable and reusable
- [ ] Skill categories and level expectations manageable
- [ ] CSV/Excel/PDF exports functional for key data
- [ ] Admin dashboard mode shows platform health metrics
- [ ] All new tables have RLS policies

---

## Resolved Questions

1. **Admin toggle visibility** → Completely hidden from recruiters. Only admin users see the 3rd mode.
2. **PDF export style** → Styled reports with branded headers, colored tables, summary sections. Professional output.
3. **Settings save behavior** → Immediate auto-save (debounced). No confirmation dialog.
4. **Token cost estimation** → Stored in `system_settings` table. Admin updates pricing via settings UI.
