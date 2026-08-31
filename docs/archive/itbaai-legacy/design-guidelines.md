# ITBA.AI Design Guidelines

> **Canonical direction: "Deep Intelligence" — dark-first, Arctic Minimalist.**
> The app shell is forced dark (`<html class="dark">` in `src/app/layout.tsx`) and all
> tokens live in `src/app/globals.css`. The legacy light-enterprise shared components
> (`src/components/shares/*`) are **deprecated** and slated for migration to these tokens
> (see §15). New work MUST follow the dark system below.

---

## 1) Design Principles

- **Dark-first, single theme.** The product ships dark-only. Light (`:root`) tokens exist but are dormant; do not design for a light workspace.
- **Arctic Minimalist.** Deep navy/ebony surfaces (`#121A2E`/`#0A0F1E`), restrained glass, indigo accents (`#5B6CF0`/`#7C8FFF`). Calm, premium, low-noise.
- **Clarity over decoration.** Navigation + KPI must be scannable in <3s; data legible before any glass/gradient flourish.
- **Palette discipline.** The semantic CSS tokens in `globals.css` are now reconciled to the premium indigo/navy palette (§4.1/§4.5). **Prefer tokens** (`bg-background`, `bg-card`, `bg-primary`, `text-muted-foreground`, `border-border`) over new hardcoded hex — `bg-primary` now renders indigo `#5B6CF0`. Legacy hardcoded hex still matches the palette and migrates opportunistically.
- **Consistent shell.** Sidebar + content-header (or floating topnav) stay identical across pages.
- **Progressive density.** Compact but breathable, especially on table-heavy screens.

## 2) Foundations

- **Framework:** Next.js (App Router) + React, Tailwind CSS v4 (`@import "tailwindcss"` + `@theme inline`).
- **Components:** shadcn-style primitives built on **Base UI** (`@base-ui/react/*`), in `src/components/ui/`.
- **Color space:** OKLCH for all theme tokens.
- **Animation:** `tw-animate-css` + `motion-wrapper`. Subtle, 200–700ms easing; no dramatic motion.
- **Locale:** `lang="vi"`; UI copy primarily Vietnamese.

## 3) Layout System

### 3.1 App Shell
Two layout modes, selected via `data-ui-layout`:
- **Sidebar mode** (`data-ui-layout="sidebar"`): persistent left nav + sticky content-header strip (~48px). `--page-top: 1.5rem`.
- **Topnav mode** (default): floating navbar. `--page-top: 5rem` (room for the floating bar).
- Pages read `pt-[var(--page-top)]` to stay layout-aware without context wiring.

Sidebar surface uses `.glass-card-sidebar` (full-height, stronger fill, `backdrop-blur-xl`, right border).

### 3.2 Spacing Scale
4px base: `4, 8, 12, 16, 20, 24, 32`.
- Card inner padding: `20–24px` (`p-5`/`p-6`).
- Section gaps: `16–24px`.
- Micro gaps (label/chip/icon): `6–10px`.
- Table row rhythm: comfortable ~`20px`.

### 3.3 Grid
- KPI strips: 4 equal columns (`md:grid-cols-2 lg:grid-cols-4`).
- Mid-content split: `2/3 + 1/3`.
- Lower analytics: `1/2 + 1/2`.
- Gutter `16–20px` (`gap-4`/`gap-5`).

## 4) Color System

> **Reconciled (2026-05):** the `.dark` tokens in `globals.css` now hold the premium hex
> palette — `--background #121A2E`, `--card #161E30`, `--popover #1B2540`, `--accent #212C4A`,
> `--primary #5B6CF0` (indigo), `--ring #5B6CF0`, `--sidebar #101828`. Token NAMES are kept
> (shadcn), so `bg-card`/`bg-primary`/`text-muted-foreground` resolve to the shipped palette.
> §4.1 is the canonical palette; §4.5 maps each token to its hex. Immersive/test screens still
> use the deeper `#0A0F1E` via `PremiumBackground`.

### 4.1 Rendered Palette (canonical in practice — premium)

**Surface elevation ramp** (lightness increases with depth — never one flat card color):

