---
phase: 3
title: Template editor UI (CodeMirror + Preview)
status: completed
effort: 1 day
branch: feat/email-templates/phase-03-template-editor
depends_on: [phase-02]
---

# Phase 3 — Template Editor UI

## Context Links
- Plan: [plan.md](plan.md)
- Brainstorm: decisions #4, #9 (Pre-defined variables, code editor + Preview)

## Overview

**Priority:** P0
**Description:** Templates tab in Settings page. List view shows 8 templates grouped by type (4 cards × 2 locale tabs). Click → editor: subject input + CodeMirror body editor + Preview tab + variable chips at bottom. Admin/super_admin only edit.

## Requirements

**Functional:**
- List view: 4 cards (one per template type) with vi/en sub-tabs each
- Click row → editor view (or modal)
- Editor: Subject field + Body CodeMirror (HTML mode) + Preview iframe (sanitized via DOMPurify)
- Variable chips: clickable, insert `{{ variable_name }}` at cursor
- Save: PATCH `/api/emails/templates/:id` (admin/super_admin only via API)
- Validation: parse `{{ }}` placeholders against schema, warn on unknown variable

**Non-functional:**
- Preview iframe sandbox: `sandbox="allow-same-origin"` (no scripts)
- HTML sanitized via `DOMPurify` server-side before save (prevent stored XSS)

## Architecture

### File: `src/lib/email/template-variables.ts`

```ts
export const TEMPLATE_VARIABLES = {
    schedule_interview: [
        "candidate_name", "position_name", "interview_date", "interview_time",
        "interview_location", "interview_type", "meeting_link",
        "interviewer_names", "company_name", "hr_name", "hr_email",
    ],
    interview_reminder: [
        "interviewer_name", "candidate_name", "position_name",
        "interview_date", "interview_time", "interview_location",
        "meeting_link", "candidate_cv_link",
    ],
    offer: [
        "candidate_name", "position_name", "salary", "start_date",
        "response_deadline", "company_name", "hr_name", "contract_link",
    ],
    onboard_confirm: [
        "candidate_name", "position_name", "start_date", "work_location",
        "manager_name", "items_to_bring", "hr_name", "contact_email",
    ],
} as const;

export type TemplateType = keyof typeof TEMPLATE_VARIABLES;
export const TEMPLATE_TYPES = Object.keys(TEMPLATE_VARIABLES) as TemplateType[];

export function variablesFor(type: TemplateType): readonly string[] {
    return TEMPLATE_VARIABLES[type];
}

export function extractUsedVariables(body: string): string[] {
    const matches = body.matchAll(/\{\{\s*([a-z_]+)\s*\}\}/g);
    return Array.from(new Set([...matches].map(m => m[1])));
}

export function findUnknownVariables(type: TemplateType, body: string): string[] {
    const used = extractUsedVariables(body);
    const known = new Set<string>(variablesFor(type));
    return used.filter(v => !known.has(v));
}
```

### Components

```
src/app/dashboard/emails/settings/
├── templates-tab.tsx              List view, grouped by type
├── template-editor.tsx            Editor (subject + body + preview + chips)
└── _components/
    └── code-editor.tsx            Wraps @uiw/react-codemirror with HTML mode
```

### API: PATCH `/api/emails/templates/:id`

```ts
// Auth: admin/super_admin only
// Body: { subject, body_html }
// Sanitize body_html with DOMPurify (server-side via 'isomorphic-dompurify')
// Validate: extractUsedVariables → must all be in variablesFor(type)
//   If unknown vars: return 400 with list (UI shows warning, does NOT block save —
//   user may want unknown placeholder)
// UPDATE email_templates SET subject=$1, body_html=$2, updated_by=$3, updated_at=NOW()
//   WHERE id=$4
```

## Related Code Files

**Create:**
- `src/lib/email/template-variables.ts`
- `src/app/dashboard/emails/settings/templates-tab.tsx`
- `src/app/dashboard/emails/settings/template-editor.tsx`
- `src/app/dashboard/emails/settings/_components/code-editor.tsx`
- `src/app/api/emails/templates/route.ts` (GET list)
- `src/app/api/emails/templates/[id]/route.ts` (PATCH)

**Modify:**
- `src/app/dashboard/emails/settings/page.tsx` (add Templates tab from Phase 2 scaffolding)

**Install:**
- `@uiw/react-codemirror` + `@codemirror/lang-html`
- `isomorphic-dompurify`

## Implementation Steps

1. Branch from phase-02
2. Install codemirror + dompurify deps
3. Create `template-variables.ts` schema module
4. Create code-editor wrapper component
5. Create templates-tab list view
6. Create template-editor (subject + body + preview iframe + chips)
7. Create GET/PATCH API routes with auth gate + sanitization
8. Wire Save → PATCH → success toast → refresh
9. Verify hr cannot PATCH (gets 403)
10. Build passes

## Todo List

- [ ] Branch from phase-02
- [ ] Install @uiw/react-codemirror + @codemirror/lang-html + isomorphic-dompurify
- [ ] Create template-variables.ts
- [ ] Create code-editor.tsx wrapper
- [ ] List view: 4 cards × 2 locales
- [ ] Editor: subject + body + preview + chips
- [ ] Variable chips clickable insert at cursor
- [ ] Preview iframe sandboxed
- [ ] DOMPurify on save
- [ ] GET /api/emails/templates
- [ ] PATCH /api/emails/templates/:id with auth gate
- [ ] Unknown variable warning (non-blocking)
- [ ] Manual: super_admin edits template, save persists
- [ ] Manual: hr gets 403 on PATCH
- [ ] Compile passes
- [ ] Commit + push

## Success Criteria

- List view shows 8 templates in 4 cards
- Editor saves subject + body to DB (sanitized)
- Preview renders HTML safely
- Variable chips insert correctly
- hr cannot save (UI hides editor; API returns 403)

## Risk Assessment

| Risk | L | I | Mitigation |
|------|---|---|------------|
| Stored XSS in template body | M | H | DOMPurify server-side on save; iframe sandbox in preview |
| CodeMirror bundle size large | M | M | Code-split; lazy load editor only when admin opens |
| Unknown variable typo silently ships | H | M | Linter warning in UI but NON-blocking (user override) |

## Next Steps

Phase 4 — Compose page (recipient picker + variable autofill + send-flow UI).
