# Phase 01 — Install & CSS Setup

## Overview
- **Priority**: P1 (blocks all other phases)
- **Status**: Completed
- **Effort**: ~1h

## Requirements

- Install `react-big-calendar` + `date-fns` (peer dep)
- Install `@types/react-big-calendar` for TypeScript
- Add dark-theme CSS override scoped to `.rbc-calendar` in `globals.css`
- Verify no Tailwind v4 conflicts

## Related Code Files

**Modify:**
- `package.json` — new deps
- `src/app/globals.css` — calendar theme overrides

**Create:** none in this phase

## Implementation Steps

### 1. Install packages

```bash
npm install react-big-calendar date-fns
npm install -D @types/react-big-calendar
```

### 2. Verify install

```bash
node -e "require('react-big-calendar'); console.log('ok')"
```

### 3. Add CSS overrides to `globals.css`

Append at the end of `src/app/globals.css`. Scope everything under `.rbc-calendar` to avoid bleed.

```css
/* ─── react-big-calendar dark theme ──────────────────────────────────────── */
.rbc-calendar {
  background: transparent;
  color: #ECF0F7;
  font-family: var(--font-body, sans-serif);
  font-size: 0.8125rem;
}

/* Grid lines */
.rbc-month-view,
.rbc-time-view {
  border-color: rgba(255, 255, 255, 0.06);
  border-radius: 0.75rem;
  overflow: hidden;
}

.rbc-header {
  background: rgba(255, 255, 255, 0.03);
  border-bottom-color: rgba(255, 255, 255, 0.06);
  padding: 0.5rem 0;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #5A6882;
}

.rbc-month-row,
.rbc-day-bg {
  border-color: rgba(255, 255, 255, 0.04);
}

.rbc-off-range-bg {
  background: rgba(0, 0, 0, 0.15);
}

.rbc-today {
  background: rgba(124, 143, 255, 0.06);
}

/* Date numbers */
.rbc-date-cell {
  padding: 0.375rem 0.5rem 0;
  text-align: right;
  font-size: 0.75rem;
  color: #8B99B0;
}

.rbc-date-cell.rbc-now > a {
  background: #7C8FFF;
  color: #fff;
  border-radius: 50%;
  width: 1.5rem;
  height: 1.5rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

/* Events */
.rbc-event {
  border: none !important;
  border-radius: 0.375rem;
  padding: 0.125rem 0.375rem;
  font-size: 0.6875rem;
  font-weight: 500;
  cursor: pointer;
}

.rbc-event:focus,
.rbc-event.rbc-selected {
  outline: 2px solid rgba(124, 143, 255, 0.5);
  outline-offset: 1px;
}

.rbc-event-label {
  font-size: 0.625rem;
  opacity: 0.75;
}

/* Week time grid */
.rbc-time-header-content,
.rbc-time-content {
  border-color: rgba(255, 255, 255, 0.06);
}

.rbc-timeslot-group {
  border-bottom-color: rgba(255, 255, 255, 0.04);
  min-height: 3rem;
}

.rbc-time-slot {
  font-size: 0.6875rem;
  color: #5A6882;
}

.rbc-current-time-indicator {
  background: #7C8FFF;
  height: 1.5px;
}

.rbc-current-time-indicator::before {
  background: #7C8FFF;
  border-radius: 50%;
  content: '';
  display: block;
  width: 0.5rem;
  height: 0.5rem;
  margin-top: -0.3125rem;
  margin-left: -0.25rem;
}

/* Show-more */
.rbc-show-more {
  color: #7C8FFF;
  font-size: 0.6875rem;
  font-weight: 600;
  background: transparent;
}

/* Toolbar — hidden (we build custom toolbar) */
.rbc-toolbar {
  display: none;
}
```

### 4. TypeScript check

```bash
npx tsc --noEmit
```

## Todo

- [x] Run `npm install react-big-calendar date-fns`
- [x] Run `npm install -D @types/react-big-calendar`
- [x] Append CSS overrides to `globals.css`
- [x] Run `npx tsc --noEmit` — no errors

## Success Criteria

- `react-big-calendar` importable with TypeScript types
- No TS errors
- `globals.css` has `.rbc-calendar` overrides

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Tailwind v4 CSS specificity conflict | Low | Medium | Use `.rbc-calendar` scope prefix on all overrides |
| `date-fns` version mismatch with react-big-calendar | Low | Low | Install latest; react-big-calendar v1 supports date-fns v3+ |
| SSR import error in Next.js | Medium | High | Use `dynamic(..., { ssr: false })` in phase 03 |