| Role | Hex | Where |
|---|---|---|
| Canvas — immersive | `#0A0F1E` | test-taking, profile, create-test (`PremiumBackground`) |
| Canvas — app shell | `#121A2E` | dashboard, login, users, results, interview-room |
| Surface-1 — card | `#161E30` | default card/panel (was `#151D2E`) |
| Surface-2 — raised | `#1B2540` | popover, raised, card hover |
| Surface-3 — overlay | `#212C4A` | dropdown, segmented active, deepest hover |
| Sidebar | `#101828` | nav shell |

**Accent & text:**

| Role | Hex | Where |
|---|---|---|
| **Primary — Indigo** | `#5B6CF0` | active tab, CTA fill, focus, selected line |
| Primary light | `#7C8FFF` | gradient tail, icons, code, borders |
| **AI — Violet** | `#A78BFA` | AI insight/feature accent, chips |
| Violet light | `#B48EFF` | brand heading gradient tail |
| **Secondary — Orange** | `#FFB86C` | secondary accent / "pending" KPI emphasis (token `--accent-orange`, `bg-accent-orange`) |
| Success — Emerald | `#34D399` | passed, positive delta, live |
| Warning — Amber | `#FBBF24` | pending review |
| Danger — Rose | `#FB7185` | failed, destructive |
| Text — primary | `#ECF0F7` | foreground |
| Text — secondary | `#AEB9CC` | body emphasis on dark |
| Text — muted | `#8B99B0` | secondary/labels |
| Text — dim | `#5A6882` | dimmest labels, axis ticks |
| Border / strong | `white/7` / `white/12` | hairlines / emphasized borders |
| Highlight (inset top) | `white/6` | premium card top edge |

**Gradients:** CTA/primary `135° #5B6CF0→#7C8FFF` · brand heading `135° #7C8FFF→#A78BFA→#B48EFF` · avatar iris `135° #6E7BFF→#A57BFF`.
**Mesh decor** (over `#121A2E`, `opacity-60`): `#5B6CF0/8`, `#7C8FFF/5`/`#A78BFA/6`, `#34D399/3` blurred orbs.
**Status tints** (chips/alerts): each status color @ ~14% alpha fill + full-strength text/icon.

### 4.2 Semantic Status (dark-tuned)
Standardize status with these tones (chips/badges/alerts use ~14% tint + full-strength text):
- **Success:** Emerald `#34D399`.
- **Warning:** Amber `#FBBF24`.
- **Error/Danger:** Rose `#FB7185`.
- **Info:** Indigo `#5B6CF0`.
- **AI / insight:** Violet `#A78BFA`.

### 4.3 Gradients, Glow & Tints
- **CTA / primary gradient:** `135° #5B6CF0 → #7C8FFF` (active states use solid `#5B6CF0`).
- **Brand heading gradient:** `135° #7C8FFF → #A78BFA → #B48EFF` (`.gradient-text`) — never large flat fills.
- **Avatar iris gradient:** `135° #6E7BFF → #A57BFF`.
- **Primary glow:** `0 8px 28px rgba(91,108,240,.35)` — CTA / focus emphasis.
- **Cyan glow:** `rgba(0,242,255,*)` — `.cyan-pulse` only (immersive/test).
- **Surface ramp:** `#101828` sidebar · `#121A2E` canvas · `#161E30` surface-1 · `#1B2540` surface-2 · `#212C4A` surface-3.

### 4.4 Usage Rules
- Indigo `#5B6CF0` = primary CTA, active tab/nav, focus ring, selected data line.
- Indigo→Purple gradient = headings/brand emphasis — never large flat fills.
- Emerald/amber/rose strictly semantic; never decorative.
- Large saturated backgrounds are prohibited except thin status banners/toasts and small chips.
- Don't introduce new accent colors without mapping them to a semantic role.

### 4.5 Semantic Tokens (globals.css `.dark` — canonical, reconciled to hex)
These now hold the premium palette directly. Use the token; the hex is what it resolves to.

