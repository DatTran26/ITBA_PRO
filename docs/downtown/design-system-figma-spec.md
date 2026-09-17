<!-- design-kit:generated — do not edit by hand; regenerate with generate_design_md -->
<!-- dsfp:01v4drke vars:117 text:14 paint:0 effect:6 components:0 -->

# Town Hown Design System — Live Figma Specification

- **Figma Document**: `Con Bo Cuoi` (Page: `Page 1`)
- **Visual Design Identity**: Deep Intelligence — Dark-first, Arctic Minimalist
- **Tokens Synchronized**: 117 Variables, 14 Text Styles, 6 Effect Styles
- **Boards On Canvas**: 6 Design System Boards + 1 Master Header (Width: 2600px)

---

## Canvas Layout & Board Registry

| Board | Node ID | Name | Position (x, y) | Dimensions (w × h) | Status |
|---|---|---|---|---|---|
| **Header** | `170:15` | TOWN HOWN DESIGN SYSTEM — MASTER HEADER | (0, 0) | 2600 × 128 | ✅ Complete |
| **Board 1** | `170:151` | FOUNDATIONS & DESIGN TOKENS | (0, 200) | 1260 × 1034 | ✅ Complete (0 audit issues) |
| **Board 2** | `170:357` | CONTROLS & FORM SYSTEM | (1320, 200) | 1260 × 774 | ✅ Complete (0 audit issues) |
| **Board 3** | `170:437` | CARDS, KPI METRICS & STATUS | (0, 1300) | 1260 × 932 | ✅ Complete (0 audit issues) |
| **Board 4** | `170:641` | DATA TABLES & METRICS | (1320, 1040) | 1260 × 1142 | ✅ Complete (0 audit issues) |
| **Board 5** | `170:1217` | APP SHELL & NAVIGATION | (0, 2300) | 1260 × 1378 | ✅ Complete (0 audit issues) |
| **Board 6** | `170:1470` | OVERLAYS, FEEDBACK & SURFACE STATES | (1320, 2300) | 1260 × 1454 | ✅ Complete (0 audit issues) |

---

## 1. Design Tokens (Figma Variables)

### 1.1 Surface Hierarchy (Dark Mode First)
- `th/background`: `#121A2E` (Default app backdrop)
- `th/canvas-immersive`: `#0A0F1E` (Darkest backdrop for analytics & deep work)
- `th/sidebar`: `#101828` (Sidebar background with subtle distinction)
- `th/card`: `#161E30` (Interactive cards, containers, panels)
- `th/popover`: `#1B2540` (Dropdowns, modals, floating popovers)
- `th/accent`: `#212C4A` (Active items, hovered controls, elevated pills)

### 1.2 Text & Foreground Hierarchy
- `th/foreground`: `#ECF0F7` (Primary high-contrast text, headings)
- `th/sidebar-foreground`: `#AEB9CC` (Secondary text, inactive menu items)
- `th/muted-foreground`: `#8B99B0` (Labels, captions, helper text)
- `th/text-dim`: `#5A6882` (Placeholders, disabled states, subtle metadata)

### 1.3 Brand & Semantic Accent Colors
- `th/primary`: `#5B6CF0` (Primary indigo brand color)
- `th/primary-light`: `#7C8FFF` (Hovered primary & active focus ring)
- `th/ai-insight`: `#A78BFA` (AI Copilot, suggestions, intelligence badges)
- `th/violet-light`: `#B48EFF` (AI active states & soft highlights)
- `th/accent-orange`: `#FFB86C` (Warm accents, cautionary highlights)
- `th/success`: `#34D399` (Passed checks, active status, success chips)
- `th/warning`: `#FBBF24` (Pending reviews, warnings, cautionary chips)
- `th/danger`: `#FB7185` (Critical alerts, destructive actions, error chips)

### 1.4 Radius Scale
- `th/radius-sm`: `6px` (Badge, tag, chip)
- `th/radius-md`: `8px` (Input field, select dropdown, button small)
- `th/radius-lg`: `10px` (Button medium, search input, segmented tab)
- `th/radius-xl`: `14px` (KPI Card, alert container)
- `th/radius-2xl`: `18px` (Large container, drawer panel)
- `th/radius-3xl`: `22px` (Modal dialog, flyout sheet)
- `th/radius-4xl`: `26px` (App shell window, hero frame)
- `radius/pill`: `999px` (Status pill, avatar, floating toggle)

