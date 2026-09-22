import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toneByName, type ToneName } from "@/lib/ui/tones";

/** Card một nhóm thiết lập cho trang FORM (settings, profile...), cùng họ card
 *  dashboard HR: icon tông màu + tiêu đề đậm + phụ đề, rồi nội dung. `id` để
 *  mục lục bên trái nhảy tới (scroll-mt chừa chỗ cho topbar dính). */
export default function FormSection({
    id, icon: Icon, tone = "blue", title, subtitle, aside, children, className, bodyClassName,
}: {
    id?: string;
    icon: LucideIcon;
    tone?: ToneName;
    title: string;
    subtitle?: string;
    aside?: ReactNode;
    children: ReactNode;
    className?: string;
    bodyClassName?: string;
}) {
    const t = toneByName(tone);
    return (
        <section
            id={id}
            className={cn(
                "scroll-mt-24 rounded-2xl border border-border bg-card overflow-hidden",
                "shadow-[0_2px_14px_color-mix(in_srgb,var(--primary)_8%,transparent)]",
                className,
            )}
        >
            <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border">
                <div className="flex items-center gap-3 min-w-0">
                    <span className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center" style={{ backgroundColor: t.bg }}>
                        <Icon className="w-4 h-4" style={{ color: t.mark }} />
                    </span>
                    <div className="min-w-0">
                        <h2 className="text-base font-bold text-foreground leading-tight">{title}</h2>
                        {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
                    </div>
                </div>
                {aside}
            </header>
            <div className={cn("p-1", bodyClassName)}>{children}</div>
        </section>
    );
}

/** Mục lục dính cho trang FORM nhiều nhóm; chỉ hiện ở màn rộng (xl). */
export function FormSectionNav({ items }: { items: { id: string; label: string; icon: LucideIcon; tone?: ToneName }[] }) {
    return (
        <nav aria-label="Các nhóm thiết lập" className="hidden xl:block">
            <ul className="sticky top-24 space-y-1">
                {items.map(({ id, label, icon: Icon, tone = "blue" }) => (
                    <li key={id}>
                        <a
                            href={`#${id}`}
                            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-card hover:text-foreground transition-colors"
                        >
                            <Icon className="w-4 h-4 shrink-0" style={{ color: toneByName(tone).mark }} />
                            <span className="truncate">{label}</span>
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