| Token | Hex | Role |
|---|---|---|
| `--background` | `#121A2E` | canvas / app shell |
| `--foreground` | `#ECF0F7` | primary text |
| `--card` / `--card-foreground` | `#161E30` / `#ECF0F7` | surface-1 (default card) |
| `--popover` / `--secondary` / `--muted` | `#1B2540` | surface-2 / raised fill |
| `--muted-foreground` | `#8B99B0` | secondary/label text |
| `--accent` | `#212C4A` | surface-3 / overlay/hover |
| `--primary` / `--primary-foreground` | `#5B6CF0` / `#FFFFFF` | indigo CTA/active/focus |
| `--destructive` | `#FB7185` | error/danger (rose) |
| `--accent-orange` | `#FFB86C` | sanctioned secondary accent (peach) — `bg-accent-orange`/`text-accent-orange` |
| `--border` / `--input` | `white/8%` / `white/12%` | hairline / control border |
| `--ring` | `#5B6CF0` | indigo focus ring |
| `--sidebar` / `--sidebar-primary` | `#101828` / `#5B6CF0` | nav shell / active accent |

Chart series (`--chart-1..5`) are a blue→indigo ramp (`oklch ~0.81→0.42`, hue 251–266).
**Not yet tokenized:** `#7C8FFF` (primary-light), `#A78BFA`/`#B48EFF` (AI violet), `#5A6882`
(text-dim), `#0A0F1E` (immersive) — use the sanctioned hex (§4.3) until promoted to tokens.

## 5) Typography

### 5.1 Font Stack
Defined in `@theme inline`:
- `--font-sans`: **Geist** (+ system fallback) — base UI text (`font-sans` on `<html>`).
- `--font-mono`: **Geist Mono** — code, IDs, metrics where monospacing helps.
- `--font-display`: **Outfit** (`--font-outfit`) — headings / hero (body sets `font-body`/display).
- `--font-body`: **Plus Jakarta Sans** (`--font-plus-jakarta-sans`) — long-form body.

> ✅ Resolved (2026-05): `layout.tsx` loads all four via `next/font/google` (Geist, Geist Mono,
> Outfit, Plus Jakarta Sans). Outfit + Plus Jakarta include the `vietnamese` subset (app is `lang="vi"`).
> `--font-sans`/`--font-mono` map to `var(--font-geist)`/`var(--font-geist-mono)`. The old Roboto
> `.ttf` files in `public/fonts/` are now unused and can be removed.

### 5.2 Type Scale
- **Page title:** `28px` / `700`, lh `34–36`.
- **Section title:** `22px` / `600–700`, lh `28`.
- **Card title:** `16–18px` / `600–700`, lh `22–24`.
- **Metric value:** `28–36px` / `700`, tight lh (largest element in a KPI card).
- **Body large:** `14px` / `400–500`, lh `20`.
- **Body:** `13.5px` / `400`, lh `18–20`.
- **Small:** `12px` / `400–500`, lh `16`.
- **Caption:** `11px` / `400–500`, lh `14–16`.
- **Micro:** `10px`, dense labels only.

### 5.3 Text Behavior
- Sentence-case for labels; uppercase + `letter-spacing: 0.08em` for table headers/eyebrows only.
- Numeric emphasis 600–700.
- Use `text-muted-foreground` (`#8B99B0`) for context lines (timestamps, "this month", hints).
- Headings may use `.gradient-text` for brand moments — sparingly.

## 6) Radius & Elevation

### 6.1 Radius Scale (`--radius: 0.625rem` = 10px base)
`sm 6px (×0.6) · md 8px (×0.8) · lg 10px · xl 14px · 2xl 18px · 3xl 22px · 4xl 26px`.
- Controls (buttons/inputs): `lg` (`rounded-lg`).
- Cards / glass surfaces: `2xl`.
- Bento / feature panels: `~2.5rem` (`.bento-card`).
- **Never mix different card radii in one viewport.**

### 6.2 Elevation & Surfaces (premium)
**Shadow ramp** (dark shadows + accent glow — use consistently, no ad-hoc values):
- `e-1` `0 1px 2px rgba(0,0,0,.4)` — default card.
- `e-2` `0 8px 24px rgba(0,0,0,.45)` — popover, card hover.
- `e-3` `0 24px 60px rgba(0,0,0,.55)` — modal, sheet.
- `glow` `0 8px 28px rgba(91,108,240,.35)` — primary CTA / focus emphasis only.

**Premium card recipe:** `bg surface-1` + `1px border white/7` + **inset top-highlight** `inset 0 1px 0 white/6` + `e-1`. On hover: lift to `surface-2`, `border white/12`, `e-2`, `translateY(-2px)` (200–250ms).

