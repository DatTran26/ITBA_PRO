import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toneByName, type ToneName } from "@/lib/ui/tones";

export interface ChartTag {
    label: string;
    tone?: ToneName;
}

/** Khung chung của mọi khối biểu đồ, theo card dashboard HR: tiêu đề đậm,
 *  phụ đề, pill tông màu góc phải (hoặc `aside` tuỳ biến), rồi vùng vẽ.
 *  Mọi primitive dùng khung này để giữ Shape Consistency Lock (`rounded-2xl`). */
export default function ChartFrame({
    title, subtitle, tag, aside, children, className, empty, emptyLabel = "Chưa có dữ liệu",
}: {
    title: string;
    subtitle?: string;
    tag?: ChartTag;
    aside?: ReactNode;
    children: ReactNode;
    className?: string;
    empty?: boolean;
    emptyLabel?: string;
}) {
    const tone = tag ? toneByName(tag.tone ?? "blue") : null;
    return (
        <Card className={cn(
            "bg-card border-border rounded-2xl h-full transition-shadow duration-200",
            "shadow-[0_2px_14px_color-mix(in_srgb,var(--primary)_8%,transparent)]",
            "hover:shadow-[0_8px_24px_color-mix(in_srgb,var(--primary)_14%,transparent)]",
            className,
        )}>
            <CardContent className="p-5 h-full flex flex-col">
                <div className="flex items-start justify-between gap-3 mb-4 pb-3 border-b border-border">
                    <div className="min-w-0">
                        <h3 className="text-base font-bold text-foreground leading-tight">{title}</h3>
                        {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
                    </div>
                    {aside ?? (tone && (
                        <span
                            className="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                            style={{ color: tone.ink, backgroundColor: tone.bg }}
                        >
                            {tag!.label}
                        </span>
                    ))}
                </div>
                {empty ? (
                    <p className="flex-1 grid place-items-center text-xs text-muted-foreground py-8">
                        {emptyLabel}
                    </p>
                ) : (
                    <div className="flex-1 min-h-0">{children}</div>
                )}
            </CardContent>
        </Card>
    );
}
