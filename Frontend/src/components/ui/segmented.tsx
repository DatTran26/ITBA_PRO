"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

// Segmented control (design-guidelines §7.7d): pill track, active lifts to surface-3 (accent) + e-1.
// Replaces bespoke mode switchers (e.g. dashboard/dashboard-mode-tabs).
export interface SegmentedOption<T extends string> {
  label: React.ReactNode
  value: T
  icon?: React.ReactNode
}

function Segmented<T extends string>({
  options,
  value,
  onValueChange,
  className,
  size = "default",
}: {
  options: SegmentedOption<T>[]
  value: T
  onValueChange: (value: T) => void
  className?: string
  size?: "default" | "sm"
}) {
  return (
    <div
      data-slot="segmented"
      role="tablist"
      className={cn(
        "inline-flex gap-0.5 rounded-xl border border-border bg-muted p-0.5",
        className
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onValueChange(opt.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg font-medium whitespace-nowrap transition-colors",
              size === "sm" ? "px-3 py-1 text-xs" : "px-3.5 py-1.5 text-[13px]",
              active
                ? "bg-accent text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {opt.icon}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

export { Segmented }
