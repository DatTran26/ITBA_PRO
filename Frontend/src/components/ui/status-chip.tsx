import * as React from "react"

import { cn } from "@/lib/utils"
import { StatusDot } from "@/components/ui/status-dot"
import { statusTone, toneChipClass, type StatusTone } from "@/lib/ui/status-tone"

// Canonical status chip: badge capsule + tone tint + optional dot (design-guidelines §4.2/§7.9).
// Tone resolved from `tone` prop or auto-mapped from `status` via lib/ui/status-tone.
// Replaces crm/status-badge + inline status chips.
function StatusChip({
  status,
  tone,
  label,
  dot = true,
  className,
  ...props
}: Omit<React.ComponentProps<"span">, "children"> & {
  status?: string
  tone?: StatusTone
  label?: React.ReactNode
  dot?: boolean
}) {
  const resolved: StatusTone = tone ?? (status ? statusTone(status) : "neutral")
  return (
    <span
      data-slot="status-chip"
      data-tone={resolved}
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        toneChipClass[resolved],
        className
      )}
      {...props}
    >
      {dot && <StatusDot tone={resolved} />}
      {label ?? status}
    </span>
  )
}

export { StatusChip }
