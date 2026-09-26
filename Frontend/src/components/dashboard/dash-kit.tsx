import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/ui/tones";

/** Thẻ số liệu theo kiểu KPI của tab HR (bento-metric-strip): nhãn đậm nhỏ, icon tròn
 *  tông màu góc phải, số lớn, pill tông bên dưới — dùng token thay cho hex cứng. */
export function KpiTile({ label, value, icon: Icon, tone, pill, className }: {
    label: string;
    value: ReactNode;
    icon: LucideIcon;
    tone: Tone;
    pill?: string;
    className?: string;
}) {
    return (
        <div className={cn(
            "flex flex-col justify-between rounded-2xl border border-border bg-card p-4",
            "shadow-[0_2px_14px_color-mix(in_srgb,var(--primary)_8%,transparent)]",
            className,
        )}>
            <div className="flex items-center justify-between gap-2">
                <span className="truncate text-xs font-bold text-muted-foreground">{label}</span>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full" style={{ backgroundColor: tone.bg, color: tone.ink }}>
                    <Icon className="h-4 w-4" />
                </span>
            </div>
            <div className="mt-2.5">
                <div className="text-[28px] font-extrabold leading-none tracking-tight tabular-nums text-foreground">{value}</div>
                {pill && (
                    <span className="mt-2 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold" style={{ backgroundColor: tone.bg, color: tone.ink }}>
                        {pill}
                    </span>
                )}
            </div>
        </div>
    );
}

/** Một dòng việc theo kiểu Action Center của tab HR: nền/viền nhạt cùng tông,
 *  ô icon bo góc, tiêu đề đậm + dòng phụ, pill ưu tiên và mũi tên nếu có link. */
export function ActionRow({ icon: Icon, tone, title, sub, pill, href, action }: {
    icon: LucideIcon;
    tone: Tone;
    title: ReactNode;
    sub?: ReactNode;
    pill?: string;
    href?: string;
    action?: ReactNode;
}) {
    const body = (
        <>
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-card" style={{ color: tone.ink }}>
                <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-foreground">{title}</span>
                {sub && <span className="block truncate text-xs text-muted-foreground">{sub}</span>}
            </span>
            {pill && (
                <span className="shrink-0 rounded-full bg-card px-2.5 py-0.5 text-[11px] font-bold" style={{ color: tone.ink }}>{pill}</span>
            )}
            {action}
            {href && <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
        </>
    );
    const cls = "flex items-center gap-2.5 rounded-xl border p-2.5 transition-colors";
    const style = { borderColor: `color-mix(in srgb, ${tone.mark} 30%, transparent)`, backgroundColor: tone.bg };
    return href ? (
        <Link href={href} className={cn(cls, "hover:brightness-[0.98]")} style={style}>{body}</Link>
    ) : (
        <div className={cls} style={style}>{body}</div>
    );
}