**Surface utilities** (`globals.css @layer utilities`):
- `.glass-card` — primary panel (update fill to `surface-1 #161E30`): `backdrop-blur-md`, hairline border, `rounded-2xl`. Pair with `.glass-card-hover`.
- `.glass-card-sidebar` — sidebar shell: stronger fill, `backdrop-blur-xl`.
- `.liquid-glass` — ultra-light glass: `bg white/3`, `backdrop-blur-16px`, `border white/8`.
- `.bento-card` — large feature blocks: rounded-2.5rem, hover lift.
- `.pro-icon-box` — `40×40` icon container: `rounded-xl`, gradient fill, inner ring.
- `.cyan-pulse` — cyan glow (immersive/test only); `.bg-radial-vignette` — depth behind hero.

## 7) Components

Built on Base UI primitives in `src/components/ui/`. Style via the variant systems (CVA) already present; extend variants instead of inlining long class strings.

### 7.0 Reuse-First Rule (MANDATORY)
**Before creating any new component, search the canonical inventory and reuse/compose it.** Do not re-implement a pattern that already exists.
- **Inventory:** `docs/component-index.md` (catalog of primitives + composites with import paths). If a component fits, import it; if it almost fits, extend its variants/props — don't fork.
- **Canonical layer lives flat in `src/components/ui/`:** primitives (`button`, `card`, `badge`, `input`, `select`, `dialog`, `sheet`, `popover`, `tabs`, `tooltip`, `dropdown-menu`, `avatar`...) **and** shared composites (`kpi-card`, `status-chip`, `empty-state`, `data-table`, `page-header`, `page-container`).
- **Status colors** come only from `lib/ui/status-tone` → `ui/status-chip` — never hardcode `#34D399/#FBBF24/#FB7185` per-feature.
- **No inline re-creation:** no ad-hoc `<table>`, KPI card, empty-state, or status chip when a canonical one exists. Feature-specific data → write a small mapper in the feature, not a new shared component.
- **Only create new** when the need can't be met by composing existing pieces; then add it to `component-index.md` so the next dev finds it.
- Keep files ≤200 LOC; split monoliths into co-located `*-section.tsx`/`*-row.tsx` rather than growing one file.

> Status: canonical composites + `component-index.md` are being established via the consolidation plan (`plans/260524-1544-component-consolidation/`). Until merged, prefer existing `ui/*` primitives + `.glass-card`.

### 7.1 Button (`ui/button.tsx`)
Canonical sizes are compact: `default h-8`, `xs h-6`, `sm h-7`, `lg h-9`, plus `icon*`. `rounded-lg`.
Variants: `default` (bg-primary), `outline`, `secondary`, `ghost`, `destructive` (tinted, not solid red), `link`. Focus = `ring-3 ring-ring/50`. Active nudges `translate-y-px`.

### 7.2 Sidebar
Dark vertical nav, grouped sections. Active item = darker pill + indigo (`--sidebar-primary`) accent. Collapsible submenus (chevrons), count badges for operational items. Collapse state persists via cookie (`sidebar-collapse-cookie`).

### 7.3 Topnav / Content Header
Floating navbar (topnav mode) or sticky content-header (sidebar mode). Left: breadcrumb (`page-breadcrumb`). Right: utility actions + user dropdown (`navbar-user-dropdown`), notification bell. Low visual weight vs page content.

### 7.4 Page Header (`ui/page-header.tsx`)
Title + subtitle, right-aligned actions: secondary + primary CTA. Optional tab row beneath.

### 7.5 Tabs
Underline active tab in primary cyan; inactive muted. No heavy container.

### 7.6 Cards
Use `.glass-card` (or `Card` from `ui/card.tsx` mapped to `--card`). Header separated by `border-border` hairline when card has body data.

### 7.7 KPI Blocks (premium)
Structure: label + status dot → metric value (largest, `tabular-nums`) → delta with arrow `↗`/`↘` (emerald/rose) → sparkline. Sparkline = SVG line (1.6px, primary/series color) over a vertical-gradient area fill (color @ ~30% → 0%). Fixed heights to avoid layout jump.

