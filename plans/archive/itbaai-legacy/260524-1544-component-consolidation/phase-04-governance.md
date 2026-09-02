# Phase 4 — Governance (Prevent Re-drift)

**Priority:** Anytime after Phase 1 · **Risk:** None · **Status:** Pending

## Overview
The dupe problem recurs without a discoverable catalog + a reuse-first rule. Make the canonical set easy to find and make "create new component" a deliberate, last-resort step.

## Deliverables

### 1. `docs/component-index.md`
Reuse-first catalog. For each canonical component: name, import path, when-to-use, props summary, what it replaced. Sections:
- Primitives (`ui/`): button, card, badge, input, select, dialog, sheet, popover, tabs, tooltip, dropdown-menu, avatar, progress, switch, checkbox...
- Composites (`ui/`): kpi-card, kpi-card-grid, status-chip, empty-state, data-table, page-header, page-container.
- Utils: `lib/ui/status-tone`.
- "Before creating a component, search this index" banner at top.

### 2. CLAUDE.md — extend §5 UI Work
Add:
> Before creating any new component, **search `docs/component-index.md`**. Only create a new
> component if the need can't be met by composing existing primitives/composites. New shared
> patterns must be added to the index.

### 3. Lint / convention guard (choose one — see Unresolved)
- **Option A (light):** PR/review checklist item: "no inline `<table>`, no ad-hoc status colors, no inline empty-state when canonical exists."
- **Option B (enforced):** ESLint `no-restricted-syntax`/custom rule flagging raw `<table>` in `src/app`, hardcoded status hex (`#34D399|#FBBF24|#FB7185`) outside `lib/ui/status-tone` + token files.

## Todo
- [ ] Write `docs/component-index.md`
- [ ] Extend CLAUDE.md §5 with reuse-first mandate
- [ ] Decide + add lint guard (A or B)

## Success criteria
- `docs/component-index.md` lists every canonical component with import path.
- CLAUDE.md mandates index check before new component.
- Guard in place (checklist or lint).

## Risk
- None (docs/config). Over-strict lint could annoy — start with Option A, escalate to B if drift continues.
