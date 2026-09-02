import * as React from "react"

import { cn } from "@/lib/utils"

// Canonical empty state (design-guidelines §7.12). Replaces management/entity-empty-state
// and inline "no data" blocks across the app.
function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "title"> & {
  icon?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card/40 px-6 py-12 text-center",
        className
      )}
      {...props}
    >
      {icon && (
        <div className="flex size-11 items-center justify-center rounded-xl bg-white/[0.04] text-muted-foreground [&>svg]:size-5">
          {icon}
        </div>
      )}
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description && (
          <p className="mx-auto max-w-sm text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}

export { EmptyState }