### 7.7b Status Dot · Score Bar · Funnel
- **Status dot:** 8px circle + glow ring `0 0 0 3px {color}/18`. Tones: ok (emerald), warn (amber), err (rose), live (indigo, subtle pulse animation).
- **Score bar:** `tabular-nums` value + 56–60px track (`white/8`) with fill colored by threshold (>80 emerald, >65 amber, else rose).
- **Funnel bar:** label + `tabular-nums` count over a track; fill = primary, decreasing `opacity` per stage (1 → .8 → .6 → .45).

### 7.7c Avatar (`ui/avatar.tsx`)
Circle. Variants: **gradient iris** (`#6E7BFF→#A57BFF`, white text) for the signed-in user; **tint** (`primary-bg`, `primary-l` text) for candidates/initials. Online dot = emerald with 2px border matching surface.

### 7.7d Segmented Control
Pill track (`white/4` + hairline), active segment lifts to `surface-3` + `e-1`. For mode switches (e.g., dashboard role tabs HR/Interviewer/Recruitment/Admin).

### 7.8 Tables
Header row: muted fill, uppercase rhythm, `letter-spacing 0.08em`. Row separators = `border-border` (1px, white/8%). Inline status chips. Right-align time/activity columns.

### 7.9 Chips / Badges (`ui/badge.tsx`)
Rounded capsules, low-saturation fills, semantic tones (info/success/warning/danger). Always pair color with text/icon.

### 7.10 Forms & Inputs
`ui/input`, `ui/textarea`, `ui/select`, `ui/checkbox`, `ui/switch`, `ui/label`. Borders use `--input` (white/10%). Focus ring `--ring`. Validation via `aria-invalid` (destructive border + ring). Group filters on one row when possible.

### 7.11 Overlays
`ui/dialog`, `ui/sheet`, `ui/popover`, `ui/dropdown-menu`, `ui/tooltip`. Surfaces use `--popover`. Provide `TooltipProvider` (already at root).

### 7.12 Feedback
- **Toasts:** `sonner` (`richColors`, `top-right`) — see `ui/sonner.tsx`. Standardize success/warn/error/info.
- **Alerts:** `ui/alert.tsx`. **Progress:** `ui/progress.tsx`. **Loading:** `ui/ai-loader.tsx`, skeletons.
- **App update banner:** `ui/app-update-banner` (global, root-mounted).

### 7.13 Atmosphere / Decorative
`background-orbs`, `neural-network`, `premium-background` — ambient backdrops for marketing/auth/hero. Keep behind a vignette; never reduce content legibility.

## 8) Data Visualization
> **No chart library** — charts/sparklines are hand-rolled inline **SVG** (see `src/components/dashboard/*`). Don't add a chart lib (recharts/tremor) without a design decision. `react-big-calendar` is the only data-display dependency (calendar only).
- **Line/Area:** primary series in indigo `#5B6CF0`/`#7C8FFF`; vertical-gradient area fill (color @ ~30% → 0%); sparse, very light grid (`white/4–6%`). Pass/fail charts use emerald `#34D399` / rose `#FB7185`.
- **Sparkline:** axis-less, one color per metric context.
- **Funnel/Progress:** horizontal bars, neutral track + colored fill, show value + %.
- **Heatmap:** blue/indigo intensity ramp (chart-1→5), legend Less→More.
- **Calendar:** `react-big-calendar` themed dark (see `globals.css` `.rbc-*`): accent `#7C8FFF`, hairlines `white/4–6%`, muted labels `#5A6882`/`#8B99B0`.

## 9) Interaction States
- **Hover:** subtle bg/border tint (`.glass-card-hover`), 200–300ms; no dramatic motion.
- **Active/Selected:** cyan underline or accent border.
- **Focus:** visible ring (`ring-ring/50`, `ring-3`) — never remove outlines.
- **Disabled:** `opacity-50`, `pointer-events-none`.

## 10) Iconography
**Library: `lucide-react`** — line icons, consistent stroke. Default size `size-4` (16px); inside `.pro-icon-box` for emphasis. Icons support nav/context, not decoration overload. Pair icon + text (+ optional count chip). Do not use emoji as system icons.

