import * as React from "react"

import { cn } from "@/lib/utils"

// Responsive KPI strip (design-guidelines §3.3): 1 → 2 → 4 columns.
function KpiCardGrid({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="kpi-card-grid"
      className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}
      {...props}
    />
  )
}

export { KpiCardGrid }
