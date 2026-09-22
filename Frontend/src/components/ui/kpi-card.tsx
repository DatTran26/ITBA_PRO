import * as React from "react"
import { Minus, TrendingDown, TrendingUp, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"

// Canonical KPI/stat card (design-guidelines §7.7): label + icon → metric (largest, tabular-nums)
// → delta arrow. Data-driven; replaces the 6 per-feature KPI implementations.
export interface KpiCardProps {
  label: string
  value: string | number
  icon?: LucideIcon
  delta?: { value: number; direction?: "up" | "down" | "flat"; label?: string }
  hint?: string
  tone?: "default" | "ai"
  className?: string
}

function KpiCard({ label, value, icon: Icon, delta, hint, tone = "default", className }: KpiCardProps) {
  const dir =
    delta?.direction ??
    (delta ? (delta.value > 0 ? "up" : delta.value < 0 ? "down" : "flat") : "flat")
  const DeltaIcon = dir === "up" ? TrendingUp : dir === "down" ? TrendingDown : Minus
  const deltaColor =
    dir === "up" ? "text-success" : dir === "down" ? "text-danger" : "text-muted-foreground"

  return (
    <Card className={cn("gap-0 px-5 py-4", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {Icon && (
          <span
            className={cn(
              "flex size-7 items-center justify-center rounded-lg [&>svg]:size-4",
              tone === "ai" ? "bg-primary/15 text-primary" : "bg-primary/15 text-primary"
            )}
          >
            <Icon />
          </span>
        )}
      </div>
      <div className="mt-3 font-display text-3xl leading-none font-bold tabular-nums">{value}</div>
      {(delta || hint) && (
        <div className="mt-2 flex items-center gap-1.5 text-xs">
          {delta && (
            <span className={cn("inline-flex items-center gap-0.5 font-semibold", deltaColor)}>
              <DeltaIcon className="size-3" />
              {Math.abs(delta.value)}%
            </span>
          )}
          {(delta?.label ?? hint) && (
            <span className="text-muted-foreground">{delta?.label ?? hint}</span>
          )}
        </div>
      )}
    </Card>
  )
}

export { KpiCard }