## 11) Accessibility Baseline
- WCAG AA contrast on dark surfaces — verify `--muted-foreground` text against `--card`/`--background`.
- Click target ≥ `36–40px` even with compact button defaults (use `lg`/`icon-lg` for primary touch actions).
- Never color-only meaning; combine with icon/text.
- Full keyboard nav (Base UI provides primitives) across sidebar, tabs, filters, table actions, overlays.
- Respect `prefers-reduced-motion` for ambient animations.

## 12) Responsive Behavior
- Desktop-first. At narrower widths: collapse sidebar to icon rail, push secondary actions to overflow, stack chart panels, keep tables horizontally scrollable (sticky first column when needed).

## 13) Scrollbar & Misc
- Custom thin scrollbar: `6px`, thumb `#8B99B0/20` → `/30` on hover, transparent track.
- Global border default = `border-border`; outline = `outline-ring/50` (set in `@layer base`).

## 14) Design Tokens (starter — rendered palette)
Hex values as actually shipped (for design-tool sync).
```
color.bg.app         = #121A2E    /* dashboard/login shell */
color.bg.immersive   = #0A0F1E    /* test/profile (PremiumBackground) */
color.bg.sidebar     = #101828
surface.1.card       = #161E30
surface.2.raised     = #1B2540
surface.3.overlay    = #212C4A
color.text.primary   = #ECF0F7
color.text.secondary = #AEB9CC
color.text.muted     = #8B99B0
color.text.dim       = #5A6882
color.brand.primary  = #5B6CF0    /* indigo — CTA/active/focus */
color.brand.primary2 = #7C8FFF
color.brand.ai       = #A78BFA    /* violet — AI/insight */
color.brand.grad.cta = #5B6CF0 → #7C8FFF
color.brand.grad.head= #7C8FFF → #A78BFA → #B48EFF
color.success        = #34D399    /* emerald */
color.warning        = #FBBF24    /* amber */
color.danger         = #FB7185    /* rose */
color.border.default = rgba(255,255,255,0.07)   /* strong .12 · highlight .06 */
elevation = e1 0 1px 2px /.4 · e2 0 8px 24px /.45 · e3 0 24px 60px /.55 · glow 0 8px 28px rgba(91,108,240,.35)
radius.base = 10px  (sm 6 · md 8 · lg 10 · xl 14 · 2xl 18 · 3xl 22 · 4xl 26)
space = 4·8·12·16·20·24·32
```

## 15) Legacy & Migration (light shared components)
The `src/components/shares/*` family (`SharedDashboardButton`, `SharedDashboardCard`,
`SharedKpiCard`, `SharedStatusChip`, `SharedFilterBar`, `SharedDataTableShell`,
`SharedEmptyState`, `SharedDashboardPageHeader`, `SharedDashboardTabs`, `SharedIconButton`)
hardcode the **deprecated light palette** (`#FFFFFF`, `#E5E8EE`, `#1D1F31`, `#056DFF`).
They render off-theme inside the dark shell.

**Migration rules going forward:**
- Do **not** build new screens on the light shared components as-is.
- Replace hardcoded hex with semantic tokens: `bg-white→bg-card`, `border-[#E5E8EE]→border-border`, `text-[#1D1F31]→text-foreground`, `text-[#56586E]/#83899A→text-muted-foreground`, `#056DFF→bg-primary/text-primary`.
- Status chip tones → map to semantic success/warning/danger/info using token-based tints.
- Prefer `ui/*` primitives (`Button`, `Card`, `Badge`) + `.glass-card` over the legacy shells until the shared set is refactored to tokens.

## 16) Do / Don't
- **Do** keep the shell identical across pages; use semantic tokens; keep one card radius per viewport; use the surface utilities (`.glass-card`, `.bento-card`) for elevation.
- **Do** keep numbers/statuses maximally legible over glass.
- **Don't** hardcode hex outside the sanctioned accent set (§4.3); don't introduce light-mode surfaces; don't add accent colors without a semantic mapping; don't use decorative chart styling that hurts legibility; don't remove focus outlines.

