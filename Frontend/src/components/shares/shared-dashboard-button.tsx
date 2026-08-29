"use client";

import type { ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const sharedDashboardButtonVariants = cva(
  // DEPRECATED component (see plans/260524-1544-component-consolidation). Retheme: light
  // palette → dark tokens; sizes/shape kept to preserve layout. New work: use ui/Button.
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border border-transparent bg-primary text-primary-foreground shadow-[0_8px_28px_rgba(91,108,240,0.35)] hover:bg-primary/90",
        primary:
          "border border-transparent bg-primary text-primary-foreground shadow-[0_8px_28px_rgba(91,108,240,0.35)] hover:bg-primary/90",
        outline:
          "border border-border bg-white/[0.04] text-foreground hover:bg-white/[0.08]",
        secondary:
          "border border-border bg-white/[0.04] text-foreground hover:bg-white/[0.08]",
        tertiary:
          "border border-transparent bg-transparent text-primary hover:bg-primary/10",
        ghost:
          "border border-transparent bg-transparent text-muted-foreground hover:bg-white/5 hover:text-foreground",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-4 text-[13px]",
        md: "h-11 px-5",
        lg: "h-12 px-6",
        icon: "h-10 w-10 px-0",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "secondary",
      size: "md",
      fullWidth: false,
    },
  }
);

type SharedDashboardButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  "children" | "variant" | "size"
> &
  VariantProps<typeof sharedDashboardButtonVariants> & {
    children?: ReactNode;
    leadingIcon?: ReactNode;
    trailingIcon?: ReactNode;
    labelClassName?: string;
  };

export function SharedDashboardButton({
  children,
  leadingIcon,
  trailingIcon,
  className,
  labelClassName,
  variant,
  size,
  fullWidth,
  ...props
}: SharedDashboardButtonProps) {
  return (
    <Button
      className={cn(sharedDashboardButtonVariants({ variant, size, fullWidth }), className)}
      {...props}
    >
      {leadingIcon}
      <span className={cn("leading-none", labelClassName)}>{children}</span>
      {trailingIcon}
    </Button>
  );
}

export { sharedDashboardButtonVariants };
