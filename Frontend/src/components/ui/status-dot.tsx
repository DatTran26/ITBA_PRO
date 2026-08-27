import * as React from "react"

import { cn } from "@/lib/utils"
import { type StatusTone, toneDotClass } from "@/lib/ui/status-tone"

// 8px status dot (design-guidelines §7.7b). Tone via lib/ui/status-tone.
// Replaces inline `w-1.5 h-1.5 rounded-full bg-*` dots across the app.
function StatusDot({
  tone = "neutral",
  pulse = false,
  glow = false,
  className,
  ...props
}: React.ComponentProps<"span"> & {
  tone?: StatusTone
  pulse?: boolean
  glow?: boolean
}) {
  return (
    <span
      data-slot="status-dot"
      data-tone={tone}
      className={cn(
        "inline-block size-2 shrink-0 rounded-full",
        toneDotClass[tone],
        glow && "shadow-[0_0_8px_currentColor]",
        pulse && "animate-pulse",
        className
      )}
      {...props}
    />
  )
}

export { StatusDot }
