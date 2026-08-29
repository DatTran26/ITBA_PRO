import * as React from "react"

import { cn } from "@/lib/utils"

// Threshold-colored score bar (design-guidelines §7.7b): >80 emerald, >65 amber, else rose.
// Distinct from ui/progress (neutral progress). Replaces inline value+track patterns.
function scoreColor(pct: number): string {
  if (pct > 80) return "#34D399"
  if (pct > 65) return "#FBBF24"
  return "#FB7185"
}

function ScoreBar({
  value,
  max = 100,
  showValue = true,
  trackWidth = 60,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  value: number
  max?: number
  showValue?: boolean
  trackWidth?: number
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  const color = scoreColor(pct)
  return (
    <div
      data-slot="score-bar"
      className={cn("inline-flex items-center gap-2", className)}
      {...props}
    >
      {showValue && (
        <span className="text-xs font-semibold tabular-nums">{Math.round(value)}</span>
      )}
      <span
        className="h-1 overflow-hidden rounded-full bg-white/10"
        style={{ width: trackWidth }}
      >
        <span
          className="block h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </span>
    </div>
  )
}

export { ScoreBar }
