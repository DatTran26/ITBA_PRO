# Component Index — Reuse-First Catalog

> **Before creating any component, search this file and reuse/compose what exists.**
> Only create new when the need can't be met by composing these. New shared patterns
> MUST be added here. See `docs/design-guidelines.md` §7 for styling specs.
> All live in `src/components/ui/` (flat). Token-based, dark-first.

## Reuse checklist (PR review)
- [ ] No raw `<table>` when `ui/table` / `ui/data-table` fits.
- [ ] No inline KPI card — use `ui/kpi-card`.
- [ ] No ad-hoc status color — use `ui/status-chip` + `lib/ui/status-tone`.
- [ ] No inline empty-state — use `ui/empty-state`.
- [ ] No hardcoded surface/brand hex — use tokens (`bg-card`, `bg-primary`, …).
- [ ] New shared component added to this index.

## Primitives — Forms
| Component | Import | Use |
|---|---|---|
| Button | `{ Button } from "@/components/ui/button"` | All buttons (variants: default/outline/secondary/ghost/destructive/link; sizes xs–lg/icon) |
| Input | `{ Input } from "@/components/ui/input"` | Text inputs |
| Textarea | `{ Textarea } from "@/components/ui/textarea"` | Multi-line input |
| Select | `{ Select, … } from "@/components/ui/select"` | Dropdown select |
| Checkbox | `{ Checkbox } from "@/components/ui/checkbox"` | Checkbox |
| Switch | `{ Switch } from "@/components/ui/switch"` | Toggle switch |
| Label | `{ Label } from "@/components/ui/label"` | Field label |
| **Field** | `{ Field } from "@/components/ui/field"` | **label + control + description/error wrapper** (replaces inline `<label>`+control) |

## Primitives — Display
| Component | Import | Use |
|---|---|---|
| Card | `{ Card, CardHeader, CardContent, … } from "@/components/ui/card"` | Surface panel (`--card`) |
| Badge | `{ Badge } from "@/components/ui/badge"` | Generic capsule label |
| Avatar | `{ Avatar, … } from "@/components/ui/avatar"` | User/candidate avatar |
| Separator | `{ Separator } from "@/components/ui/separator"` | Divider |
| **Table** | `{ Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"` | **Base table (§7.8). Replaces raw `<table>`** |
| **Skeleton** | `{ Skeleton } from "@/components/ui/skeleton"` | **Loading placeholder (replaces inline `animate-pulse`)** |
| **StatusDot** | `{ StatusDot } from "@/components/ui/status-dot"` | **8px status dot (tone via status-tone)** |
| **ScoreBar** | `{ ScoreBar } from "@/components/ui/score-bar"` | **Threshold-colored score track (≠ progress)** |
| Progress | `{ Progress } from "@/components/ui/progress"` | Neutral progress bar |

## Primitives — Overlay / Nav
| Component | Import | Use |
|---|---|---|
| Dialog | `@/components/ui/dialog` | Modal dialog |
| Sheet | `@/components/ui/sheet` | Side sheet |
| Popover | `@/components/ui/popover` | Popover |
| DropdownMenu | `@/components/ui/dropdown-menu` | Menu |
| Tooltip | `@/components/ui/tooltip` | Tooltip (provider at root) |
| Tabs | `{ Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"` | Underline tabs |
| **Segmented** | `{ Segmented } from "@/components/ui/segmented"` | **Mode switch pill (§7.7d)** |

## Primitives — Feedback
| Component | Import | Use |
|---|---|---|
| Alert | `{ Alert, AlertTitle, … } from "@/components/ui/alert"` | Inline alert |
| Toast | `toast` from `sonner` (root `<Toaster>` in `ui/sonner`) | Transient notifications |
| AiLoader | `@/components/ui/ai-loader` | AI/loading spinner |

## Composites (compose primitives)
| Component | Import | Use / replaces |
|---|---|---|
| **KpiCard** | `{ KpiCard } from "@/components/ui/kpi-card"` | KPI/stat card (label/value/icon/delta/hint). Replaces per-feature KPI impls |
| **KpiCardGrid** | `{ KpiCardGrid } from "@/components/ui/kpi-card-grid"` | Responsive 1→2→4 KPI strip |
| **StatusChip** | `{ StatusChip } from "@/components/ui/status-chip"` | Status capsule (tone or auto from `status`). Replaces `crm/status-badge` + inline chips |
| **EmptyState** | `{ EmptyState } from "@/components/ui/empty-state"` | Empty/no-data block. Replaces inline empty blocks |
| **DataTable** | `{ DataTable } from "@/components/ui/data-table"` | Column-driven table on `ui/table` |

## Layout / Shell
| Component | Import | Use |
|---|---|---|
| PageHeader | `import PageHeader from "@/components/ui/page-header"` | Page title + breadcrumb + actions (§7.4) |
| PageContainer | `import PageContainer from "@/components/ui/page-container"` | Page wrapper / max-width |
| App shell | `app-sidebar`, `app-navbar`, `app-content-header`, `page-breadcrumb`, `nav-shell` | Global shell (set once) |

## Utils
| Util | Import | Use |
|---|---|---|
| statusTone | `{ statusTone, toneChipClass, toneDotClass } from "@/lib/ui/status-tone"` | Single status→tone→color source |
| cn | `{ cn } from "@/lib/utils"` | className merge |

## Decorative (ambient only — never over content legibility)
`background-orbs`, `neural-network`, `premium-background`, `motion-wrapper`.

## Deprecated (do NOT use in new code)
`src/components/shares/*` — `SharedDashboardButton` → `Button`; `SharedStatusChip` → `StatusChip`;
`SharedDashboardPageHeader` → `PageHeader`. Rethemed to tokens but slated for removal.