## 17) Handoff Checklist
- All pages share sidebar/topnav/content-header + tab behavior.
- Surfaces use tokens or documented glass utilities (no stray white cards).
- Primary CTA = Indigo `#5B6CF0` (gradient `#5B6CF0→#7C8FFF`); focus rings present.
- KPI cards baseline-aligned, fixed height; metric value is the largest element.
- Table headers/rows/chips unified; chart palette = blue/indigo ramp.
- Toast/alert states standardized (success/warn/error/info).
- Fonts resolve to Geist (sans) / Outfit (display) / Plus Jakarta (body) / Geist Mono — see §16 gap.

## 18) Layering · Motion · Breakpoints

### 18.1 Z-index Ladder
Use these named tiers (not ad-hoc values). Audit found sprawl (`z-[998]`, `z-[110]`, `z-[9999]` mixed with `z-10/50`) — standardize to:

| Tier | Tailwind | Use |
|---|---|---|
| base | `z-0` / `z-10` | in-flow content, raised cards |
| sticky | `z-20` | sticky content-header, table sticky col |
| sidebar | `z-30` | persistent sidebar / rail |
| floating-nav | `z-40` | floating topnav |
| overlay | `z-50` | dropdown, popover, tooltip, dialog, sheet (Base UI default) |
| toast | `z-[100]` | sonner toasts |
| app-banner | `z-[9999]` | global app-update banner (always top) |

Don't invent intermediate arbitrary values; pick the closest tier. Overlays from Base UI already sit at `z-50` — layer nested overlays via portals, not higher z.

### 18.2 Motion (`framer-motion` + `tw-animate-css`)
- **Durations:** micro `150ms` (hover/press) · standard `200–300ms` (enter/expand, card lift) · ambient `500–700ms` (orbs/hero). Never exceed `700ms` for functional UI.
- **Easing:** standard `cubic-bezier(0.4, 0, 0.2, 1)` (ease-out feel) for most; `cubic-bezier(0.16, 1, 0.3, 1)` for overlay enter (soft overshoot). Linear only for spinners.
- **Patterns:** fade+rise (`opacity 0→1`, `translateY 4–8px→0`) for content; scale `0.98→1` for overlays; list stagger `~40ms`/item, cap ~6 items. No dramatic slides/bounces.
- **Always respect `prefers-reduced-motion`** — disable ambient animation and reduce transitions to opacity-only.

### 18.3 Breakpoints (Tailwind defaults — desktop-first)
`sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536` (px).
- **< lg (1024):** sidebar collapses to icon rail (or off-canvas sheet); KPI grid `lg:grid-cols-4` → `md:grid-cols-2` → 1 col.
- **< md (768):** stack 2/3+1/3 splits; tables scroll horizontally with sticky first column; secondary actions move to overflow menu.
- Charts/bento panels stack vertically below `md`.

## Unresolved Questions
- ✅ **Token vs. hardcode divergence (resolved 2026-05):** `.dark` tokens now hold the premium hex palette (`--primary #5B6CF0`, `--background #121A2E`, etc.); token names kept so `bg-primary`/`bg-card` resolve correctly. New work uses tokens; ~4.2K legacy hardcoded hex still match the palette and migrate opportunistically (not a blanket codemod).
- ✅ **Font loading (resolved 2026-05):** `layout.tsx` loads Geist/Geist Mono/Outfit/Plus Jakarta via `next/font/google`. Note: Outfit uses `latin`/`latin-ext` (no `vietnamese` subset — VN diacritics live in latin-ext); Plus Jakarta uses `vietnamese`.
- **Canvas split:** `#121A2E` (shell) vs `#0A0F1E` (immersive/test) — confirm intended boundary and whether to unify.
- **Light tokens dormant:** `:root` (light) values are unused given forced `.dark`. Keep for a future toggle, or remove?
- **Shared components migration timeline:** when to refactor `src/components/shares/*` to dark tokens vs. deprecate/replace.
- **Promote remaining hex to tokens?** `#7C8FFF` (primary-light), `#A78BFA`/`#B48EFF` (AI violet), `#5A6882` (text-dim), `#0A0F1E` (immersive) have no token yet — decide whether to add (`--primary-light`, `--ai`, etc.) to kill the last hardcoded accents.
- **A11y contrast not yet measured:** verify `--muted-foreground #8B99B0` and `--text-dim #5A6882` against `--card #161E30`/`--background #121A2E` meet WCAG AA, and record the ratios here.
