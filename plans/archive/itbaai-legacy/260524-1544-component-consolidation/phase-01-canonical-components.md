# Phase 1 — Build Canonical Components (Atoms → Molecules)

**Priority:** After Phase 0 · **Risk:** Low (additive — new files, no migration yet) · **Status:** Pending

## Overview
Create the single canonical version of each pattern, flat in `src/components/ui/`. Each ≤200 LOC, token-based (design-guidelines §4.5). **Atomic order: build missing atoms FIRST, then compose molecules on them** — never hand-roll a molecule's internals. No feature migration here — build + verify in isolation.

## Step 1A — Missing ATOMS (build first; audited as reimplemented inline)
Foundational primitives the system lacks; molecules below depend on them.

- **`ui/table.tsx`** — shadcn-style `Table/TableHeader/TableBody/TableRow/TableHead/TableCell/TableCaption`. Header mono-uppercase (§7.8), row hover, `border-border` separators. **Base for `data-table`.** (6 raw `<table>` today.)
- **`ui/skeleton.tsx`** — pulse placeholder (`bg-white/[0.06] animate-pulse rounded`). Replaces 24 inline `animate-pulse`.
- **`ui/status-dot.tsx`** — 8px dot + glow ring, tones `ok/warn/err/live` (§7.7b). Replaces 22 inline dots. Tone via `lib/ui/status-tone`.
- **`ui/score-bar.tsx`** — `tabular-nums` value + threshold-colored track (>80 emerald, >65 amber, else rose) (§7.7b). Replaces 33 inline track+fill. (Distinct from `ui/progress`.)
- **`ui/field.tsx`** — form field molecule-atom: `label` + control slot (children) + `description` + `error` (aria-invalid wiring). Wraps `input/select/textarea`. Replaces 24 inline `<label>` patterns.
- **`ui/segmented.tsx`** — segmented control (§7.7d): pill track, active lifts to `surface-3`+`e-1`. Replaces `dashboard/dashboard-mode-tabs`.

## Step 1B — MOLECULES (compose on the atoms above)

### 1. `ui/kpi-card.tsx` (uses `status-dot` + `score-bar`/sparkline)
Replaces 6 KPI impls. Data-driven props:
```ts
interface KpiCardProps {
  label: string; value: string | number; icon?: LucideIcon;
  delta?: { value: number; direction: "up" | "down" | "flat" };  // emerald/rose/muted
  hint?: string;                 // muted context line ("tháng này")
  tone?: "default" | "ai";       // ai = violet accent
  sparkline?: number[];          // optional inline SVG
}
```
- Uses `Card` (`ui/card`), `tabular-nums` value (largest element), status dot optional.
- Colors via tokens only — **no `#FFB86C`** (map to amber `#FBBF24`).
- Pair with thin wrapper `ui/kpi-card-grid.tsx` (4-col responsive) if needed.

### 2. `lib/ui/status-tone.ts` + `ui/status-chip.tsx`
Single tone source of truth.
```ts
// lib/ui/status-tone.ts
type Tone = "info" | "success" | "warning" | "danger" | "ai" | "neutral";
export function statusTone(status: string): Tone   // maps domain statuses → tone
```
- `ui/status-chip.tsx` = thin wrapper over `ui/badge` taking `status` or explicit `tone` + label + optional dot.
- Replaces `crm/status-badge` (14 consumers) + 20 inline + 29 ad-hoc color files.

### 3. `ui/empty-state.tsx`
Props: `icon?`, `title`, `description?`, `action?` (ReactNode). Replaces `management/entity-empty-state` + 36 inline.

### 4. `ui/data-table.tsx` (built on `ui/table` atom; + `ui/data-table-pagination.tsx`)
Generalize from `crm/data-table` + `crm/data-table-pagination`, **rendering via `ui/table` primitive**:
- Generic `columns` + `rows`, inline chip/score support, right-align time cols, sticky first col option, empty → `ui/empty-state`.
- `question-bank-table` and inline `<table>` files become consumers (phase 2).

### 5. Adopt existing `ui/page-header.tsx`
Already exists, 0 uses. Verify it matches §7.4 (title+subtitle+actions+optional tabs); extend if needed. No new file.

## Related code files
- Create (atoms): `ui/table.tsx`, `ui/skeleton.tsx`, `ui/status-dot.tsx`, `ui/score-bar.tsx`, `ui/field.tsx`, `ui/segmented.tsx`
- Create (molecules + util): `ui/kpi-card.tsx`, `ui/kpi-card-grid.tsx`, `ui/status-chip.tsx`, `ui/empty-state.tsx`, `ui/data-table.tsx`, `lib/ui/status-tone.ts`
- Reference (do not modify yet): `crm/kpi-card.tsx`, `crm/data-table.tsx`, `crm/status-badge.tsx`, `crm/score-ring.tsx`, `management/entity-empty-state.tsx`, `dashboard/dashboard-mode-tabs.tsx`

## Todo
**Atoms (first):**
- [ ] `lib/ui/status-tone.ts` (enumerate all domain statuses from crm/status-badge + recruitment + question-bank)
- [ ] `ui/table.tsx`
- [ ] `ui/skeleton.tsx`
- [ ] `ui/status-dot.tsx`
- [ ] `ui/score-bar.tsx`
- [ ] `ui/field.tsx`
- [ ] `ui/segmented.tsx`

**Molecules (compose on atoms):**
- [ ] `ui/status-chip.tsx` (badge + status-tone)
- [ ] `ui/kpi-card.tsx` + `ui/kpi-card-grid.tsx` (status-dot + score-bar)
- [ ] `ui/empty-state.tsx`
- [ ] `ui/data-table.tsx` (on ui/table) + verify `ui/data-table-pagination.tsx`
- [ ] Verify/extend `ui/page-header.tsx`
- [ ] `npx tsc --noEmit` green

## Success criteria
- 6 atoms + 5 molecules + 1 util compile, each ≤200 LOC, token-based, no off-palette hex.
- Molecules render via atoms (data-table→table, kpi-card→status-dot/score-bar) — no internal hand-rolling.
- `status-tone` covers every status string currently mapped in features.

## Risk
- Low — additive. Risk = API not general enough → caught when phase 2 migrates first feature; iterate then.
