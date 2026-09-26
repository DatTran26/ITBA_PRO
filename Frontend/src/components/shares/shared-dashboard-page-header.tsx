import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toneByName, type ToneName } from "@/lib/ui/tones";

type SharedDashboardPageHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
  /** Icon trong ô vuông bo góc bên trái tiêu đề, như header Dashboard. */
  icon?: LucideIcon;
  /** Pill cạnh tiêu đề (vd "12 mẫu"). */
  badge?: { label: string; tone?: ToneName };
};

/** Header trang theo dashboard HR: icon box + H1 đậm + pill + mô tả, actions bên phải. */
export function SharedDashboardPageHeader({
  title,
  description,
  actions,
  className,
  icon: Icon,
  badge,
}: SharedDashboardPageHeaderProps) {
  const tone = badge ? toneByName(badge.tone ?? "blue") : null;
  return (
    <div className={cn("mb-8 flex flex-col justify-between gap-6 sm:flex-row sm:items-center", className)}>
      <div className="flex items-center gap-4 min-w-0">
        {Icon ? (
          <div className="w-12 h-12 shrink-0 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-inner">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        ) : null}
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl font-black leading-tight tracking-tight text-foreground md:text-4xl">
              {title}
            </h1>
            {tone ? (
              <span
                className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                style={{ color: tone.ink, backgroundColor: tone.bg }}
              >
                {badge!.label}
              </span>
            ) : null}
          </div>
          {description ? <p className="max-w-3xl text-sm font-medium leading-5 text-muted-foreground">{description}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2 sm:shrink-0">{actions}</div> : null}
    </div>
  );
}