### 1.5 Spacing Scale (4px Base Grid)
- `th/space-1`: `4px`
- `th/space-2`: `8px`
- `th/space-3`: `12px`
- `th/space-4`: `16px`
- `th/space-5`: `20px`
- `th/space-6`: `24px`
- `th/space-8`: `32px`

---

## 2. Local Typography Ramp (Figma Text Styles)

| Style Name | Font Family | Weight | Size (px) | Line Height | Role |
|---|---|---|---|---|---|
| `Town Hown/Display Page Title` | Outfit | Bold (700) | 28 | 36px | Page Titles, Hero Displays |
| `Town Hown/Display Section Title` | Outfit | SemiBold (600) | 22 | 28px | Section Headings, Drawer Headers |
| `Town Hown/UI Card Title` | Geist | SemiBold (600) | 16 | 22px | Card Titles, Modal Headers |
| `Town Hown/UI Control` | Geist | Medium (500) | 14 | 20px | Buttons, Form Inputs, Tabs |
| `Town Hown/Body Regular` | Plus Jakarta Sans | Regular (400) | 14 | 22px | Standard Body Paragraphs |
| `Town Hown/Body Small` | Plus Jakarta Sans | Regular (400) | 12 | 18px | Helper Text, Table Data, Secondary Body |
| `Town Hown/KPI Value` | Geist Mono | Bold (700) | 32 | 38px | High-impact Metrics, Tabular Values |
| `Town Hown/Micro Label` | Geist | SemiBold (600) | 10 | 14px | Status Chips, Badges, Table Headers |

---

## 3. Elevation & Effect Styles

| Style Name | Type | Radius | Offset (X, Y) | Color / Alpha | Description |
|---|---|---|---|---|---|
| `Town Hown/e1` | DROP_SHADOW | 2px | (0, 1) | `rgba(0, 0, 0, 0.40)` | Subtle border elevation for cards |
| `Town Hown/e2` | DROP_SHADOW | 24px | (0, 8) | `rgba(0, 0, 0, 0.45)` | Floating dropdowns, hover cards |
| `Town Hown/e3` | DROP_SHADOW | 60px | (0, 24) | `rgba(0, 0, 0, 0.55)` | Modal dialogs, drawer overlays |
| `Town Hown/glow` | DROP_SHADOW | 28px | (0, 8) | `rgba(91, 108, 240, 0.35)` | Primary CTA & AI Copilot ambient glow |

---

## 4. Component Inventory Rendered on Canvas

### Board 1 — Foundations & Design Tokens (`170:151`)
1. **Surface Ramp**: 6 stepped swatch cards illustrating the dark-first depth progression (`#121A2E` to `#212C4A`).
2. **Brand & Semantic Palette**: 8 swatch cards with hex codes, tokens, and contrast ratios.
3. **Typography Scale Ramp**: 7 typography specimen rows with font family, size, line-height, and sample text.
4. **Radius Scale**: 7 visual radius tokens from 6px to 26px and pill shape.
5. **Elevation Showcase**: 4 interactive card specimens illustrating `e1`, `e2`, `e3`, and `primary-glow`.

### Board 2 — Controls & Form System (`170:357`)
1. **Button Variants**: Primary CTA with glow, Secondary, Outline, Ghost, Destructive, AI Insight (with sparkles ✨).
2. **Button Interactive States**: Default, Hover, Active/Pressed, Focus-visible (with `#7C8FFF` 2px ring), Loading (`…`), Disabled.
3. **Form Controls**:
   - Default Input with label & placeholder
   - Focused Input with `#5B6CF0` glowing border
   - Invalid Input with error state & alert caption
   - Search Bar with inline keyboard shortcut (`⌘K`)
4. **Segmented Control, Checkbox, Toggle**:
   - 3-tab segmented switch (`Tổng quan`, `Chi tiết`, `Báo cáo`)
   - Checked, Unchecked, Disabled checkboxes with accessibility-compliant hit targets
   - Active switch with smooth `#5B6CF0` pill track.

