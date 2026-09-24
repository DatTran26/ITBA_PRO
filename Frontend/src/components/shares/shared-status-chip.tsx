import type { ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const sharedStatusChipVariants = cva(
  "inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold",
  {
    variants: {
      // Dark-tuned tints (design-guidelines §4.2). DEPRECATED — prefer ui/status-chip.
      tone: {
        neutral: "bg-muted text-muted-foreground",
        info: "bg-primary/15 text-primary",
        success: "bg-success/15 text-success",
        warning: "bg-warning/15 text-warning",
        danger: "bg-danger/15 text-danger",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  }
);

type SharedStatusChipProps = VariantProps<typeof sharedStatusChipVariants> & {
  children: ReactNode;
  className?: string;
};

export function SharedStatusChip({ children, tone, className }: SharedStatusChipProps) {
  return <span className={cn(sharedStatusChipVariants({ tone }), className)}>{children}</span>;
}

export { sharedStatusChipVariants };
