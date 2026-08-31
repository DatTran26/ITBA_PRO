import type { ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const sharedStatusChipVariants = cva(
  "inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold",
  {
    variants: {
      // Dark-tuned tints (design-guidelines §4.2). DEPRECATED — prefer ui/status-chip.
      tone: {
        neutral: "bg-white/[0.06] text-[#8B99B0]",
        info: "bg-[#5B6CF0]/15 text-[#7C8FFF]",
        success: "bg-[#34D399]/15 text-[#34D399]",
        warning: "bg-[#FBBF24]/15 text-[#FBBF24]",
        danger: "bg-[#FB7185]/15 text-[#FB7185]",
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
