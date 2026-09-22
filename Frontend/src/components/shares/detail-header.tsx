import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toneFor } from "@/lib/ui/tones";

export interface DetailInfoItem {
    icon: LucideIcon;
    label: ReactNode;
}

/** Header trang DETAIL theo dashboard HR: avatar tông màu (chữ cái đầu hoặc icon),
 *  tên đậm + trạng thái, dòng phụ, slot tag, actions phải, và hàng chip thông tin. */
export default function DetailHeader({
    title, avatarIcon: AvatarIcon, status, subtitle, tags, actions, info = [], className,
}: {
    title: string;
    /** Không truyền → avatar là chữ cái đầu của `title`. */
    avatarIcon?: LucideIcon;
    status?: ReactNode;
    subtitle?: ReactNode;
    tags?: ReactNode;
    actions?: ReactNode;
    info?: DetailInfoItem[];
    className?: string;
}) {
    const tone = toneFor(title);
    return (
        <div className={cn(
            "mb-6 rounded-2xl border border-border bg-card p-5 sm:p-6",
            "shadow-[0_2px_14px_color-mix(in_srgb,var(--primary)_8%,transparent)]",
            className,
        )}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4 min-w-0">
                    <div
                        className="w-16 h-16 shrink-0 rounded-2xl flex items-center justify-center font-display text-2xl font-black"
                        style={{ color: tone.ink, backgroundColor: tone.bg }}
                        aria-hidden
                    >
                        {AvatarIcon ? <AvatarIcon className="w-7 h-7" /> : title.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2.5">
                            <h1 className="font-display text-2xl font-black leading-tight tracking-tight text-foreground md:text-3xl">{title}</h1>
                            {status}
                        </div>
                        {subtitle && <div className="text-sm font-medium text-muted-foreground">{subtitle}</div>}
                        {tags}
                    </div>
                </div>
                {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
            </div>

            {info.length > 0 && (
                <ul className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
                    {info.map(({ icon: Icon, label }, i) => (
                        <li key={i} className="inline-flex items-center gap-2 rounded-full bg-muted/60 px-3 py-1.5 text-xs font-semibold text-foreground/80">
                            <Icon className="w-3.5 h-3.5 text-primary/70" />
                            {label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