### Board 3 — Cards, KPI Metrics & Status (`170:437`)
1. **Status-Tone Chips (Non-color reliant)**:
   - Pass (`● Đạt chuẩn` in `#34D399`)
   - Warning (`▲ Cảnh báo` in `#FBBF24`)
   - Danger (`✖ Thất bại` in `#FB7185`)
   - Info (`ℹ Thông tin` in `#5B6CF0`)
   - AI Insight (`✦ Phân tích AI` in `#A78BFA`)
2. **KPI Metric Cards (4-column Grid)**:
   - High-impact metrics (`98.4%`, `1,420`, `842.6K`, `0.32%`) in `Geist Mono` font.
   - Positive/negative trend badges (`+12.8%`, `+8.4%`, `+24.2%`, `-14.5%`).
   - Miniature visual trend bars.
3. **Composite Evaluation Card**:
   - Candidate / profile header with avatar & subtitle.
   - Skill tags (`React`, `TypeScript`, `Node.js`, `FastAPI`).
   - Match score indicator (`94/100`) and verification status.

### Board 4 — Data Tables & Metrics (`170:641`)
1. **Action Toolbar**: Search input, status filter pills (`Tất cả`, `Đã duyệt`, `Chờ xử lý`), and bulk action export button.
2. **Data Table Structure**:
   - Table header with sort arrows and column alignments.
   - 4 full data rows with selection checkboxes, avatar + name, role/department, status chip, right-aligned tabular scores, and action buttons (`···`).
   - Hovered row state demonstration (`#1B2540` background with subtle left indicator).
3. **Pagination Footer**: Item count counter (`Hiển thị 1-4 trên 1,420 bản ghi`), items-per-page selector, and pagination controls (`‹`, `1`, `2`, `3`, `›`).

### Board 5 — App Shell & Navigation (`170:1217`)
1. **Interactive App Shell Mockup (1260 × 640px)**:
   - Sidebar navigation (`240px`): Brand logo, menu items (`Dashboard`, `Hồ sơ ứng viên`, `Phân tích AI`, `Báo cáo`, `Cài đặt`) with active state (`#212C4A` + `#5B6CF0` pill), and user profile footer with quick logout.
   - Top Header Bar: Breadcrumb path, global search bar (`⌘K`), notification bell badge, AI copilot trigger button.
   - Content Canvas: Quick summary stats and welcome header.
2. **Floating Top Navigation Bar (Alternative Layout)**:
   - Horizontal pill bar with logo, menu tabs, search shortcut, and profile avatar.
3. **Visual Z-Index Hierarchy Ladder**:
   - Level 0: App Canvas / Background (`z-0`)
   - Level 10: Card & Panel Layer (`z-10`)
   - Level 20: Sticky Navigation & Header (`z-20`)
   - Level 40: Dropdown & Popover (`z-40`)
   - Level 50: Modal Scrim & Dialog (`z-50`)
   - Level 100: System Toast Notification (`z-[100]`)

### Board 6 — Overlays, Feedback & Surface States (`170:1470`)
1. **Modal Dialog on Scrim Backdrop**:
   - Scrim backdrop (`#0A0F1E` at 70% opacity).
   - Dialog window (`560px` width) with `Town Hown/e3` shadow.
   - Dialog header with icon, title, and close button (`✕`).
   - Body copy with warning callout box.
   - Footer action buttons (Secondary `Hủy bỏ` + Destructive `Xóa vĩnh viễn`).
2. **System Toast Notifications (z-[100])**:
   - Success Toast: Checkmark icon, success message, close button.
   - Error Toast: Alert icon, error description, retry button.
3. **Inline Alert Banners**:
   - Informational banner with icon and dismiss link.
   - Warning banner with action button.
4. **Data Surface Triad (Mandatory UX States)**:
   - **Skeleton Loading State**: Animated pulse placeholders for avatar, headline, lines of text.
   - **Empty State**: Empty folder icon illustration, helpful message, and "Tạo mới" call-to-action button.
   - **Error & Recovery State**: Disconnect/alert icon, error explanation, and "Thử lại ngay" button.

---

## 5. Offline Interactive Showcase Artifact
An offline, self-contained HTML/CSS/JS preview is available at:
`assets/showoff/town-hown-design-guidelines/index.html`

Features:
- Full interactive live demo of all 6 boards.
- Dark / Light mode toggle switch.
- Tab-based navigation across all sections.
- Zero external CDN dependencies (uses native modern CSS styling matching the design tokens).
