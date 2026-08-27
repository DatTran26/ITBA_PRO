import * as React from "react"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

// Form field wrapper: label + control (children) + description/error (design-guidelines §7.10).
// Replaces inline <label> + control + hint/error patterns scattered across forms.
function Field({
  label,
  htmlFor,
  description,
  error,
  required = false,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  label?: React.ReactNode
  htmlFor?: string
  description?: React.ReactNode
  error?: React.ReactNode
  required?: boolean
  children?: React.ReactNode
}) {
  return (
    <div data-slot="field" className={cn("flex flex-col gap-1.5", className)} {...props}>
      {label && (
        <Label htmlFor={htmlFor} className="text-xs font-semibold">
          {label}
          {required && <span className="ml-0.5 text-destructive">*</span>}
        </Label>
      )}
      {children}
      {description && !error && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

export { Field }
