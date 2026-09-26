"use client";

import { motion, useReducedMotion } from "framer-motion";
import ChartFrame, { type ChartTag } from "./chart-frame";
import { toneFor } from "@/lib/ui/tones";
import type { Slice } from "./types";

/** Danh sách thanh ngang: nhãn, thanh, con số. Dùng cho bảng xếp hạng ngắn
 *  (kỹ năng thiếu hụt, số người theo nhóm) — dễ đọc hơn cột dọc khi nhãn dài.
 *  Màu mặc định theo TÊN mục (toneFor), không theo thứ hạng: lọc lại không đổi màu. */
export default function HBarList({
    title, subtitle, tag, items, max = 6, valueSuffix = "", aside,
}: {
    title: string;
    subtitle?: string;
    tag?: ChartTag;
    items: (Omit<Slice, "color"> & { color?: string })[];
    /** Số dòng hiển thị. Phần dư gộp thành một dòng "khác". */
    max?: number;
    valueSuffix?: string;
    aside?: React.ReactNode;
}) {
    const reduce = useReducedMotion();
    const sorted = [...items].sort((a, b) => b.value - a.value);
    const head = sorted.slice(0, max);
    const rest = sorted.slice(max);
    if (rest.length) {
        head.push({
            label: `${rest.length} mục khác`,
            value: rest.reduce((s, x) => s + x.value, 0),
            color: "var(--muted-foreground)",
        });
    }
    const peak = Math.max(1, ...head.map((i) => i.value));

    return (
        <ChartFrame title={title} subtitle={subtitle} tag={tag} aside={aside} empty={items.length === 0}>
            <ul className="space-y-2.5">
                {head.map((item, i) => (
                    <li key={item.label} title={`${item.label}: ${item.value}${valueSuffix}`} className="grid grid-cols-[minmax(0,8rem)_1fr_auto] items-center gap-3">
                        <span className="text-xs font-semibold text-foreground/80 truncate">
                            {item.label}
                        </span>
                        <span className="h-2.5 rounded-full bg-muted overflow-hidden">
                            <motion.span
                                className="block h-full rounded-full"
                                style={{ backgroundColor: item.color ?? toneFor(item.label).mark }}
                                initial={reduce ? false : { width: 0 }}
                                animate={{ width: `${(item.value / peak) * 100}%` }}
                                transition={{ duration: 0.6, delay: i * 0.04, ease: "circOut" }}
                            />
                        </span>
                        <span className="text-sm font-bold text-foreground tabular-nums">
                            {item.value}{valueSuffix}
                        </span>
                    </li>
                ))}
            </ul>
        </ChartFrame>
    );
}
