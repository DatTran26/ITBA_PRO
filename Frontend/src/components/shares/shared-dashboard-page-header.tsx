import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SharedDashboardPageHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function SharedDashboardPageHeader({
  title,
  description,
  actions,
  className,
}: SharedDashboardPageHeaderProps) {
  return (
    <div className={cn("mb-8 flex flex-col justify-between gap-6 sm:flex-row sm:items-center", className)}>
      <div className="space-y-1">
        <h1 className="font-display text-[28px] font-bold leading-9 tracking-tight text-[#ECF0F7] sm:text-4xl sm:font-extralight">
          {title}
        </h1>
        {description ? <p className="max-w-3xl text-sm leading-5 text-[#5A6882]">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
